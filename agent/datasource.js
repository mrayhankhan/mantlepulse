const { ethers } = require("ethers");
const config = require("./config");

const ERC20_ABI = [
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
];

let _provider;
function provider() {
  if (!_provider) _provider = new ethers.JsonRpcProvider(config.dataRpc);
  return _provider;
}

// REAL live metric: Mantle network gas utilization (%) + throughput (tps),
// averaged over the most recent blocks. Free, read-only.
async function fetchNetworkMetric() {
  const p = provider();
  const tip = await p.getBlockNumber();
  const n = config.blockSample;
  let totUsed = 0n,
    totLimit = 0n,
    txTotal = 0,
    firstTs = null,
    lastTs = null;
  for (let i = 0; i < n; i++) {
    const b = await p.getBlock(tip - i);
    if (!b) continue;
    totUsed += b.gasUsed;
    totLimit += b.gasLimit;
    txTotal += b.transactions.length;
    if (lastTs === null) lastTs = b.timestamp;
    firstTs = b.timestamp;
  }
  const utilization = totLimit > 0n ? Number((totUsed * 10000n) / totLimit) / 100 : 0;
  const span = lastTs && firstTs && lastTs > firstTs ? lastTs - firstTs : n;
  const tps = txTotal / Math.max(span, 1);
  return { value: utilization, extra: { tps: Number(tps.toFixed(3)), blocks: n, tipBlock: tip } };
}

// Protocol liquidity proxy. Live (ERC20 totalSupply) if a token address is
// configured; otherwise a simulated liquidity index so the pipeline always runs.
const _sim = {};
async function fetchProtocolMetric(target) {
  if (target.address) {
    try {
      const p = provider();
      const c = new ethers.Contract(target.address, ERC20_ABI, p);
      const [supply, dec] = await Promise.all([c.totalSupply(), c.decimals().catch(() => 18)]);
      return {
        value: Number(ethers.formatUnits(supply, dec)),
        extra: { source: "onchain", address: target.address },
      };
    } catch {
      // fall through to simulation if the on-chain read fails
    }
  }
  const base = _sim[target.key] ?? (_sim[target.key] = 1_000_000 * (0.5 + Math.random()));
  let next = base + base * (Math.random() - 0.5) * 0.04; // ~±2% random walk
  if (Math.random() < 0.05) next *= 0.85 + Math.random() * 0.1; // ~5% liquidity shock
  _sim[target.key] = next;
  return { value: Math.round(next), extra: { source: "simulated" } };
}

async function fetchMetric(target) {
  return target.type === "network" ? fetchNetworkMetric() : fetchProtocolMetric(target);
}

module.exports = { fetchMetric, provider };
