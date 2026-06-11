# MantlePulse 🩺

**AI protocol-health intelligence for Mantle DeFi — every signal benchmarked on-chain.**

MantlePulse is an autonomous AI agent that continuously monitors the health of
Mantle's native DeFi stack, detects anomalies in real time using unsupervised
statistical models, and records each risk signal **on-chain on Mantle** as a
permanent, verifiable benchmark. The agent carries an **ERC-8004 identity NFT**,
so every decision it publishes is attributable and auditable.

Built for **The Turing Test Hackathon 2026** · Track: **AI Alpha & Data** (Mirana Ventures).

---

## 🟢 Live on Mantle Sepolia (chainId 5003)

| Contract | Address | Verified source |
|---|---|---|
| **SignalRegistry** — on-chain AI signals | [`0xF47358CB00E0263A702DdCFd3e2a39084f82071A`](https://sepolia.mantlescan.xyz/address/0xF47358CB00E0263A702DdCFd3e2a39084f82071A) | [Mantlescan](https://sepolia.mantlescan.xyz/address/0xF47358CB00E0263A702DdCFd3e2a39084f82071A#code) · [Sourcify](https://repo.sourcify.dev/contracts/full_match/5003/0xF47358CB00E0263A702DdCFd3e2a39084f82071A/) |
| **AgentIdentityRegistry** — ERC-8004 identity | [`0xFddE3DBCcFf40AD9e7C7e396132759359556c16D`](https://sepolia.mantlescan.xyz/address/0xFddE3DBCcFf40AD9e7C7e396132759359556c16D) | [Mantlescan](https://sepolia.mantlescan.xyz/address/0xFddE3DBCcFf40AD9e7C7e396132759359556c16D#code) · [Sourcify](https://repo.sourcify.dev/contracts/full_match/5003/0xFddE3DBCcFf40AD9e7C7e396132759359556c16D/) |

**Agent identity:** AgentID **#1** · operator `0x08223AF249ACC0A1E942aA135367BBAa27b37a56` · **70+ signals recorded on-chain**, each with an evidence hash.

---

## The insight

Generic "whale tracker" bots look at the same wallet flows everyone else sees.
MantlePulse instead watches **Mantle-native protocol health** — live network
throughput/gas utilization plus per-protocol liquidity dynamics across the Mantle
DeFi stack (Merchant Moe, Agni Finance, USDY/mETH RWA) — and surfaces
**early-warning anomalies that are hard to get anywhere else**, framed as
**institutional-grade intelligence a VC could act on**, not retail pings.

## Architecture

```
                ┌──────────────────────────── MantlePulse agent ───────────────────────────┐
   Mantle RPC ─▶│ datasource.js → detector.js (z-score anomaly) → narrate.js → onchain.js  │
   (live, free) │        │                  │                          │           │        │
                │        └──────────────▶ store.js (rolling baselines) │           │        │
                └────────────────────────────────┬───────────────────┬┘           │        │
                                                  │                   │            ▼        │
                                          web/feed.json         data/signals.json  SignalRegistry (Mantle)
                                                  │                   │            ▲        │
                          ┌───────────────────────┘                   │      AgentIdentityRegistry
                          ▼                                            ▼      (ERC-8004 identity NFT)
                  Public dashboard (web/)                       Telegram bot (bot/)
```

- **`AgentIdentityRegistry.sol`** — ERC-8004-inspired identity registry; mints a
  unique AgentID NFT binding the agent's operator address to its domain.
- **`SignalRegistry.sol`** — the on-chain AI function: only the registered agent
  operator can `recordSignal()` a health/risk/anomaly tuple + evidence hash.
- **AI agent (`agent/`)** — reads live Mantle data, runs z-score anomaly detection,
  scores health/risk, narrates in plain English (no paid LLM), pushes signals on-chain.
- **Dashboard (`web/`)** — zero-build static app; deploys to Vercel in one click.
- **Telegram bot (`bot/`)** — zero-dependency `/status` `/alerts` `/watch` digest.

## Repo layout

```
contracts/   AgentIdentityRegistry.sol, SignalRegistry.sol
scripts/     deploy.js, genwallet.js
agent/       config, datasource, detector, narrate, onchain, feed, store, run
bot/         telegram.js (zero-dep)
web/         index.html, styles.css, app.js, feed.json (static dashboard)
test/        registry.test.js (5 passing)
```

## Quickstart (100% free, runs locally with no keys)

```bash
npm install
npm test            # 5/5 contract tests
npm run seed        # run the agent 20 cycles (live Mantle data + simulated protocols)
npm run feed        # build web/feed.json
npm run serve       # open the dashboard at http://localhost:3000
```

## Deploy to Mantle (locks the $1,000 Deployment Award)

```bash
node scripts/genwallet.js              # 1. generate a FREE throwaway testnet wallet
# 2. fund it (free): https://faucet.sepolia.mantle.xyz  (paste the printed address)
npm run deploy:testnet                 # 3. deploy + register the agent on Mantle Sepolia
npx hardhat verify --network mantleSepolia <SignalRegistry> <IdentityRegistry>
# 4. copy the printed addresses into .env, then:
PUSH_ONCHAIN=1 npm run agent           # agent now records every signal on-chain
```

Mantle Sepolia testnet — RPC `https://rpc.sepolia.mantle.xyz`, chainId `5003`,
explorer `https://sepolia.mantlescan.xyz`. The compiler targets the `paris`
EVM for maximum Mantle L2 compatibility.

## How it maps to the prize pool

| Prize | How MantlePulse earns it |
|---|---|
| **Deployment Award ($1,000)** | Verified contract on Mantle + `recordSignal()` AI function on-chain + public dashboard + repo + demo video |
| **Track 1st — Alpha & Data ($8,500)** | Live Mantle-native insight, on-chain data, VC-usable risk scores, scalable pipeline |
| **Best UI/UX ($3,000)** | Clean, Web2-friendly dashboard; no wallet needed to view |
| **Community Vote ($8,500)** | Shareable "is Mantle DeFi healthy right now?" narrative |
| **Innovation (all rubrics)** | ERC-8004 agent identity + on-chain signal benchmarking |

See [`SUBMISSION.md`](./SUBMISSION.md) for the full scorecard self-assessment.

## Zero cost

Reads use a free public RPC (read-only, no gas). Writes go to free Mantle testnet
(faucet MNT). Dashboard hosts on Vercel free tier. The Telegram bot and alert
narration use **no paid APIs**. Total spend: **$0**.

## Tech

Solidity 0.8.24 · Hardhat · OpenZeppelin 5.0.2 · ethers v6 · Node (zero-dep agent & bot) · static HTML/CSS/JS dashboard.

## License

MIT
