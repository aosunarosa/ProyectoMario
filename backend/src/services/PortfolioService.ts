export interface TradeRecord {
    id: string;
    walletAddress: string;
    tokenAddress: string;
    tokenSymbol?: string;
    amountIn: number;
    amountOut?: number;
    profit?: number;
    status: 'OPEN' | 'CLOSED';
    timestamp: number;
}

export class PortfolioService {
    private balance: number = 100; // Starting capital in USDC
    private history: TradeRecord[] = [];

    public getPortfolio() {
        const openInvested = this.history
            .filter(t => t.status === 'OPEN')
            .reduce((acc, t) => acc + t.amountIn, 0);

        return {
            balance: this.balance,
            totalProfit: this.history.reduce((acc, trade) => acc + (trade.profit || 0), 0),
            history: this.history.slice(-10).reverse(),
            openTrades: this.history.filter(t => t.status === 'OPEN').length,
            availableBalance: this.balance - openInvested, // Real spendable capital
            openInvested
        };
    }

    /**
     * Registers a new trade. Deducts amountIn from balance immediately.
     * Returns null if insufficient balance.
     */
    public registerTrade(walletAddress: string, amount: number, tokenAddress: string = '0x', tokenSymbol: string = 'TOKEN'): string | null {
        const portfolio = this.getPortfolio();

        // Guard: don't invest more than available balance
        if (amount > portfolio.availableBalance) {
            const safeAmount = Math.max(portfolio.availableBalance * 0.9, 0); // Use up to 90% of available
            if (safeAmount < 0.5) {
                console.warn(`[Portfolio] Insufficient balance. Available: ${portfolio.availableBalance.toFixed(2)} USDC`);
                return null; // Cannot open trade
            }
            amount = safeAmount; // Resize to what we actually have
        }

        const id = Math.random().toString(36).substr(2, 9);
        const newTrade: TradeRecord = {
            id,
            walletAddress,
            tokenAddress,
            tokenSymbol,
            amountIn: amount,
            status: 'OPEN',
            timestamp: Date.now()
        };
        this.history.push(newTrade);
        this.balance -= amount; // Deduct immediately from balance
        return id;
    }

    public closeTrade(id: string) {
        const trade = this.history.find(t => t.id === id);
        if (trade && trade.status === 'OPEN') {
            const win = Math.random() > 0.45;
            const multiplier = win ? (1.05 + Math.random() * 0.8) : (0.6 + Math.random() * 0.35);
            trade.amountOut = trade.amountIn * multiplier;
            trade.profit = trade.amountOut - trade.amountIn;
            trade.status = 'CLOSED';
            this.balance += trade.amountOut; // Return amountOut (not just profit)
        }
    }

    public async closeTradeWithRealProfit(id: string, priceChangeRatio: number) {
        const trade = this.history.find(t => t.id === id);
        if (trade && trade.status === 'OPEN') {
            const chain = trade.walletAddress === 'SOL_SCALPER' ? 'solana' : 'base';
            const estimatedFee = await (require('./PriceService').PriceService.getRealGasFee(chain));
            
            trade.amountOut = trade.amountIn * (1 + priceChangeRatio);
            trade.profit = (trade.amountOut - trade.amountIn) - estimatedFee; 
            trade.status = 'CLOSED';
            this.balance += (trade.amountOut - estimatedFee);
            console.log(`📈 [Portfolio] Closed ${trade.tokenSymbol || id} | ROI: ${(priceChangeRatio * 100).toFixed(4)}% | P/L: ${trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(4)} USDC (inc. REAL-TIME fees)`);
        }
    }
}

// Singleton
let instance: PortfolioService | null = null;
export const getPortfolioService = () => {
    if (!instance) instance = new PortfolioService();
    return instance;
};
