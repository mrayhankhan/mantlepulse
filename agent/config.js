require("dotenv").config();

// MantlePulse agent configuration. All free: reads live Mantle data over a public
// RPC (read-only, no gas) and writes signals to wherever you deployed (testnet by
// default). No paid APIs anywhere.
module.exports = {
  // Read REAL Mantle data from mainnet (free, read-only). Signals are written to
  // the deployed network (see agent/onchain.js + deployments.json).
  dataRpc: process.env.MANTLE_DATA_RPC || "https://rpc.mantle.xyz",

  // Rolling baseline window (samples) and anomaly sensitivity (z-score).
  baselineWindow: Number(process.env.BASELINE_WINDOW || 30),
  anomalyZ: Number(process.env.ANOMALY_Z || 2.5),
  riskZMax: Number(process.env.RISK_Z_MAX || 4),

  // Recent blocks sampled for network throughput / gas metrics.
  blockSample: Number(process.env.BLOCK_SAMPLE || 20),

  // Push computed signals on-chain each cycle (needs a deployment + funded key).
  pushOnchain: process.env.PUSH_ONCHAIN === "1",

  // Loop interval (seconds) when not running with --once.
  intervalSec: Number(process.env.AGENT_INTERVAL_SEC || 60),

  // What MantlePulse watches. "network" is live/real from RPC and needs no address.
  // "protocol" targets read on-chain when a token address is set, else simulate a
  // liquidity index so the full pipeline + dashboard always demo end-to-end.
  targets: [
    { key: "mantle-network", label: "Mantle Network", type: "network", metric: "gas_utilization_pct" },
    // WMNT (Wrapped MNT) — verified Mantle mainnet address. LIVE on-chain read.
    { key: "wmnt", label: "WMNT · Wrapped MNT", type: "protocol", metric: "supply_index", address: process.env.WMNT_TOKEN || "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8" },
    // Set these to verified Mantle token addresses in .env to go fully live;
    // otherwise the agent simulates a liquidity index so the demo still runs.
    { key: "merchant-moe", label: "Merchant Moe", type: "protocol", metric: "liquidity_index", address: process.env.MERCHANT_MOE_TOKEN || null },
    { key: "agni-finance", label: "Agni Finance", type: "protocol", metric: "liquidity_index", address: process.env.AGNI_TOKEN || null },
    // cmETH (mETH restaking receipt) — verified Mantle mainnet address. LIVE on-chain read.
    { key: "cmeth-rwa", label: "cmETH · Restaked ETH", type: "protocol", metric: "supply_index", address: process.env.CMETH_TOKEN || "0xe6829d9a7ee3040e1276fa75293bde931859e8fa" },
  ],
};
