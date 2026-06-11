// Free, templated plain-English narration of a signal. No paid LLM.
function pct(x) {
  return `${x >= 0 ? "+" : ""}${x.toFixed(1)}%`;
}
function toScore100(bps) {
  return (bps / 100).toFixed(1);
}
function fmt(x) {
  return typeof x === "number" && Math.abs(x) >= 1000 ? Math.round(x).toLocaleString() : x;
}

function narrate(target, metricValue, s) {
  const health = toScore100(s.health);
  const risk = toScore100(s.risk);
  const metric = target.metric.replace(/_/g, " ");
  if (s.warmup) {
    return `🟡 ${target.label}: warming up baseline for ${metric} (now ${fmt(metricValue)}).`;
  }
  if (s.anomaly) {
    const dir = s.direction === "down" ? "dropped" : "spiked";
    return `⚠️ ANOMALY — ${target.label}: ${metric} ${dir} ${pct(s.pctVsBaseline)} vs baseline (z=${s.z}). Risk ${risk}/100 · health ${health}/100.`;
  }
  return `✅ ${target.label}: ${metric} stable (${pct(s.pctVsBaseline)} vs baseline, z=${s.z}). Health ${health}/100.`;
}

module.exports = { narrate, toScore100 };
