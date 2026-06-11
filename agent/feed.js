const fs = require("fs");
const path = require("path");
const store = require("./store");

const EXPLORERS = {
  mantleSepolia: "https://sepolia.mantlescan.xyz",
  mantleMainnet: "https://mantlescan.xyz",
};

// bps (0..10000) -> percent (0..100, one decimal)
const toPct = (bps) => Math.round(bps) / 100;

function loadDeployment() {
  if (process.env.IGNORE_DEPLOYMENT === "1") return null;
  const p = path.join(__dirname, "..", "deployments.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

// Assemble the compact feed the dashboard + bot consume.
function buildFeed() {
  const signals = store.readSignals();
  const dep = loadDeployment();

  const byKey = new Map();
  for (const r of signals) {
    if (!byKey.has(r.key)) byKey.set(r.key, []);
    byKey.get(r.key).push(r);
  }

  const protocols = [];
  for (const [key, arr] of byKey) {
    const latest = arr[arr.length - 1];
    protocols.push({
      key,
      label: latest.label,
      metric: latest.metric,
      value: latest.value,
      health: toPct(latest.health),
      risk: toPct(latest.risk),
      anomaly: latest.anomaly,
      z: latest.z,
      pctVsBaseline: latest.pctVsBaseline,
      ts: latest.ts,
      message: latest.message,
      history: arr.slice(-24).map((x) => toPct(x.health)),
      source: latest.extra && latest.extra.source ? latest.extra.source : key === "mantle-network" ? "live" : "onchain",
      txHash: latest.txHash || null,
    });
  }
  protocols.sort((a, b) => b.risk - a.risk); // riskiest first

  const alerts = signals
    .filter((r) => r.anomaly)
    .slice(-25)
    .reverse()
    .map((r) => ({
      ts: r.ts,
      label: r.label,
      message: r.message,
      health: toPct(r.health),
      risk: toPct(r.risk),
      txHash: r.txHash || null,
    }));

  const avgHealth = protocols.length
    ? Math.round((protocols.reduce((s, p) => s + p.health, 0) / protocols.length) * 10) / 10
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    deployed: !!dep,
    network: dep ? dep.network : null,
    agentId: dep ? dep.agentId : null,
    contracts: dep ? dep.contracts : null,
    explorer: dep ? EXPLORERS[dep.network] || null : null,
    stats: { totalSignals: signals.length, anomalies: alerts.length, avgHealth, protocols: protocols.length },
    protocols,
    alerts,
  };
}

function writeFeed() {
  const feed = buildFeed();
  const webDir = path.join(__dirname, "..", "web");
  if (!fs.existsSync(webDir)) fs.mkdirSync(webDir, { recursive: true });
  fs.writeFileSync(path.join(webDir, "feed.json"), JSON.stringify(feed, null, 2));
  return feed;
}

module.exports = { buildFeed, writeFeed };
