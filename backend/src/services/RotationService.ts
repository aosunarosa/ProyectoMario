import { ScannerService } from './ScannerService';
import { getTradingEngine } from './EngineInstance';
import { getPortfolioService } from './PortfolioService';

export class RotationService {
    private isRunning = false;
    private scanner = new ScannerService();
    private rotationInterval: NodeJS.Timeout | null = null;

    /**
     * Starts the autonomous rotation loop.
     */
    public startAutonomousMode() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('🤖 [Autonomous Mode] Activated. Bot will now manage its own wallet list.');

        // Run rotation every 2 minutes for the demo
        this.rotationInterval = setInterval(() => {
            this.performRotation();
        }, 120000);

        // Initial run
        this.performRotation();
    }

    public stopAutonomousMode() {
        if (this.rotationInterval) clearInterval(this.rotationInterval);
        this.isRunning = false;
    }

    private async performRotation() {
        const engine = getTradingEngine();
        const startMsg = '🔄 [IA Mode] scanning for new Alpha whales...';
        console.log(startMsg);
        (engine as any).emitLog(startMsg, 'info');

        // 1. Get current tracked wallets from Engine
        const trackedAddresses: string[] = Array.from((engine as any).trackedWallets.keys()) as string[];

        // 2. Evaluate performance (Pruning)
        for (const addr of trackedAddresses) {
            const stats = await this.scanner.calculateProfitability(addr);
            // If ROI is low or no recent activity, untrack
            if (stats.totalRoi < 20) {
                console.log(`🗑️ [Autonomous Mode] Pruning underperformer: ${addr} (ROI: ${stats.totalRoi.toFixed(1)}%)`);
                engine.untrackWallet(addr);
            }
        }

        // 3. Find new candidates to fill slots (Discovery)
        const candidates = await this.scanner.discoverSmartWallets();
        const topCandidates = candidates.filter(c => !trackedAddresses.includes(c.address.toLowerCase())).slice(0, 3);

        for (const candidate of topCandidates) {
            console.log(`✨ [Autonomous Mode] Auto-tracking new alpha wallet: ${candidate.address} (ROI: ${candidate.totalRoi.toFixed(1)}%)`);
            engine.trackWallet(candidate.address, {
                strategy: 'Proportional',
                amount: 100,
                slippage: 0.005
            });
        }
    }
}

let instance: RotationService | null = null;
export const getRotationService = () => {
    if (!instance) instance = new RotationService();
    return instance;
}
