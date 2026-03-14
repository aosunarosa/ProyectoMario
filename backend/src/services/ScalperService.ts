import { PriceService } from './PriceService';
import { getTradingEngine } from './EngineInstance';
import { getPortfolioService } from './PortfolioService';
import axios from 'axios';

// ──────────────────────────────────────────────────────────────
// CONFIG V3.3 (BASE NETWORK)
// ──────────────────────────────────────────────────────────────
const CFG = {
    SCAN_INTERVAL_MS: 3_000,
    MONITOR_INTERVAL_MS: 2_000,
    MAX_PARALLEL: 5,
    TOKENS_PER_CYCLE: 40,
    UNIVERSE_TARGET: 150,

    MIN_SCORE: 0.28,
    DISCOVERY_QUERIES: ['base', 'ai', 'meme', 'degen', 'new', 'launch', 'trending', 'gem', 'blue', 'farcaster', 'moon', 'rocket', 'ape'],
    DISCOVERY_MIN_VOL: 5_000,     // ↓ lower for discovery universe
    DISCOVERY_MIN_LIQ: 10_000,    // ↓ lower for discovery universe
    DISCOVERY_MAX_5M: 25.0,

    // AI V3.3 Gem Guard
    MAX_LIQ_FOR_BOOST: 5_000_000,
    MIN_CHANGE_5M_MOMENTUM: 0.5,

    // Safety (Trade Entry Filters)
    MIN_LIQUIDITY_USD: 50_000,    // ↓ lowered per user request
    MIN_VOLUME_24H_USD: 20_000,   // ↓ lowered per user request
    MAX_CHANGE_5M: 15.0,

    // Scoring weights (Unified)
    W_MOMENTUM5M: 0.35,
    W_VOL_SPIKE: 0.25,
    W_BUY_PRESSURE: 0.25,
    W_LIQUIDITY: 0.15,

    // AI V3.5 Smart Entry Evolution
    CONFIRMATION_MAX_DROP: 0.02, 
    ANTI_TOP_LIMIT: 0.025,
    UNIVERSE_REFRESH_MS: 45_000,

    // Exit (V3.5 Refined Risk)
    TAKE_PROFIT_TRAILING_ACTIVATE: 0.025,
    TRAILING_DIST: 0.016,
    STOP_LOSS: -0.03,
    MAX_HOLD_MS: 420_000,        // 7 minutes
};

interface TokenEntry { address: string; symbol: string; }
interface ScoredToken {
    address: string;
    symbol: string;
    data: any;
    score: number;
    breakdown: Record<string, number>;
}

export class ScalperService {
    private isRunning = false;
    private cycleInterval: NodeJS.Timeout | null = null;
    private activePositions: Set<string> = new Set();
    private cooldownMap: Map<string, number> = new Map();
    private discoveryTimeMap: Map<string, number> = new Map();
    private potentialEntries: Map<string, { 
        detectedAt: number; 
        detectedPrice: number; 
        initialScore: number;
        peakPrice: number;
        symbol: string 
    }> = new Map();
    private tokenUniverse: TokenEntry[] = [];
    private lastUniverseRefresh = 0;
    private lastWinners: string[] = [];

    public async startScalper(balance: number) {
        if (this.isRunning) return;
        this.isRunning = true;
        const engine = getTradingEngine();
        engine.emitLog(`🚀 [BASE V3.3] Gem Hunter active | 3s Cycle | MinScore: ${CFG.MIN_SCORE} | Hold: 7m`, 'success');
        this.cycleInterval = setInterval(() => this.runCycle(balance), CFG.SCAN_INTERVAL_MS);
        this.runCycle(balance);
    }

    public stopScalper() {
        if (this.cycleInterval) clearInterval(this.cycleInterval);
        this.isRunning = false;
        this.activePositions.clear();
        getTradingEngine().emitLog('🛑 [BASE V3] Shutdown.', 'warning');
    }

