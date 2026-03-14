import axios from 'axios';
import { PriceService } from './PriceService';
import { getTradingEngine } from './EngineInstance';
import { getPortfolioService } from './PortfolioService';

// ──────────────────────────────────────────────────────────────
// STATIC TOKEN SEED — used as guaranteed base, then expanded
// ──────────────────────────────────────────────────────────────
const SEED_TOKENS = [
    { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK' },
    { mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', symbol: 'WIF' },
    { mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', symbol: 'POPCAT' },
    { mint: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', symbol: 'MEW' },
    { mint: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC', symbol: 'ai16z' },
    { mint: 'GJAFwWjJ3vnTsrGqL7cEGFfPjK6zBEGnLwPMWEgCLBps', symbol: 'GOAT' },
    { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP' },
    { mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', symbol: 'RAY' },
    { mint: 'HZ1JovNiVvGWK7KA3KbbHHBuXGR3v2K3jRMxBSRSRcBf', symbol: 'PYTH' },
    { mint: 'jtojtomepa8bdqfbme83d1w5nv63r5pgvvxptvnkyk', symbol: 'JTO' },
    { mint: 'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump', symbol: 'ACT' },
    { mint: 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', symbol: 'BOME' },
    { mint: 'Df6yfrKC8kZE3KNkrHERKzAetSxbrWeniQfyJY4Jpump', symbol: 'CHILLGUY' },
    { mint: '3S8qX1MsMqRbiwKg2cQyx7nis1oHMgaCfGLeEgUH2whu', symbol: 'MOTHER' },
    { mint: 'A8C3xuqscfmyLrte3VmTqrAq8kgMASius9AFNANwpump', symbol: 'FWOG' },
    { mint: '74SBV4zDXxTRgv1pEMoECskKBkZHc2yGPnc7GYVepump', symbol: 'PNUT' },
    { mint: 'ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzc8eu', symbol: 'BOOK' },
    { mint: 'NeonTjSjsuo3rexg9o6vHuMXw62f9V7zvmu8M8Zut44', symbol: 'NEON' },
    { mint: 'mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6', symbol: 'MOBILE' },
];

// ──────────────────────────────────────────────────────────────
// CONFIG V3
// ──────────────────────────────────────────────────────────────
const CFG = {
    // Timing
    SCAN_INTERVAL_MS: 5_000,
    MONITOR_INTERVAL_MS: 3_000,

    // Positions
    MAX_PARALLEL: 3,
    TOKENS_PER_CYCLE: 40,         // ↑ was 30, covers universe faster

    // V3.1: Tuned for more opportunities
    MIN_SCORE: 0.30,       // ↓ lowered from 0.35

    // Discovery — universe targets
    UNIVERSE_TARGET: 150,
    DISCOVERY_QUERIES: ['sol', 'ai', 'meme', 'pump', 'pepe', 'doge', 'goat', 'fart', 'bonk', 'wif', 'popcat'],
    DISCOVERY_MIN_VOL: 20_000,     // ↓ flood the universe with candidates
    DISCOVERY_MIN_LIQ: 10_000,     // ↓ flood the universe with candidates
    DISCOVERY_MAX_5M: 25.0,        // ↑ relaxed

    // Rug / safety
    MIN_LIQUIDITY_USD: 150_000,
    MIN_VOLUME_24H_USD: 200_000,    // V3: raised from $100k

    // Anti-FOMO
    MAX_CHANGE_5M: 12.0,           // ↑ relaxed from 8.0%

    // Scoring weights (must sum to 1.0 excluding bonuses)
    W_MOMENTUM5M: 0.30,
    W_VOL_SPIKE: 0.25,
    W_BUY_PRESSURE: 0.20,
    W_LIQUIDITY: 0.10,
    W_NEW_TOKEN: 0.15,

    // Bonus caps (added on top, do NOT need to sum to 1)
    WHALE_BOOST: 0.15,       // NEW V3
    WHALE_MIN_AVG_BUY: 20_000,     // avg buy size in USD to qualify
    VOL_ACCEL_THRESHOLD: 1.8,
    VOL_ACCEL_BONUS: 0.10,
    EARLY_PUMP_BOOST: 0.25,
    EARLY_PUMP_SPIKE: 2.0,
    EARLY_PUMP_PRESSURE: 1.8,
    EARLY_PUMP_PRICE_MAX: 2.0,

    // New token
    NEW_TOKEN_MAX_AGE_MS: 10 * 60 * 1000,
    NEW_TOKEN_REQ_SPIKE: 1.5,
    NEW_TOKEN_REQ_PRESSURE: 0.55,

    // Holder concentration — Helius RPC ✅ ACTIVE
    HOLDER_CHECK_ENABLED: true,       // Helius key loaded from .env
    MAX_TOP_HOLDER_PCT: 30,           // ↑ was 20 — relaxed for memecoins
    MAX_TOP5_HOLDER_PCT: 50,          // skip if top 5 > 50%

    // Trade cooldown — prevent re-entering same token too soon
    TOKEN_COOLDOWN_MS: 600_000,     // 10 min between trades of same token

    // Rejection cooldown — skip repeatedly-failing tokens
    TOKEN_REJECTION_COOLDOWN_MS: 900_000, // 15 min cooldown after hard reject

    // Universe health guard
    MIN_UNIVERSE_SIZE: 80,           // force refresh if universe drops below this

    // Jupiter slippage
    MAX_PRICE_IMPACT: 1.2,

    // Exit
    TAKE_PROFIT_TRAILING_ACTIVATE: 0.025,
    TRAILING_DIST: 0.015,
    STOP_LOSS: -0.02,
    MAX_HOLD_MS: 120_000,
};

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────
type DetailedData = Awaited<ReturnType<typeof PriceService.getSolanaDetailedData>>;
interface TokenEntry { mint: string; symbol: string; }
interface ScoredToken {
    mint: string;
    symbol: string;
    data: NonNullable<DetailedData>;
    score: number;
    breakdown: Record<string, number>;
}

// ──────────────────────────────────────────────────────────────
// SERVICE V3
// ──────────────────────────────────────────────────────────────
export class SolanaScalperService {
    private isRunning = false;
    private cycleInterval: NodeJS.Timeout | null = null;
    private activePositions: Set<string> = new Set();
    private lastWinners: string[] = [];
    private cooldownMap: Map<string, number> = new Map();   // mint → last trade time
    private rejectionMap: Map<string, number> = new Map();  // mint → last reject time

    private discoveryRotationIndex = 0;

    /** Live token universe, refreshed each cycle */
    private tokenUniverse: TokenEntry[] = [...SEED_TOKENS];
    private lastUniverseRefresh = 0;

    // ── Lifecycle ─────────────────────────────────────────────
    public async startScalper(solBalance: number = 1.0) {
        if (this.isRunning) return;
        this.isRunning = true;
        const engine = getTradingEngine();
        engine.emitLog(
            `☀️ [SOL V3] Launching | Universe: ~${CFG.UNIVERSE_TARGET} tokens | MinScore: ${CFG.MIN_SCORE} | TP trail +${CFG.TAKE_PROFIT_TRAILING_ACTIVATE * 100}% | SL ${CFG.STOP_LOSS * 100}%`,
            'success'
        );
        this.cycleInterval = setInterval(() => this.runCycle(solBalance), CFG.SCAN_INTERVAL_MS);
        this.runCycle(solBalance);
    }

    public stopScalper() {
        if (this.cycleInterval) clearInterval(this.cycleInterval);
        this.isRunning = false;
        this.activePositions.clear();
        getTradingEngine().emitLog('🛑 [SOL V3] Shutdown.', 'warning');
    }

    // ── Universe Expansion — V3 ───────────────────────────────
    /**
     * Builds a 80–120 token universe by querying DexScreener with
     * multiple different search queries and merging the results.
     * Only runs every 60s to avoid rate limits.
     */
    private async refreshUniverse() {
        const now = Date.now();
        if (now - this.lastUniverseRefresh < 60_000) return; // max once per minute
        this.lastUniverseRefresh = now;

        const engine = getTradingEngine();
        const seen = new Set<string>(this.tokenUniverse.map(t => t.mint));
        const discovered: TokenEntry[] = [];

        // Sweep the namespace with randomized 3-letter queries to find hidden gems
        const letters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const queries = [...CFG.DISCOVERY_QUERIES];
        for (let i = 0; i < 5; i++) {
            const r = letters[Math.floor(Math.random() * letters.length)] +
                letters[Math.floor(Math.random() * letters.length)] +
                letters[Math.floor(Math.random() * letters.length)];
            queries.push(r);
        }

        let totalRaw = 0;
        let chainFail = 0;
        let qualityFail = 0;

        await Promise.all(
            queries.slice(-8).map(async (query) => { // check 8 varied queries per minute
                try {
                    const res = await axios.get(
                        `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`,
                        { timeout: 5000 }
                    );
                    const pairs: any[] = res.data?.pairs || [];
                    totalRaw += pairs.length;

                    pairs.forEach(p => {
                        if (p.chainId !== 'solana') {
                            chainFail++;
                            return;
                        }

                        const vol = parseFloat(p.volume?.h24 || '0');
                        const liq = parseFloat(p.liquidity?.usd || '0');
                        const pump = Math.abs(p.priceChange?.m5 || 0);

                        if (vol < CFG.DISCOVERY_MIN_VOL || liq < CFG.DISCOVERY_MIN_LIQ || pump > CFG.DISCOVERY_MAX_5M) {
                            qualityFail++;
                            return;
                        }

                        const mint = p.baseToken?.address;
                        const symbol = p.baseToken?.symbol;
                        if (mint && symbol && !seen.has(mint)) {
                            seen.add(mint);
                            discovered.push({ mint, symbol });
                        }
                    });
                } catch { /* ignore individual query failures */ }
            })
        );

        // Merge and cap
        const originalCount = this.tokenUniverse.length;
        this.tokenUniverse = [...this.tokenUniverse, ...discovered].slice(0, CFG.UNIVERSE_TARGET);

        engine.emitLog(
            `🌐 [V3 Discovery] [${queries.join(',')}] | Raw:${totalRaw} | ChainFail:${chainFail} | QualFail:${qualityFail} | New:${discovered.length} | Univ:${this.tokenUniverse.length}`,
            'info'
        );
    }

    // ── Holder concentration check (Helius) ──────────────────
    /**
     * Uses Helius (Solana RPC) to get the top token holders.
     * Returns true = SAFE to trade, false = too concentrated (skip).
     * Checks: top holder > 20% → reject, top 5 > 50% → reject.
     */
    private async holderConcentrationCheck(mint: string): Promise<boolean> {
        if (!CFG.HOLDER_CHECK_ENABLED) return true;

        const apiKey = process.env.HELIUS_API_KEY;
        if (!apiKey) return true; // no key configured, pass-through

        try {
            const url = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;

            // Step 1: Get mint supply to calculate percentages
            const supplyRes = await axios.post(url, {
                jsonrpc: '2.0', id: 1,
                method: 'getTokenSupply',
                params: [mint]
            }, { timeout: 5000 });

            const totalSupply = parseFloat(supplyRes.data?.result?.value?.uiAmount || '0');
            if (totalSupply === 0) return true; // can't verify, allow

            // Step 2: Get largest accounts
            const holdersRes = await axios.post(url, {
                jsonrpc: '2.0', id: 2,
                method: 'getTokenLargestAccounts',
                params: [mint]
            }, { timeout: 5000 });

            const accounts: any[] = holdersRes.data?.result?.value || [];
            if (accounts.length === 0) return true;

            // Step 3: Calculate percentages
            const topHolderPct = (parseFloat(accounts[0]?.uiAmount || '0') / totalSupply) * 100;
            const top5Amount = accounts.slice(0, 5).reduce((s: number, a: any) => s + parseFloat(a.uiAmount || '0'), 0);
            const top5HolderPct = (top5Amount / totalSupply) * 100;

            const engine = getTradingEngine();

            if (topHolderPct > CFG.MAX_TOP_HOLDER_PCT) {
                engine.emitLog(`🔒 [V3] HOLDER RISK: top holder ${topHolderPct.toFixed(1)}% > ${CFG.MAX_TOP_HOLDER_PCT}%`, 'warning');
                return false;
            }
            if (top5HolderPct > CFG.MAX_TOP5_HOLDER_PCT) {
                engine.emitLog(`🔒 [V3] HOLDER RISK: top5 ${top5HolderPct.toFixed(1)}% > ${CFG.MAX_TOP5_HOLDER_PCT}%`, 'warning');
                return false;
            }

            return true;

        } catch {
            return true; // on API error, allow trade (fail-open)
        }
    }

    // ── Whale detector ────────────────────────────────────────
    /**
     * Detects whale-sized swaps using DexScreener txn data.
     * If the average buy size in the last 5m exceeds $20k, it's likely
     * a whale accumulating — apply score boost.
     */
    private detectWhaleActivity(d: NonNullable<DetailedData>): { isWhale: boolean; avgBuySize: number } {
        if (d.buysM5 === 0) return { isWhale: false, avgBuySize: 0 };
        const avgBuySize = d.volumeM5 / d.buysM5;
        return {
            isWhale: avgBuySize >= CFG.WHALE_MIN_AVG_BUY && d.liquidityUsd >= CFG.MIN_LIQUIDITY_USD,
            avgBuySize
        };
    }

    // ── Main scan cycle ───────────────────────────────────────
    private async runCycle(totalSol: number) {
        if (!this.isRunning) return;
        const engine = getTradingEngine();

        // Expand universe in background (rate-limited)
        this.refreshUniverse();

        // Force universe refresh if it has shrunk below minimum healthy size
        if (this.tokenUniverse.length < 60) {
            engine.emitLog(`⚠️ [V3.1] Universe too small (${this.tokenUniverse.length}). Forcing refresh…`, 'warning');
            this.lastUniverseRefresh = 0; // reset timer to allow immediate refresh
            await this.refreshUniverse();
        }

        // Sample from universe, skipping recently rejected tokens
        const now2 = Date.now();
        const eligible = this.tokenUniverse.filter(t => {
            const rejectedAt = this.rejectionMap.get(t.mint) || 0;
            return now2 - rejectedAt >= CFG.TOKEN_REJECTION_COOLDOWN_MS;
        });

        const shuffled = [...eligible].sort(() => Math.random() - 0.5);
        const batch = [
            ...shuffled.filter(t => !this.lastWinners.includes(t.mint)).slice(0, CFG.TOKENS_PER_CYCLE - 2),
            ...shuffled.filter(t => this.lastWinners.includes(t.mint)).slice(0, 2)
        ];

        const skipped = this.tokenUniverse.length - eligible.length;
        engine.emitLog(`🧠 [V3] Scan: ${batch.length} batch | ${this.tokenUniverse.length} universe | ${this.activePositions.size} open | ${skipped} cooling`, 'info');
        if (this.activePositions.size > 0) {
            const list = Array.from(this.activePositions).map(m => {
                const t = this.tokenUniverse.find(tu => tu.mint === m);
                return t ? t.symbol : m.slice(0, 4);
            }).join(', ');
            engine.emitLog(`DEBUG: Active Positions: [${list}]`, 'info');
        }

        // Fetch detailed data for the full batch in parallel
        const results = await Promise.all(
            batch.map(async t => {
                const data = await PriceService.getSolanaDetailedData(t.mint);
                return data ? { mint: t.mint, symbol: t.symbol, data } : null;
            })
        );
        const valid = results.filter(Boolean) as Array<{ mint: string; symbol: string; data: NonNullable<DetailedData> }>;

        if (valid.length === 0) {
            engine.emitLog('⚠️ [V3] No data retrieved. Skipping cycle.', 'warning');
            return;
        }

        // Score everything
        const scored: ScoredToken[] = [];
        for (const token of valid) {
            const result = await this.scoreToken(token.mint, token.symbol, token.data);
            if (result) scored.push(result);
        }
        scored.sort((a, b) => b.score - a.score);

        // Log top 5
        engine.emitLog('📊 [V3] TOP MOVERS:', 'info');
        scored.slice(0, 5).forEach((t, i) => {
            const bp = ((t.data.buysM5 / Math.max(t.data.buysM5 + t.data.sellsM5, 1)) * 100).toFixed(0);
            engine.emitLog(
                `  #${i + 1} ${t.symbol.padEnd(10)} ${t.score.toFixed(3)} | 5m: ${t.data.change5m >= 0 ? '+' : ''}${t.data.change5m.toFixed(2)}% | BP: ${bp}% | Liq: $${(t.data.liquidityUsd / 1000).toFixed(0)}K`,
                'info'
            );
        });

        const now = Date.now();
        const candidates = scored
            .filter(t => {
                const scorePass = t.score >= CFG.MIN_SCORE;
                const posPass = !this.activePositions.has(t.mint);
                const lastTraded = this.cooldownMap.get(t.mint) || 0;
                const cooldownPass = (now - lastTraded) >= CFG.TOKEN_COOLDOWN_MS;

                return scorePass && posPass && cooldownPass;
            })
            .slice(0, CFG.MAX_PARALLEL);

        if (candidates.length === 0) {
            engine.emitLog(`⏸️ [V3] No token reached min score ${CFG.MIN_SCORE}. Cycle done.`, 'warning');
            return;
        }

        this.lastWinners = candidates.map(c => c.mint);
        engine.emitLog(
            `🎯 [V3] Opening ${candidates.length} trade(s): ${candidates.map(c => `${c.symbol}(${c.score.toFixed(2)})`).join(', ')}`,
            'success'
        );

        const solPerTrade = totalSol / CFG.MAX_PARALLEL;
        candidates.forEach(c => this.openPosition(c, solPerTrade));
    }

    // ── Scoring engine V3 ─────────────────────────────────────
    private async scoreToken(mint: string, symbol: string, d: NonNullable<DetailedData>): Promise<ScoredToken | null> {
        const engine = getTradingEngine();
        const bd: Record<string, number> = {};

        // ── HARD FILTERS — stamp rejectionMap on every hard reject ──
        if (d.liquidityUsd < CFG.MIN_LIQUIDITY_USD) {
            this.rejectionMap.set(mint, Date.now());
            return null;
        }
        if (d.volumeH24 < CFG.MIN_VOLUME_24H_USD) {
            this.rejectionMap.set(mint, Date.now());
            return null;
        }
        if (d.change5m > CFG.MAX_CHANGE_5M) {
            engine.emitLog(`🚫 [V3] ${symbol} ANTI-FOMO: +${d.change5m.toFixed(1)}% — cooling 15min`, 'warning');
            this.rejectionMap.set(mint, Date.now());
            return null;
        }

        // ── HOLDER CONCENTRATION FILTER (Helius) ─────────────
        const holderSafe = await this.holderConcentrationCheck(mint);
        if (!holderSafe) {
            engine.emitLog(`🔒 [V3] ${symbol} HOLDER RISK — cooling 15min`, 'warning');
            this.rejectionMap.set(mint, Date.now());
            return null;
        }

        const totalTxns = d.buysM5 + d.sellsM5;

        // 1. Momentum5m → [0,1] capped at 5%
        bd.momentum5m = Math.min(Math.max(d.change5m / 5, 0), 1);

        // 2. Volume spike: vol_m5 / (vol_h1 / 12)
        const avgVol5m = d.volumeH1 / 12 || 1;
        const volSpike = d.volumeM5 / avgVol5m;
        bd.volumeSpike = Math.min(volSpike / 2.5, 1);

        // 3. Normalized buy pressure: buys / (buys + sells) → [0,1]
        bd.buyPressure = totalTxns > 0 ? d.buysM5 / totalTxns : 0.5;

        // 4. Liquidity score (log scale)
        bd.liquidity = Math.max(Math.min(Math.log10(d.liquidityUsd / 150_000 + 1) / Math.log10(34), 1), 0);

        // 5. New token boost (conditional)
        bd.newToken = 0;
        const pairAgeMs = d.pairCreatedAt > 0 ? Date.now() - d.pairCreatedAt : Infinity;
        if (pairAgeMs < CFG.NEW_TOKEN_MAX_AGE_MS &&
            volSpike > CFG.NEW_TOKEN_REQ_SPIKE &&
            bd.buyPressure > CFG.NEW_TOKEN_REQ_PRESSURE) {
            bd.newToken = 1.0;
            engine.emitLog(`🆕 [V3] ${symbol} NEW TOKEN BOOST (${(pairAgeMs / 60000).toFixed(1)}min old)`, 'success');
        }

        // ── Composite base score ──
        let score =
            bd.momentum5m * CFG.W_MOMENTUM5M +
            bd.volumeSpike * CFG.W_VOL_SPIKE +
            bd.buyPressure * CFG.W_BUY_PRESSURE +
            bd.liquidity * CFG.W_LIQUIDITY +
            bd.newToken * CFG.W_NEW_TOKEN;

        // ── BONUS: Volume acceleration ──
        if (d.volumeM15 > 0) {
            const accel = d.volumeM5 / (d.volumeM15 / 3);
            if (accel > CFG.VOL_ACCEL_THRESHOLD) {
                bd.volAccel = CFG.VOL_ACCEL_BONUS;
                score += CFG.VOL_ACCEL_BONUS;
            }
        }

        // ── BONUS: Early pump ──
        const rawRatio = d.sellsM5 > 0 ? d.buysM5 / d.sellsM5 : d.buysM5;
        if (volSpike > CFG.EARLY_PUMP_SPIKE &&
            rawRatio > CFG.EARLY_PUMP_PRESSURE &&
            Math.abs(d.change5m) < CFG.EARLY_PUMP_PRICE_MAX) {
            bd.earlyPump = CFG.EARLY_PUMP_BOOST;
            score += CFG.EARLY_PUMP_BOOST;
            engine.emitLog(`🔥 [V3] ${symbol} EARLY PUMP +${CFG.EARLY_PUMP_BOOST}`, 'success');
        }

        // ── BONUS: Whale swap detector (V3 NEW) ──
        const { isWhale, avgBuySize } = this.detectWhaleActivity(d);
        if (isWhale) {
            bd.whaleSwap = CFG.WHALE_BOOST;
            score += CFG.WHALE_BOOST;
            engine.emitLog(`🐋 [V3] ${symbol} WHALE DETECTED: avg buy $${(avgBuySize / 1000).toFixed(0)}K → +${CFG.WHALE_BOOST}`, 'success');
        }

        return { mint, symbol, data: d, score, breakdown: bd };
    }

    // ── Open position ─────────────────────────────────────────
    private async openPosition(token: ScoredToken, solAllocation: number) {
        const engine = getTradingEngine();
        const portfolio = getPortfolioService();

        // Jupiter slippage guard
        const jupQuote = await PriceService.getJupiterQuote(token.mint, solAllocation);
        if (jupQuote && jupQuote.priceImpact > CFG.MAX_PRICE_IMPACT) {
            engine.emitLog(`🛡️ [V3] ${token.symbol} slippage ${jupQuote.priceImpact.toFixed(3)}% > ${CFG.MAX_PRICE_IMPACT}%. Skipping.`, 'warning');
            return;
        }

        const entryPrice = token.data.price;
        const conviction = Math.min(Math.max(token.score / 3, 0.2), 0.7);
        const tradeSol = solAllocation * conviction;
        const tradeUsdc = tradeSol * 130;
        const bkStr = Object.entries(token.breakdown).map(([k, v]) => `${k}:${v.toFixed(2)}`).join(' ');
        const routeLabel = jupQuote ? `${jupQuote.route} impact:${jupQuote.priceImpact.toFixed(3)}%` : 'Jupiter';

        engine.emitLog(
            `⚡ [V3] BUY ${token.symbol} @ $${entryPrice.toFixed(6)} | ${tradeSol.toFixed(4)} SOL | ${routeLabel} | score:${token.score.toFixed(3)} [${bkStr}]`,
            'success'
        );

        const tradeId = portfolio.registerTrade('SOL_SCALPER', tradeUsdc, token.mint, token.symbol);
        if (!tradeId) {
            engine.emitLog(`⚠️ [V3] Insufficient balance for ${token.symbol}. Skipped.`, 'warning');
            return;
        }
        this.activePositions.add(token.mint);
        this.cooldownMap.set(token.mint, Date.now()); // start cooldown

        // ── Dynamic exit monitor with trailing stop ───────────
        const startTime = Date.now();
        let peakPrice = entryPrice;
        let trailingActive = false;

        const monitor = setInterval(async () => {
            if (!this.isRunning) { clearInterval(monitor); return; }

            const curr = await PriceService.getSolanaDetailedData(token.mint);
            if (!curr) return;

            const currentPrice = curr.price;
            const changeFromEntry = (currentPrice - entryPrice) / entryPrice;
            const elapsed = Date.now() - startTime;

            if (currentPrice > peakPrice) peakPrice = currentPrice;
            const peakChange = (peakPrice - entryPrice) / entryPrice;

            if (!trailingActive && peakChange >= CFG.TAKE_PROFIT_TRAILING_ACTIVATE) {
                trailingActive = true;
                engine.emitLog(`📈 [V3] ${token.symbol} trailing ACTIVATED (peak +${(peakChange * 100).toFixed(2)}%)`, 'info');
            }

            const trailingFloor = trailingActive
                ? (peakPrice * (1 - CFG.TRAILING_DIST) - entryPrice) / entryPrice
                : -Infinity;

            let exitReason: string | null = null;
            if (trailingActive && changeFromEntry <= trailingFloor) {
                exitReason = `📉 TRAIL STOP (peak +${(peakChange * 100).toFixed(2)}%)`;
            } else if (changeFromEntry <= CFG.STOP_LOSS) {
                exitReason = `🛑 STOP LOSS`;
            } else if (elapsed >= CFG.MAX_HOLD_MS) {
                exitReason = `⏲️ TIMEOUT`;
            }

            if (exitReason) {
                clearInterval(monitor);
                this.activePositions.delete(token.mint);
                (portfolio as any).closeTradeWithRealProfit(tradeId, changeFromEntry);

                engine.emitLog(
                    `${exitReason} | SELL ${token.symbol} @ $${currentPrice.toFixed(6)} | ${changeFromEntry >= 0 ? '+' : ''}${(changeFromEntry * 100).toFixed(4)}% | ${changeFromEntry >= 0 ? '+' : ''}${(tradeSol * changeFromEntry).toFixed(5)} SOL`,
                    changeFromEntry > 0 ? 'success' : 'warning'
                );
            }
        }, CFG.MONITOR_INTERVAL_MS);
    }
}

// Singleton
let instance: SolanaScalperService | null = null;
export const getSolanaScalperService = () => {
    if (!instance) instance = new SolanaScalperService();
    return instance;
};
