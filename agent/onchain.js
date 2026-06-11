const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

function loadDeployment() {
  const p = path.join(__dirname, "..", "deployments.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const SIGNAL_ABI = [
  "function recordSignal(uint256 agentId, bytes32 protocol, uint16 healthScore, uint16 riskScore, bool anomaly, bytes32 dataHash) external returns (uint256)",
];

// Returns a writer bound to the deployed SignalRegistry, or null if not ready.
function makeWriter() {
  const dep = loadDeployment();
  const pk = process.env.PRIVATE_KEY;
  if (!dep || !pk) return null;
  let rpc;
  if (dep.network === "mantleMainnet") rpc = process.env.MANTLE_MAINNET_RPC || "https://rpc.mantle.xyz";
  else if (dep.network === "localhost" || dep.network === "hardhat") rpc = "http://127.0.0.1:8545";
  else rpc = process.env.MANTLE_SEPOLIA_RPC || "https://rpc.sepolia.mantle.xyz";
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk.startsWith("0x") ? pk : `0x${pk}`, provider);
  const agentId = process.env.AGENT_ID ? BigInt(process.env.AGENT_ID) : BigInt(dep.agentId);
  const contract = new ethers.Contract(dep.contracts.SignalRegistry, SIGNAL_ABI, wallet);
  return { contract, agentId, address: dep.contracts.SignalRegistry, network: dep.network };
}

async function pushSignal(writer, target, snapshot, s) {
  const protocol = ethers.encodeBytes32String(target.key.slice(0, 31));
  const dataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(snapshot)));
  const tx = await writer.contract.recordSignal(writer.agentId, protocol, s.health, s.risk, s.anomaly, dataHash);
  const receipt = await tx.wait();
  return receipt.hash;
}

module.exports = { makeWriter, pushSignal, loadDeployment };
