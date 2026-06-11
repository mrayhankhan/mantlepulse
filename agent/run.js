const config = require("./config");
const { fetchMetric } = require("./datasource");
const { score } = require("./detector");
const { narrate } = require("./narrate");
const store = require("./store");
const { makeWriter, pushSignal } = require("./onchain");
const { writeFeed } = require("./feed");

const once = process.argv.includes("--once");
const forcePush = process.argv.includes("--push");
// Optional: warm up faster, e.g. --cycles 12 (useful for seeding a demo baseline).
const cyclesArg = process.argv.indexOf("--cycles");
const cycles = cyclesArg !== -1 ? Number(process.argv[cyclesArg + 1]) : 1;

async function cycle() {
  const wantPush = config.pushOnchain || forcePush;
  const writer = wantPush ? makeWriter() : null;
  if (wantPush && !writer) {
    console.log("⚠️  Push requested but no deployment/.env key — running compute-only.");
  }
  const ts = Math.floor(Date.now() / 1000);
  for (const target of config.targets) {
    let obs;
    try {
      obs = await fetchMetric(target);
    } catch (e) {
      console.log(`   ${target.label}: fetch failed (${e.message}) — skipping`);
      continue;
    }
    const baseline = store.getBaseline(target.key); // history BEFORE this sample
    const s = score(baseline, obs.value);
    store.pushBaseline(target.key, obs.value, config.baselineWindow);

    const message = narrate(target, obs.value, s);
    const record = { ts, key: target.key, label: target.label, metric: target.metric, value: obs.value, ...s, message, extra: obs.extra || {} };

    let txHash = null;
    if (writer && !s.warmup) {
      try {
        txHash = await pushSignal(writer, target, record, s);
        record.txHash = txHash;
        record.network = writer.network;
      } catch (e) {
        console.log(`   on-chain push failed for ${target.label}: ${e.message}`);
      }
    }
    store.appendSignal(record);
    console.log(message + (txHash ? `  ⛓️  ${txHash}` : ""));
  }
  writeFeed(); // refresh the dashboard feed (web/feed.json)
}

async function main() {
  console.log(`MantlePulse agent — reading: ${config.dataRpc}`);
  for (let i = 0; i < Math.max(1, cycles); i++) {
    if (cycles > 1) console.log(`\n— cycle ${i + 1}/${cycles} —`);
    await cycle();
  }
  if (once || cycles > 1) return;
  console.log(`\nLooping every ${config.intervalSec}s. Ctrl-C to stop.`);
  setInterval(() => cycle().catch((e) => console.error(e)), config.intervalSec * 1000);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
