const config = require("./config");

function mean(a) {
  return a.reduce((s, x) => s + x, 0) / a.length;
}
function std(a, m) {
  if (a.length < 2) return 0;
  const v = a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1);
  return Math.sqrt(v);
}
const clampBps = (x) => Math.max(0, Math.min(10000, Math.round(x)));

// Unsupervised anomaly detection: z-score of the new value against the rolling
// baseline. Returns risk/health in basis points (0..10000 = 0..100.00%).
function score(baseline, value) {
  if (baseline.length < 5) {
    return { z: 0, risk: 0, health: 10000, anomaly: false, direction: "flat", pctVsBaseline: 0, warmup: true };
  }
  const m = mean(baseline);
  let s = std(baseline, m);
  // Floor std at 0.5% of |mean| so near-constant live series (e.g. token supply)
  // don't produce absurd z-scores / false anomalies on negligible changes.
  const sFloor = Math.abs(m) * 0.005;
  if (s < sFloor) s = sFloor;
  let z = s === 0 ? 0 : (value - m) / s;
  z = Math.max(-99, Math.min(99, z)); // clamp for display sanity
  const absZ = Math.abs(z);
  const risk = clampBps((absZ / config.riskZMax) * 10000);
  const health = clampBps(10000 - risk);
  const anomaly = absZ >= config.anomalyZ;
  const direction = z > 0 ? "up" : z < 0 ? "down" : "flat";
  const pctVsBaseline = m !== 0 ? ((value - m) / m) * 100 : 0;
  return {
    z: Number(z.toFixed(2)),
    risk,
    health,
    anomaly,
    direction,
    mean: m,
    pctVsBaseline: Number(pctVsBaseline.toFixed(2)),
    warmup: false,
  };
}

module.exports = { score };
