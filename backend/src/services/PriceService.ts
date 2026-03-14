import axios from 'axios';

export class PriceService {
    private static baseUrl = 'https://api.dexscreener.com/latest/dex/tokens';

    /**
     * Fetches the current price of a token on Base.
     */
    public static async getTokenPrice(tokenAddress: string): Promise<number | null> {
        try {
            const response = await axios.get(`${this.baseUrl}/${tokenAddress}`);
            const pairs = response.data.pairs;

            if (pairs && pairs.length > 0) {
                // Return price of the most liquid pair on Base
                const basePair = pairs.find((p: any) => p.chainId === 'base');
                return basePair ? parseFloat(basePair.priceUsd) : parseFloat(pairs[0].priceUsd);
            }
            return null;
        } catch (error) {
            console.error('Error fetching token price:', error);
            return null;
        }
    }

    /**
     * Fetches REAL price momentum data (5m change %, volume) from DexScreener.
     * No simulation. No jitter. Pure real market data.
     */
    public static async getTokenMomentum(tokenAddress: string): Promise<{ price: number; change5m: number; change1h: number; volume24h: number; symbol: string } | null> {
        try {
            const response = await axios.get(`${this.baseUrl}/${tokenAddress}`);
            const pairs = response.data.pairs;

            if (pairs && pairs.length > 0) {
                const basePair = pairs.find((p: any) => p.chainId === 'base') || pairs[0];
                return {
                    price: parseFloat(basePair.priceUsd),
                    change5m: basePair.priceChange?.m5 || 0,      // REAL 5-minute price change %
                    change1h: basePair.priceChange?.h1 || 0,      // REAL 1-hour price change %
                    volume24h: basePair.volume?.h24 || 0,         // REAL 24h volume
                    symbol: basePair.baseToken?.symbol || 'TOKEN'
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching token momentum:', error);
            return null;
        }
    }

    /**
     * Fetches REAL Solana token momentum using DexScreener (Solana chain).
     */
    public static async getSolanaTokenMomentum(tokenAddress: string): Promise<{
        price: number; change5m: number; change1h: number;
        change24h: number; volume24h: number; symbol: string; liquidity: number;
    } | null> {
        try {
            const response = await axios.get(`${this.baseUrl}/${tokenAddress}`);
            const pairs = response.data.pairs;

            if (pairs && pairs.length > 0) {
                const solanaPair = pairs.find((p: any) => p.chainId === 'solana') || pairs[0];
                return {
                    price: parseFloat(solanaPair.priceUsd || '0'),
                    change5m: solanaPair.priceChange?.m5 || 0,
                    change1h: solanaPair.priceChange?.h1 || 0,
                    change24h: solanaPair.priceChange?.h24 || 0,
                    volume24h: solanaPair.volume?.h24 || 0,
                    liquidity: solanaPair.liquidity?.usd || 0,
                    symbol: solanaPair.baseToken?.symbol || 'TOKEN'
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching Solana token momentum:', error);
            return null;
        }
    }

    /**
     * Gets a real swap quote from Jupiter DEX for a SOL → token trade.
     * Returns the effective price and price impact.
     */
    public static async getJupiterQuote(tokenMint: string, solAmount: number): Promise<{
        outAmount: number; priceImpact: number; route: string;
    } | null> {
        try {
            const LAMPORTS = Math.floor(solAmount * 1_000_000_000); // SOL to lamports
            const SOL_MINT = 'So11111111111111111111111111111111111111112';
            const url = `https://quote-api.jup.ag/v6/quote?inputMint=${SOL_MINT}&outputMint=${tokenMint}&amount=${LAMPORTS}&slippageBps=100`;
            const response = await axios.get(url, { timeout: 5000 });
            const data = response.data;
            return {
                outAmount: parseInt(data.outAmount || '0'),
                priceImpact: parseFloat(data.priceImpactPct || '0') * 100,
                route: data.routePlan?.[0]?.swapInfo?.label || 'Jupiter'
            };
        } catch (error) {
            return null; // Jupiter unavailable, fallback gracefully
        }
    }

    /**
     * Full DexScreener snapshot for Solana V2 scoring engine.
     * Returns ALL fields needed by the advanced momentum modules.
     */
    public static async getSolanaDetailedData(tokenAddress: string): Promise<{
        price: number;
        symbol: string;
        // Price momentum
        change5m: number;
        change1h: number;
        change24h: number;
        // Volume (multi-window)
        volumeM5: number;
        volumeM15: number;   // derived from h1/4 approx
        volumeH1: number;
        volumeH24: number;
        // Transaction counts (for buy pressure)
        buysM5: number;
        sellsM5: number;
        // Liquidity & safety
        liquidityUsd: number;
        // Pair metadata
        pairCreatedAt: number; // unix ms
        fdv: number;
    } | null> {
        try {
            const response = await axios.get(`${this.baseUrl}/${tokenAddress}`, { timeout: 5000 });
            const pairs = response.data.pairs;
            if (!pairs || pairs.length === 0) return null;

            const p = pairs.find((x: any) => x.chainId === 'solana') || pairs[0];

            return {
                price: parseFloat(p.priceUsd || '0'),
                symbol: p.baseToken?.symbol || 'TOKEN',
                change5m: p.priceChange?.m5 || 0,
                change1h: p.priceChange?.h1 || 0,
                change24h: p.priceChange?.h24 || 0,
                volumeM5: p.volume?.m5 || 0,
                volumeM15: p.volume?.m15 || (p.volume?.h1 || 0) / 4, // approx if m15 missing
                volumeH1: p.volume?.h1 || 0,
                volumeH24: p.volume?.h24 || 0,
                buysM5: p.txns?.m5?.buys || 0,
                sellsM5: p.txns?.m5?.sells || 0,
                liquidityUsd: p.liquidity?.usd || 0,
                pairCreatedAt: p.pairCreatedAt || 0,
                fdv: p.fdv || 0,
            };
        } catch (error) {
            return null;
        }
    }
}
