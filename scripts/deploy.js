const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const net = await hre.ethers.provider.getNetwork();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("Network:   ", hre.network.name, `(chainId ${net.chainId})`);
  console.log("Deployer:  ", deployer.address);
  console.log("Balance:   ", hre.ethers.formatEther(balance), "MNT");
  if (balance === 0n) {
    throw new Error("Deployer has 0 MNT. Fund it from the faucet: https://faucet.sepolia.mantle.xyz");
  }

  // 1. Agent identity registry (ERC-8004-inspired)
  const Identity = await hre.ethers.getContractFactory("AgentIdentityRegistry");
  const identity = await Identity.deploy();
  await identity.waitForDeployment();
  const identityAddr = await identity.getAddress();
  console.log("\nAgentIdentityRegistry:", identityAddr);

  // 2. Signal registry (on-chain AI signal benchmarking)
  const Signal = await hre.ethers.getContractFactory("SignalRegistry");
  const signal = await Signal.deploy(identityAddr);
  await signal.waitForDeployment();
  const signalAddr = await signal.getAddress();
  console.log("SignalRegistry:       ", signalAddr);

  // 3. Register the MantlePulse agent (operator = deployer) and mint its AgentID NFT
  const domain = process.env.AGENT_DOMAIN || "mantlepulse.local";
  const tx = await identity.registerAgent(domain, deployer.address);
  await tx.wait();
  const agentId = await identity.resolveByAddress(deployer.address);
  console.log("\nRegistered AgentID:   ", agentId.toString(), `(domain: ${domain})`);

  const out = {
    network: hre.network.name,
    chainId: Number(net.chainId),
    deployer: deployer.address,
    agentId: agentId.toString(),
    contracts: { AgentIdentityRegistry: identityAddr, SignalRegistry: signalAddr },
    deployedAt: new Date().toISOString(),
  };
  fs.writeFileSync("deployments.json", JSON.stringify(out, null, 2));
  console.log("\nSaved deployments.json");

  console.log("\nNext — verify on Mantle Explorer:");
  console.log(`  npx hardhat verify --network ${hre.network.name} ${identityAddr}`);
  console.log(`  npx hardhat verify --network ${hre.network.name} ${signalAddr} ${identityAddr}`);
  console.log("\nThen copy these into your .env:");
  console.log(`  IDENTITY_REGISTRY_ADDRESS=${identityAddr}`);
  console.log(`  SIGNAL_REGISTRY_ADDRESS=${signalAddr}`);
  console.log(`  AGENT_ID=${agentId.toString()}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
