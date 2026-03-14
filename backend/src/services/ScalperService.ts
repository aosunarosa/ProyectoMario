import { PriceService } from './PriceService';
import { getTradingEngine } from './EngineInstance';
import { getPortfolioService } from './PortfolioService';

// Real tokens on Base network to monitor
const MONITORED_TOKENS = [
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH' },
    { address: '0x50c5725949a65193f2c9ef3017fa72551469e71d', symbol: 'BRETT' },
    { address: '0x0d97f39386c990264b38dcd26d03f0b24059a4c8', symbol: 'DEGEN' },
    { address: '0x7b561c2105ccf10f44e8bc1982b6049298e8338f', symbol: 'TOSHI' },
    { address: '0x940181a94a35a4569e4529a3cdfb74e38fd98631', symbol: 'AERO' },
];

// Exit thresholds — HIGH RISK / HIGH REWARD MODE 🔥
const TAKE_PROFIT = 0.03;    // +3.0% = exit with profit
const STOP_LOSS = -0.015;  // -1.5% = cut losses
const MAX_HOLD_MS = 180000;  // 3 minutes max hold
const CHECK_EVERY = 5000;    // Check price every 5 seconds
const MAX_PARALLEL = 3;      // Max simultaneous positions

export class ScalperService {
    private isRunning = false;
    private scalperInterval: NodeJS.Timeout | null = null;
    private activePositions: Set<string> = new Set();

    public async startScalper(balance: number) {
        if (this.isRunning) return;
        this.isRunning = true;

        const engine = getTradingEngine();
        engine.emitLog(
            `🚀 [Scalper IA] Starting. Max ${MAX_PARALLEL} parallel positions | TP: +${TAKE_PROFIT * 100}% | SL: ${STOP_LOSS * 100}%`,
            'success'
        );

        this.scalperInterval = setInterval(() => {
            this.runRealDataCycle(balance);
        }, 30000);

        this.runRealDataCycle(balance);
    }

    public stopScalper() {
        if (this.scalperInterval) clearInterval(this.scalperInterval);
        this.isRunning = false;
        this.activePositions.clear();
        const engine = getTradingEngine();
        engine.emitLog(`🛑 [Scalper IA] System shutdown. All positions closed.`, 'warning');
    }

    private async runRealDataCycle(totalBalance: number) {
        if (!this.isRunning) return;

        const engine = getTradingEngine();

        engine.emitLog(`🧠 [Scalper IA] Scanning all tokens for momentum...`, 'info');

        // 1. Fetch REAL momentum from DexScreener for all tokens in parallel
        const momentumData = await Promise.all(
            MONITORED_TOKENS.map(async (t) => {
                const data = await PriceService.getTokenMomentum(t.address);
                return data ? { ...t, ...data } : null;
            })
        );

        const validData = momentumData.filter(Boolean) as Array<{
            address: string; symbol: string; price: number;
            change5m: number; change1h: number; volume24h: number;
        }>;

        if (validData.length === 0) {
            engine.emitLog(`⚠️ [Scalper IA] API unavailable. Skipping cycle.`, 'warning');
            return;
        }

        // 2. Score and log all tokens
        const scored = validData.map(t => ({
            ...t,
            score: t.change5m * 0.7 + t.change1h * 0.3
        })).sort((a, b) => b.score - a.score);

        scored.forEach(t => {
            engine.emitLog(
                `📊 ${t.symbol}: $${t.price.toFixed(6)} | 5m: ${t.change5m >= 0 ? '+' : ''}${t.change5m.toFixed(2)}% | Score: ${t.score.toFixed(2)}`,
                'info'
            );
        });

        // 3. Get top N candidates with positive momentum, not already in position
        const candidates = scored
            .filter(t => t.score > 0 && !this.activePositions.has(t.address))
            .slice(0, MAX_PARALLEL);

        if (candidates.length === 0) {
            engine.emitLog(`⏸️ [Scalper IA] No viable candidates. Holding cash.`, 'warning');
            return;
        }

        engine.emitLog(`🎯 [Scalper IA] Opening ${candidates.length} parallel positions: ${candidates.map(c => c.symbol).join(', ')}`, 'success');

        // 4. Open ALL viable positions simultaneously
        const allocationPerTrade = (totalBalance / MAX_PARALLEL);
        candidates.forEach(winner => this.openPosition(winner, allocationPerTrade));
    }

    private openPosition(winner: { address: string; symbol: string; price: number; score: number }, allocation: number) {
        const engine = getTradingEngine();
        const portfolio = getPortfolioService();

        const conviction = Math.min(Math.max(winner.score / 3, 0.2), 0.7);
        const scalpAmount = allocation * conviction;
        const entryPrice = winner.price;

        engine.emitLog(
            `⚡ BUY ${winner.symbol} @ $${entryPrice.toFixed(6)} | Amount: ${scalpAmount.toFixed(2)} USDC`,
            'success'
        );

        const tradeId = portfolio.registerTrade('SCALPER_BOT', scalpAmount, winner.address, winner.symbol);
        this.activePositions.add(winner.address);

        // Dynamic exit monitor — checks every 5s
        const startTime = Date.now();

        const monitor = setInterval(async () => {
            if (!this.isRunning) {
                clearInterval(monitor);
                return;
            }

            const currentData = await PriceService.getTokenMomentum(winner.address);
            if (!currentData) return;

            const currentPrice = currentData.price;
            const changeFromEntry = (currentPrice - entryPrice) / entryPrice;
            const elapsed = Date.now() - startTime;

            let exitReason: string | null = null;

            if (changeFromEntry >= TAKE_PROFIT) {
                exitReason = `✅ TAKE PROFIT`;
            } else if (changeFromEntry <= STOP_LOSS) {
                exitReason = `🛑 STOP LOSS`;
            } else if (elapsed >= MAX_HOLD_MS) {
                exitReason = `⏲️ TIMEOUT (${Math.round(elapsed / 1000)}s)`;
            }

            if (exitReason) {
                clearInterval(monitor);
                this.activePositions.delete(winner.address);

                (portfolio as any).closeTradeWithRealProfit(tradeId, changeFromEntry);

                const pnlUsdc = (scalpAmount * changeFromEntry).toFixed(4);
                engine.emitLog(
                    `${exitReason} | SELL ${winner.symbol} @ $${currentPrice.toFixed(6)} | P/L: ${changeFromEntry >= 0 ? '+' : ''}${(changeFromEntry * 100).toFixed(4)}% (${changeFromEntry >= 0 ? '+' : ''}${pnlUsdc} USDC)`,
                    changeFromEntry > 0 ? 'success' : 'warning'
                );
            }
        }, CHECK_EVERY);
    }
}

let instance: ScalperService | null = null;
export const getScalperService = () => {
    if (!instance) instance = new ScalperService();
    return instance;
};