    private async refreshUniverse() {
        const now = Date.now();
        if (now - this.lastUniverseRefresh < CFG.UNIVERSE_REFRESH_MS) return;
        this.lastUniverseRefresh = now;

        const engine = getTradingEngine();
        const seen = new Set<string>(this.tokenUniverse.map(t => t.address));
        const discovered: TokenEntry[] = [];

        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const queries = [...CFG.DISCOVERY_QUERIES];
        for (let i = 0; i < 5; i++) {
            queries.push(letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)]);
        }

        await Promise.all(
            queries.slice(-8).map(async (query) => {
                try {
                    const res = await axios.get(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`, { timeout: 5000 });
                    const pairs = res.data?.pairs || [];
                    pairs.forEach((p: any) => {
                        if (p.chainId !== 'base') return;
                        const vol = parseFloat(p.volume?.h24 || '0');
                        const liq = parseFloat(p.liquidity?.usd || '0');
                        if (vol < CFG.DISCOVERY_MIN_VOL || liq < CFG.DISCOVERY_MIN_LIQ) return;

                        const address = p.baseToken?.address;
                        const symbol = p.baseToken?.symbol;
                        if (address && symbol && !seen.has(address)) {
                            seen.add(address);
                            discovered.push({ address, symbol });
                            this.discoveryTimeMap.set(address, Date.now());
                        }
                    });
                } catch { }
            })
        );

        this.tokenUniverse = [...this.tokenUniverse, ...discovered].slice(0, CFG.UNIVERSE_TARGET);
        engine.emitLog(`🌐 [BASE Discovery] Universe: ${this.tokenUniverse.length} tokens`, 'info');
    }

    private async runCycle(totalBalance: number) {
        if (!this.isRunning) return;
        const engine = getTradingEngine();
        await this.refreshUniverse();

        // Universe Expiry (15 min)
        const EXPIRY_MS = 15 * 60 * 1000;
        const now = Date.now();
        this.tokenUniverse = this.tokenUniverse.filter(t => {
            if (this.activePositions.has(t.address)) return true;
            const discoveredAt = this.discoveryTimeMap.get(t.address) || 0;
            return (now - discoveredAt) < EXPIRY_MS;
        });

        if (this.tokenUniverse.length === 0) return;

        const shuffled = [...this.tokenUniverse].sort(() => Math.random() - 0.5);
        const batch = shuffled.slice(0, CFG.TOKENS_PER_CYCLE);

        engine.emitLog(`🧠 [BASE V3] Scan: ${batch.length} tokens | ${this.activePositions.size} open`, 'info');

        const results = await Promise.all(batch.map(async t => {
            const data = await PriceService.getSolanaDetailedData(t.address); // Cross-chain helper
            return data ? { ...t, data } : null;
        }));

        const valid = results.filter(Boolean) as any[];
        const scored: ScoredToken[] = [];
        for (const token of valid) {
            const res = this.scoreToken(token.address, token.symbol, token.data);
            if (res) scored.push(res);
        }

        scored.sort((a, b) => b.score - a.score);
        const candidates = scored.filter(t => t.score >= CFG.MIN_SCORE && !this.activePositions.has(t.address));

        // ── V3.5: ADAPTIVE SMART ENTRY CONFIRMATION ────────────────────
        for (const c of candidates) {
            if (!this.potentialEntries.has(c.address)) {
                this.potentialEntries.set(c.address, { 
                    detectedAt: now, 
                    detectedPrice: c.data.price,
                    initialScore: c.score,
                    peakPrice: c.data.price,
                    symbol: c.symbol 
                });
                const window = c.score >= 0.42 ? 20 : (c.score >= 0.34 ? 30 : 45);
                engine.emitLog(`⏳ [BASE V3.5] POTENTIAL: ${c.symbol} (Score: ${c.score.toFixed(2)}). Wait: ${window}s...`, 'info');
            } else {
                const entry = this.potentialEntries.get(c.address)!;
                if (c.data.price > entry.peakPrice) entry.peakPrice = c.data.price;
            }
        }

        const confirmed: ScoredToken[] = [];
        for (const [address, entry] of this.potentialEntries) {
            const elapsed = now - entry.detectedAt;
            const requiredWait = entry.initialScore >= 0.42 ? 20_000 : (entry.initialScore >= 0.34 ? 30_000 : 45_000);

            if (elapsed >= requiredWait) {
                const scout = scored.find(s => s.address === address);
                if (scout) {
                    const priceDrop = (entry.detectedPrice - scout.data.price) / entry.detectedPrice;
                    const priceMove = (scout.data.price - entry.detectedPrice) / entry.detectedPrice;

                    if (priceMove > CFG.ANTI_TOP_LIMIT) {
                        engine.emitLog(`🚫 [BASE V3.5] ANTI-TOP: ${scout.symbol} moved +${(priceMove*100).toFixed(1)}%. Chasing top, skip.`, 'warning');
                        this.cooldownMap.set(address, now);
                    } else if (priceDrop < CFG.CONFIRMATION_MAX_DROP) {
                        confirmed.push(scout);
                        const efficiency = (scout.data.price - entry.detectedPrice) / Math.max(entry.peakPrice - entry.detectedPrice, 0.000001);
                        engine.emitLog(`✅ [BASE V3.5] CONFIRMED: ${scout.symbol} | Wait: ${requiredWait/1000}s | Eff: ${(1-efficiency).toFixed(2)}`, 'success');
                    } else {
                        engine.emitLog(`🚫 [BASE V3.5] REJECTED: ${scout.symbol} pulled back too much.`, 'warning');
                        this.cooldownMap.set(address, now);
                    }
                }
                this.potentialEntries.delete(address);
            }
        }

        if (confirmed.length > 0) {
            engine.emitLog(`🎯 [BASE V3] Picking ${confirmed.length} confirmed gems.`, 'success');
            const allocation = Math.min(10.0, totalBalance / CFG.MAX_PARALLEL);
            confirmed.slice(0, CFG.MAX_PARALLEL).forEach(c => this.openPosition(c, allocation));
        }
    }

    private scoreToken(address: string, symbol: string, d: any): ScoredToken | null {
        if (d.change5m < CFG.MIN_CHANGE_5M_MOMENTUM) return null;
        if (d.liquidityUsd < CFG.MIN_LIQUIDITY_USD || d.volumeH24 < CFG.MIN_VOLUME_24H_USD) return null;
        if (d.change5m > CFG.MAX_CHANGE_5M) return null;

        const bd: Record<string, number> = {};
        const meetsLiqCap = d.liquidityUsd <= CFG.MAX_LIQ_FOR_BOOST;

        bd.momentum = Math.min(Math.max(d.change5m / 5, 0), 1);
        bd.volSpike = Math.min(d.volumeM5 / (d.volumeH1 / 12 || 1) / 2.5, 1);
        bd.buyPressure = d.buysM5 / Math.max(d.buysM5 + d.sellsM5, 1);
        bd.liquidity = Math.min(Math.log10(d.liquidityUsd / 100_000 + 1) / 2, 1);

        let score = (bd.momentum * CFG.W_MOMENTUM5M) + (bd.volSpike * CFG.W_VOL_SPIKE) + (bd.buyPressure * CFG.W_BUY_PRESSURE) + (bd.liquidity * CFG.W_LIQUIDITY);

        if (meetsLiqCap && bd.volSpike > 0.6) {
            score += 0.15; // Gem boost
            bd.gemBoost = 0.15;
            getTradingEngine().emitLog(`💎 [GEMA] High Accel on ${symbol} (Liq: $${(d.liquidityUsd/1000).toFixed(0)}k)`, 'success');
        }

        return { address, symbol, data: d, score, breakdown: bd };
    }

    private async openPosition(token: ScoredToken, usdcAllocation: number) {
        const portfolio = getPortfolioService();
        const tradeId = portfolio.registerTrade('BASE_SCALPER', usdcAllocation, token.address, token.symbol);
        if (!tradeId) return;

        this.activePositions.add(token.address);
        const engine = getTradingEngine();
        const entryPrice = token.data.price;
        const startTime = Date.now();
        let peakPrice = entryPrice;
        let trailingActive = false;

        const monitor = setInterval(async () => {
            const data = await PriceService.getSolanaDetailedData(token.address);
            if (!data) return;

            const currentPrice = data.price;
            const change = (currentPrice - entryPrice) / entryPrice;
            const elapsed = Date.now() - startTime;

            if (currentPrice > peakPrice) peakPrice = currentPrice;
            const peakChange = (peakPrice - entryPrice) / entryPrice;

            if (peakChange >= CFG.TAKE_PROFIT_TRAILING_ACTIVATE) {
                trailingActive = true;
                engine.emitLog(`📈 [BASE V3] ${token.symbol} trailing ACTIVATED (peak +${(peakChange * 100).toFixed(2)}%)`, 'info');
            }

            const trailingFloor = trailingActive
                ? (peakPrice * (1 - CFG.TRAILING_DIST) - entryPrice) / entryPrice
                : -Infinity;

            let exitReason: string | null = null;
            if (trailingActive && change <= trailingFloor) {
                exitReason = `📉 TRAIL STOP (peak +${(peakChange * 100).toFixed(2)}%)`;
            } else if (change <= CFG.STOP_LOSS) {
                exitReason = `🛑 STOP LOSS`;
            } else if (elapsed >= CFG.MAX_HOLD_MS) {
                exitReason = `⏲️ TIMEOUT`;
            }

            if (exitReason) {
                clearInterval(monitor);
                this.activePositions.delete(token.address);
                await (portfolio as any).closeTradeWithRealProfit(tradeId, change);
                engine.emitLog(`${exitReason} | ${token.symbol} @ P/L: ${(change * 100).toFixed(2)}%`, change > 0 ? 'success' : 'warning');
            }
        }, 5000);
    }
}

let instance: ScalperService | null = null;
export const getScalperService = () => {
    if (!instance) instance = new ScalperService();
    return instance;
};
