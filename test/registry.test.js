const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MantlePulse contracts", function () {
  let identity, signal, owner, operator, stranger;
  const DOMAIN = "mantlepulse.xyz";
  const PROTO = ethers.encodeBytes32String("merchant-moe");
  const DATA_HASH = ethers.keccak256(ethers.toUtf8Bytes("snapshot-1"));

  beforeEach(async function () {
    [owner, operator, stranger] = await ethers.getSigners();

    const Identity = await ethers.getContractFactory("AgentIdentityRegistry");
    identity = await Identity.deploy();
    await identity.waitForDeployment();

    const Signal = await ethers.getContractFactory("SignalRegistry");
    signal = await Signal.deploy(await identity.getAddress());
    await signal.waitForDeployment();
  });

  it("registers an agent and mints the AgentID NFT", async function () {
    await identity.registerAgent(DOMAIN, operator.address);
    expect(await identity.resolveByAddress(operator.address)).to.equal(1n);
    expect(await identity.agentAddressOf(1)).to.equal(operator.address);
    expect(await identity.ownerOf(1)).to.equal(owner.address); // minted to caller
    expect(await identity.totalAgents()).to.equal(1n);
  });

  it("lets the bound operator record a signal on-chain", async function () {
    await identity.registerAgent(DOMAIN, operator.address);

    await expect(
      signal.connect(operator).recordSignal(1, PROTO, 8500, 1500, false, DATA_HASH)
    ).to.emit(signal, "SignalRecorded");

    expect(await signal.totalSignals()).to.equal(1n);
    const [latest, exists] = await signal.getLatestByProtocol(PROTO);
    expect(exists).to.equal(true);
    expect(latest.healthScore).to.equal(8500);
    expect(latest.riskScore).to.equal(1500);
    expect(latest.anomaly).to.equal(false);
    expect(latest.agentId).to.equal(1n);
  });

  it("rejects a signal from a non-operator address", async function () {
    await identity.registerAgent(DOMAIN, operator.address);
    await expect(
      signal.connect(stranger).recordSignal(1, PROTO, 5000, 5000, true, DATA_HASH)
    ).to.be.revertedWith("not agent operator");
  });

  it("rejects out-of-range scores", async function () {
    await identity.registerAgent(DOMAIN, operator.address);
    await expect(
      signal.connect(operator).recordSignal(1, PROTO, 10001, 0, false, DATA_HASH)
    ).to.be.revertedWith("score>100%");
  });

  it("tracks the protocol list and recent signals", async function () {
    await identity.registerAgent(DOMAIN, operator.address);
    const agni = ethers.encodeBytes32String("agni-finance");
    await signal.connect(operator).recordSignal(1, PROTO, 9000, 1000, false, DATA_HASH);
    await signal.connect(operator).recordSignal(1, agni, 4000, 7000, true, DATA_HASH);

    const protocols = await signal.getProtocols();
    expect(protocols.length).to.equal(2);

    const recent = await signal.getRecentSignals(2);
    expect(recent.length).to.equal(2);
    expect(recent[1].protocol).to.equal(agni);
    expect(recent[1].anomaly).to.equal(true);
  });
});
