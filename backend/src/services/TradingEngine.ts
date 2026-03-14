import { ethers } from 'ethers';
import { Server } from 'socket.io';
import { getPortfolioService } from './PortfolioService';
import { ScannerService } from './ScannerService';
import { PriceService } from './PriceService';

const scanner = new ScannerService();

export interface TradeSettings {
    strategy: 'Fixed' | 'Proportional';
    amount: number; // For Fixed: amount in ¤ (e.g. 10€). For Proportional: total capital pool (e.g. 100€).
    slippage: number; // e.g. 0.005 for 0.5%
}

export class TradingEngine {
    private provider: ethers.WebSocketProvider | null = null;
    public trackedWallets: Map<string, TradeSettings> = new Map();
    private isRunning: boolean = false;
    private simulationIntervals: Map<string, NodeJS.Timeout> = new Map();
    private lastSeenTxHashes: Map<string, string> = new Map();

    constructor(
        private alchemyUrl: string,
        private io?: Server
    ) { }

    /**
   * Manually trigger a test move for demonstration using REAL historical data.
   */
    public async triggerManualTest(walletAddress: string) {
        console.log(`🧪 [Test] Fetching real history for ${walletAddress}...`);
        try {
            const realBuy = await scanner.getLatestBuyTx(walletAddress);

            if (realBuy) {
                const simulatedTx = {
                    from: walletAddress,
                    to: '0xUniswapRouterBasePlaceholder',
                    value: ethers.parseEther('0.15'), // Base amount for proportionality
                    hash: realBuy.hash,
                    tokenAddress: realBuy.tokenAddress, // Custom field for demo
                    tokenSymbol: realBuy.tokenSymbol
                };
                console.log(`✅ [Real Data] Found real buy of ${realBuy.tokenSymbol}. Replaying...`);
                this.handleSmartWalletMove(simulatedTx as any);
            } else {
                // Fallback if no history found
                const fallbackTx = {
                    from: walletAddress,
                    to: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
                    value: ethers.parseEther('0.1'),
                    hash: '0x' + Math.random().toString(16).slice(2),
                    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC as fallback
                };
                this.handleSmartWalletMove(fallbackTx as any);
            }
        } catch (error) {
            console.error('Error in manual test:', error);
        }
    }

    /**
     * Starts the real-time transaction monitor (Watchtower).
     */
    async start() {
        if (this.isRunning) return;

        console.log('🚀 Starting Automated Trading Engine Watchtower...');

        // Handle invalid keys/demo mode
        if (!this.alchemyUrl || this.alchemyUrl.includes('your_key')) {
            console.log('📡 Watchtower starting in LIVE POLLING MODE (BaseScan API)...');
            this.isRunning = true;
            return;
        }

        try {
            this.provider = new ethers.WebSocketProvider(this.alchemyUrl);

            this.provider.on('pending', async (txHash) => {
                try {
                    const tx = await this.provider?.getTransaction(txHash);
                    if (tx && this.trackedWallets.has(tx.from.toLowerCase())) {
                        this.handleSmartWalletMove(tx);
                    }
                } catch (err) {
                    // Transaction might be dropped or already mined
                }
            });

            this.isRunning = true;
            console.log('✅ Watchtower is live and monitoring smart wallets (Base).');
        } catch (error) {
            console.error('❌ Failed to start Watchtower:', error);
            console.log('⚠️ Entering Demo Mode due to connection failure.');
            this.isRunning = true;
        }
    }

    /**
   * Adds or updates a wallet in the automated tracking list with specific settings.
   */
    trackWallet(address: string, settings: TradeSettings) {
        const addr = address.toLowerCase();
        this.trackedWallets.set(addr, settings);
        const logMsg = `📡 Monitoring ${address.slice(0, 8)}... | Mode: ${settings.strategy}`;
        console.log(logMsg);
        this.emitLog(logMsg, 'info');

        // If in Demo Mode, start automated simulation loop
        if (!this.provider || this.alchemyUrl.includes('your_key')) {
            if (this.simulationIntervals.has(addr)) {
                clearInterval(this.simulationIntervals.get(addr)!);
            }

            // LIVE POLLER: Check BaseScan every 10-15 seconds for ACTUAL new transactions
            const interval = setInterval(async () => {
                const latest = await scanner.getAbsoluteLatestTx(address);
                if (latest && latest.hash !== this.lastSeenTxHashes.get(addr)) {
                    this.lastSeenTxHashes.set(addr, latest.hash);
                    const msg = `📡 [Live Watch] New blockchain event detected for ${address}: ${latest.tokenSymbol || 'ETH Move'}`;
                    console.log(`✨ ${msg}`);
                    this.emitLog(msg, 'info');

                    this.handleSmartWalletMove({
                        from: address,
                        to: latest.to,
                        value: latest.value,
                        hash: latest.hash,
                        tokenAddress: latest.tokenAddress || '0x4200000000000000000000000000000000000006', // Default WETH
                        tokenSymbol: latest.tokenSymbol || 'ETH'
                    });
                }
            }, 12000);

            this.simulationIntervals.set(addr, interval);
        }
    }

