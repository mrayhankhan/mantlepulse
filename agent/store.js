const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const BASELINES = path.join(DATA_DIR, "baselines.json");
const SIGNALS = path.join(DATA_DIR, "signals.json");

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}
function writeJson(file, data) {
  ensure();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// baselines: { [key]: number[] } rolling window of metric values
function getBaseline(key) {
  const all = readJson(BASELINES, {});
  return all[key] || [];
}
function pushBaseline(key, value, window) {
  const all = readJson(BASELINES, {});
  const arr = all[key] || [];
  arr.push(value);
  while (arr.length > window) arr.shift();
  all[key] = arr;
  writeJson(BASELINES, all);
  return arr;
}

// signals: array of recent signal records (consumed by dashboard + bot)
function appendSignal(record, max = 500) {
  const arr = readJson(SIGNALS, []);
  arr.push(record);
  while (arr.length > max) arr.shift();
  writeJson(SIGNALS, arr);
}
function readSignals() {
  return readJson(SIGNALS, []);
}

module.exports = { getBaseline, pushBaseline, appendSignal, readSignals, SIGNALS, BASELINES, DATA_DIR };
