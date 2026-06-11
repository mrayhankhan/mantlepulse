require("dotenv").config();
const { buildFeed } = require("../agent/feed");

// Zero-dependency Telegram bot (uses global fetch). Free.
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : null;
const POLL_SEC = Number(process.env.BOT_POLL_SEC || 20);

if (!TOKEN) {
  console.log("TELEGRAM_BOT_TOKEN not set. Get one free from @BotFather, add it to .env, then re-run `npm run bot`.");
  process.exit(0);
}

async function tg(method, body) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

function statusText() {
  const f = buildFeed();
  if (!f.protocols.length) return "No signals yet. Start the agent: `npm run agent`";
  const lines = f.protocols.map((p) => {
    const icon = p.anomaly ? "⚠️" : p.health >= 70 ? "✅" : "🟡";
    return `${icon} *${p.label}* — health ${p.health.toFixed(1)}/100, risk ${p.risk.toFixed(1)} (z=${p.z})`;
  });
  const head = `*MantlePulse* — Mantle DeFi health\nAvg health ${f.stats.avgHealth}/100 · ${f.stats.anomalies} anomalies${
    f.deployed ? ` · on-chain on ${f.network}` : ""
  }`;
  return `${head}\n\n${lines.join("\n")}`;
}

function alertsText() {
  const f = buildFeed();
  if (!f.alerts.length) return "No anomalies in range. All protocols nominal. ✅";
  return ["*Recent anomalies*", ...f.alerts.slice(0, 8).map((a) => `⚠️ ${a.message}`)].join("\n\n");
}

const WELCOME =
  "*MantlePulse* 🩺\nAutonomous AI agent watching the health of Mantle's DeFi stack and recording verifiable risk signals on-chain.\n\n" +
  "Commands:\n/status — current protocol health\n/alerts — recent anomalies\n/watch — get pushed new anomalies";

const subscribers = new Set();
if (process.env.TELEGRAM_CHAT_ID) subscribers.add(process.env.TELEGRAM_CHAT_ID);
let lastAlertTs = 0;

async function handle(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim().toLowerCase();
  if (text.startsWith("/start"))
    return tg("sendMessage", { chat_id: chatId, text: WELCOME, parse_mode: "Markdown" });
  if (text.startsWith("/status"))
    return tg("sendMessage", { chat_id: chatId, text: statusText(), parse_mode: "Markdown" });
  if (text.startsWith("/alerts"))
    return tg("sendMessage", { chat_id: chatId, text: alertsText(), parse_mode: "Markdown" });
  if (text.startsWith("/watch")) {
    subscribers.add(chatId);
    return tg("sendMessage", { chat_id: chatId, text: "🔔 Subscribed. I'll ping you on new anomalies." });
  }
  return tg("sendMessage", { chat_id: chatId, text: "Try /status, /alerts or /watch." });
}

async function pushNewAnomalies() {
  const f = buildFeed();
  const newest = f.alerts[0];
  if (!newest) return;
  if (lastAlertTs === 0) {
    lastAlertTs = newest.ts; // skip backlog on first run
    return;
  }
  const fresh = f.alerts.filter((a) => a.ts > lastAlertTs).reverse();
  if (!fresh.length) return;
  lastAlertTs = newest.ts;
  for (const chatId of subscribers) {
    for (const a of fresh) {
      await tg("sendMessage", { chat_id: chatId, text: `⚠️ ${a.message}`, parse_mode: "Markdown" });
    }
  }
}

async function main() {
  const me = await tg("getMe", {});
  console.log(`MantlePulse bot online as @${me.result && me.result.username}. Ctrl-C to stop.`);
  setInterval(() => pushNewAnomalies().catch(() => {}), POLL_SEC * 1000);
  let offset = 0;
  for (;;) {
    try {
      const res = await fetch(`${API}/getUpdates?timeout=30&offset=${offset}`);
      const data = await res.json();
      if (data.ok) {
        for (const u of data.result) {
          offset = u.update_id + 1;
          if (u.message) await handle(u.message);
        }
      }
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
