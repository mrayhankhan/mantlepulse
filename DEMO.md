# MantlePulse — Demo & Launch Kit

Everything you need to record the 2-minute video and run the Community-Vote campaign.

---

## 🎬 2-minute demo video script (shot-by-shot)

Record a screen capture (1080p) with voiceover. Speak at ~145 wpm. Target **2:00–2:30**.
Have two windows ready: the **dashboard** and a **terminal** running the agent.
> Tip: to guarantee an anomaly fires on camera, set `ANOMALY_Z=1.5` in `.env` before recording.

| Time | On screen | Say this (verbatim) |
|---|---|---|
| **0:00–0:15** | Dashboard, slowly scroll the cards | "This is **MantlePulse** — an autonomous AI agent that watches the health of Mantle's DeFi ecosystem in real time, and writes every risk signal **on-chain**. Let me show you." |
| **0:15–0:40** | Point to the LIVE Mantle Network card, then protocol cards | "In DeFi, risk usually shows up on Twitter *hours* after the damage is done. MantlePulse catches it the moment it happens — and unlike a whale tracker, it watches **Mantle's own protocol health**: network throughput, and liquidity across Merchant Moe, Agni, and RWA assets like mETH and USDY." |
| **0:40–1:05** | Terminal running `npm run agent`, show an anomaly line appear; cut to the red anomaly card | "The agent pulls **live Mantle data**, runs **unsupervised anomaly detection** — z-scores against a rolling baseline — and scores each protocol's health and risk. When something breaks pattern, it flags an anomaly in plain English." |
| **1:05–1:35** | Click a **"verify on-chain ↗"** link → Mantle Explorer showing the `recordSignal` tx; then show the AgentID in the footer | "Here's what makes it **verifiable**: every signal is recorded on-chain in our `SignalRegistry` on Mantle, with a hash of the evidence. And the agent has its own **ERC-8004 identity NFT**, so every decision is attributable. This is on-chain AI benchmarking." |
| **1:35–1:55** | Telegram: send `/status` then `/alerts` | "Teams get this as a clean dashboard — **no wallet needed** — and as a Telegram bot that pushes anomaly alerts. Built entirely on Mantle, running at **zero cost**." |
| **1:55–2:10** | Dashboard hero + show repo URL / X handle | "MantlePulse — institutional-grade, on-chain-verified protocol intelligence for Mantle. Thanks for watching — and vote for us on X." |

**Checklist before recording:** dashboard deployed (public URL), contract verified on Mantle Explorer, agent running live, Telegram bot online, quiet room, close notifications.

---

## 🐦 X / Twitter launch post (for the $8,500 Community Vote)

**Main tweet** (attach a 30–45s cut of the demo — the clip in tweet #1 maximizes reach):

> 🩺 Meet **MantlePulse** — an autonomous AI agent that monitors the health of @0xMantle's DeFi stack in real time and writes every risk signal **ON-CHAIN**.
>
> Not another whale tracker. Mantle-native protocol intelligence, verifiable on-chain, with an ERC-8004 agent identity.
>
> Built for the #TuringTest Hackathon 🧵👇

**Thread:**

> 2/ The problem: DeFi risk surfaces on Twitter *hours* after the on-chain damage. MantlePulse catches liquidity drains, throughput drops & anomalies the moment they break pattern.
>
> 3/ The AI: live @0xMantle data → unsupervised z-score anomaly detection → explainable health & risk scores → plain-English alerts. No black box.
>
> 4/ The proof: every signal is recorded on-chain in our SignalRegistry on Mantle (with an evidence hash). The agent holds its own ERC-8004 identity NFT. ⛓️ [attach Explorer screenshot]
>
> 5/ Live dashboard 👉 https://mrayhankhan.github.io/mantlepulse/ · open-source 👉 https://github.com/mrayhankhan/mantlepulse · built 100% on @0xMantle at $0.
> Vote for us 👉 [your DoraHacks BUIDL link]
> #MantlePulse #AI #DeFi #Mantle

**Tags to include:** `@0xMantle` `@DoraHacks` `@MiranaVentures` (your track sponsor).

**Campaign tips:**
- Post during the US/EU overlap (≈13:00–16:00 UTC); pin the tweet.
- Reply to your own thread with the Mantle Explorer tx screenshot — proof = retweets.
- Ask teammates/friends to **quote-tweet**, not just like — engagement + total votes is the metric.
- Keep posting progress updates daily until voting closes.
