# PROJECT CONTEXT FOR AI (Antigravity / ChatGPT)

## Overview
Automated Solana Scalper (V3.1).
- **Backend**: Node.js + TypeScript + Express + Socket.io.
- **Frontend**: Next.js + Tailwind.
- **Network**: Solana.
- **Exchanges**: Jupiter (Execution), DexScreener (Discovery/Prices).

## Current Architecture & Logic (V3.1)
### 1. Token Discovery (V3.1 Upgrade)
- **Namespace Sweep**: Instead of static keywords, we use randomized 3-letter query rotation (e.g., `uvr`, `nxv`, `ybk`) to find fresh pairs on DexScreener.
- **Universe Target**: 150 tokens. Accumulates discovered tokens across cycles.
- **Discovery Filters**: Liq > $10k, Vol > $20k (Low bar to populate the universe).

### 2. Scoring & Selection
- **MIN_SCORE**: 0.30.
- **Scoring Factors**: Momentum (5m change), Buy Pressure (buys/total), Volume Spike, Liquidity, New Token Boost.
- **Hard Guards (Live Execution)**:
  - Liquidity > $150k.
  - Volume (24h) > $200k.
  - Holder Concentration (Helius): Top holder < 30%, Top 5 < 50%.
  - Anti-FOMO: 5m change < 12%.

### 3. Execution & Monitoring
- **Jupiter Router**: Used for all swaps (SOL → Mint, Mint → SOL).
- **Trailing Stop**: 1.5% distance, activates after 2.5% profit.
- **Rejection Cooldown**: 15 minutes for tokens failing safety checks.
- **Trade Cooldown**: 10 minutes between trades of the same token.

## Collaboration Flow
- **Git Repository**: Initialized at `/proyecto mario`.
- **Secrets**: Managed in `backend/.env` (NOT tracked). Required keys: `HELIUS_API_KEY`, `SOLANA_PRIVATE_KEY`.
- **Context Sync**: Use this file (`AI_CONTEXT.md`) and the artifacts in `.gemini/brain/`.

## Key Files
- `backend/src/services/SolanaScalperService.ts`: Core brain of the scalper.
- `backend/src/services/TradingEngine.ts`: Trade execution and logging.
- `backend/src/services/SolanaScannerService.ts`: Market monitoring.