    /**
     * Stops tracking a specific wallet.
     */
    untrackWallet(address: string) {
        const addr = address.toLowerCase();
        if (this.trackedWallets.has(addr)) {
            this.trackedWallets.delete(addr);
            if (this.simulationIntervals.has(addr)) {
                clearInterval(this.simulationIntervals.get(addr)!);
                this.simulationIntervals.delete(addr);
            }
            console.log(`📡 Stopped monitoring ${address}`);
            this.emitLog(`Stopped monitoring ${address.slice(0, 6)}...`, 'warning');
        }
    }

    /**
     * Logic to handle a movement detected from a smart wallet.
     */
    private async handleSmartWalletMove(tx: any) {
        const addr = tx.from.toLowerCase();
        const settings = this.trackedWallets.get(addr);
        if (!settings) return;

        let tradeAmount = 0;
        if (settings.strategy === 'Fixed') {
            tradeAmount = settings.amount;
        } else {
            // PROPORTIONAL LOGIC
            const simulatedSmartBag = 2;
            const ratio = parseFloat(ethers.formatEther(tx.value)) / simulatedSmartBag;
            tradeAmount = ratio * settings.amount;
        }

        const tokenAddress = tx.tokenAddress || '0x';
        const tokenSymbol = tx.tokenSymbol || 'TOKEN';
        const tradeId = getPortfolioService().registerTrade(tx.from, tradeAmount, tokenAddress, tokenSymbol);

        if (!tradeId) {
            this.emitLog(`⚠️ [Copy-Trade] Insufficient balance to copy ${tx.from.slice(0, 6)}... Skipping.`, 'warning');
            return;
        }

        const moveMsg = `🔁 [Copy-Trade] ${tx.from.slice(0, 6)}... bought ${tokenSymbol}. Copying: ${tradeAmount.toFixed(2)} USDC`;
        console.log(`🔥 [Copy] ${moveMsg}`);
        this.emitLog(moveMsg, 'success');

        // Simulating execution with REAL PRICES
        this.simulateExecution(tokenAddress, tradeAmount, tradeId, tokenSymbol);
    }

    private async simulateExecution(tokenAddress: string, amount: number, tradeId: string, tokenSymbol: string = 'TOKEN') {
        const entryPrice = await PriceService.getTokenPrice(tokenAddress);

        setTimeout(async () => {
            const successMsg = `✅ [Execution] Swapped ${amount.toFixed(2)} USDC → ${tokenSymbol} @ $${entryPrice?.toFixed(6) || '??'}`;
            console.log(successMsg);
            this.emitLog(successMsg, 'success');

            // Close trade after some time to simulate profit based on REAL price change
            setTimeout(async () => {
                const exitPrice = await PriceService.getTokenPrice(tokenAddress);

                // If we have real prices, modify the closeTrade logic to be real
                if (entryPrice && exitPrice) {
                    const priceChange = (exitPrice - entryPrice) / entryPrice;
                    // Force PortfolioService to use this real profit (we'll update closeTrade to accept it)
                    (getPortfolioService() as any).closeTradeWithRealProfit(tradeId, priceChange);
                } else {
                    getPortfolioService().closeTrade(tradeId);
                }

                const portfolio = getPortfolioService().getPortfolio();
                const lastTrade = portfolio.history[0]; // Most recent
                const profitMsg = `Trade Closed. Profit: ${lastTrade.profit! > 0 ? '✅' : '❌'} (${(lastTrade.profit!).toFixed(2)} USDC). New Balance: ${portfolio.balance.toFixed(2)} USDC`;
                this.emitLog(profitMsg, lastTrade.profit! > 0 ? 'success' : 'warning');
            }, 10000); // Wait 10s to see price change
        }, 2000);
    }

    public emitLog(message: string, type: 'info' | 'success' | 'warning') {
        console.log(`[${type.toUpperCase()}] ${message}`); // Debugging in terminal
        if (this.io) {
            this.io.emit('execution_log', {
                id: Math.random().toString(36).substr(2, 9),
                message,
                type,
                timestamp: new Date().toLocaleTimeString()
            });
        }
    }

    stop() {
        if (this.provider) {
            this.provider.removeAllListeners();
            this.provider.destroy();
        }
        this.isRunning = false;
    }
}
