# PROJECT CONTEXT FOR AI (Antigravity / ChatGPT)

## Overview
Automated Multi-Chain Scalper (V3.5 - Smart Entry Evolution).
- **Backend**: Node.js + TS + Express. Unified Engine for Solana & Base.
- **Frontend**: Next.js.
- **Discovery**: Dynamic DexScreener API with multi-query sweeps. No scraping.
- **Execution**: Jupiter (Solana), Aerodrome/Uniswap (Base).

## Architecture (V3.5 Evolution)
### 1. Smart Entry Logic
- **Adaptive Window**: Confirmation wait time is dynamic based on conviction score:
  - Score >= 0.42: 20s wait.
  - Score 0.34 - 0.41: 30s wait.
  - Score 0.28 - 0.33: 45s wait.
- **Anti Top-Entry Filter**: Rejects trades if the price moves more than **+2.5%** from the detected price during the confirmation window (prevents chasing peaks).
- **Entry Efficiency**: Logs telemetry (0.00 to 1.00) measuring how close the entry was to the initial spike detection.

### 2. Scoring & Momentum
- **Weights**: Momentum 5m (35%), Volume Spike (25%), Buy Pressure (25%), Liquidity (15%).
- **Gem Boost**: Applied to high-acceleration tokens with liquidity < $5M (**Anti-Bluechip Guard**).
- **Real-Time Fees**: All P&L calculations deduct live network gas fees (Alchemy/Solana RPC).

### 3. Risk Management (V3.5 Refined)
- **Stop Loss**: -3.0% (Hard limit).
- **Trailing Stop**: 
  - Activation: +2.5% (Early protection).
  - Distance: 1.6% (Tight follow).
- **Constraints**: Max parallel positions (5). Max hold: 7 minutes.

## File Map
- `backend/src/services/SolanaScalperService.ts`: Solana Engine.
- `backend/src/services/ScalperService.ts`: Base Engine.
- `backend/src/services/PriceService.ts`: Real-time gas and price data.
- `backend/src/services/PortfolioService.ts`: Profit tracking with real-time fees.
