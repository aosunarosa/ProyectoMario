import { TradingEngine } from './TradingEngine';
import { Server } from 'socket.io';

let tradingEngineInstance: TradingEngine | null = null;

export const initializeTradingEngine = (alchemyUrl: string, io?: Server) => {
    if (!tradingEngineInstance) {
        tradingEngineInstance = new TradingEngine(alchemyUrl, io);
        if (alchemyUrl) {
            tradingEngineInstance.start();
        }
    }
    return tradingEngineInstance;
};

export const getTradingEngine = () => {
    if (!tradingEngineInstance) {
        throw new Error('Trading Engine not initialized');
    }
    return tradingEngineInstance;
};
