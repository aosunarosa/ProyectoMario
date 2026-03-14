import { Request, Response } from 'express';
import { ScannerService } from '../services/ScannerService';
import { SolanaScannerService } from '../services/SolanaScannerService';
import { ethers } from 'ethers';
import { getTradingEngine } from '../services/EngineInstance';
import { getPortfolioService } from '../services/PortfolioService';
import { getRotationService } from '../services/RotationService';
import { getScalperService } from '../services/ScalperService';
import { getSolanaScalperService } from '../services/SolanaScalperService';

const scannerService = new ScannerService();
const solanaScannerService = new SolanaScannerService();

export const getPortfolio = async (req: Request, res: Response) => {
    try {
        const portfolio = getPortfolioService().getPortfolio();
        res.json(portfolio);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
};

export const getWalletStats = async (req: Request, res: Response) => {
    const { address } = req.params;

    if (!ethers.isAddress(address as string)) {
        return res.status(400).json({ error: 'Invalid wallet address' });
    }

    try {
        const stats = await scannerService.calculateProfitability(address as string);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to calculate profitability' });
    }
};

export const toggleAutoCopy = async (req: Request, res: Response) => {
    const { address, enabled, strategy, amount, slippage } = req.body;

    if (!ethers.isAddress(address)) {
        return res.status(400).json({ error: 'Invalid wallet address' });
    }

    try {
        const tradingEngine = getTradingEngine();
        if (enabled) {
            tradingEngine.trackWallet(address, {
                strategy: strategy || 'Proportional',
                amount: amount || 100, // Default 100€
                slippage: slippage || 0.005 // Default 0.5%
            });
        } else {
            // Logic to untrack would go here
        }
        res.json({ success: true, address, enabled });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle auto-copy' });
    }
};

export const getSmartDiscovery = async (req: Request, res: Response) => {
    try {
        const discoveryResults = await scannerService.discoverSmartWallets();
        const enhancedResults = await Promise.all(discoveryResults.map(async (s) => {
            const activity = await scannerService.analyzeActivity(s.address);
            return { ...s, activityLevel: activity.level };
        }));
        res.json(enhancedResults);
    } catch (error) {
        res.status(500).json({ error: 'Failed to discover smart wallets' });
    }
};

export const getSolanaDiscovery = async (req: Request, res: Response) => {
    try {
        const wallets = await solanaScannerService.discoverTopWallets();
        const enhanced = await Promise.all(wallets.map(async (w) => {
            const activity = await solanaScannerService.analyzeActivity(w.address);
            return { ...w, activityLevel: activity.level, network: 'solana' };
        }));
        res.json(enhanced);
    } catch (error) {
        res.status(500).json({ error: 'Failed to discover Solana wallets' });
    }
};

export const triggerTest = async (req: Request, res: Response) => {
    const { address } = req.body;
    try {
        const tradingEngine = getTradingEngine();
        tradingEngine.triggerManualTest(address);
        res.json({ success: true, message: 'Test trade triggered' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to trigger test' });
    }
};

export const toggleAutonomousMode = async (req: Request, res: Response) => {
    const { enabled } = req.body;
    try {
        const rotationService = getRotationService();
        if (enabled) {
            rotationService.startAutonomousMode();
        } else {
            rotationService.stopAutonomousMode();
        }
        res.json({ success: true, autonomousMode: enabled });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle autonomous mode' });
    }
};

export const toggleScalper = async (req: Request, res: Response) => {
    const { enabled, balance } = req.body;
    try {
        const scalper = getScalperService();
        if (enabled) {
            await scalper.startScalper(balance || 100);
        } else {
            scalper.stopScalper();
        }
        res.json({ success: true, scalperActive: enabled });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle scalper' });
    }
};

export const toggleSolanaScalper = async (req: Request, res: Response) => {
    const { enabled, balance } = req.body;
    try {
        const scalper = getSolanaScalperService();
        if (enabled) {
            await scalper.startScalper(balance || 1.0); // Default 1 SOL
        } else {
            scalper.stopScalper();
        }
        res.json({ success: true, solanaScalperActive: enabled });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle Solana scalper' });
    }
};
