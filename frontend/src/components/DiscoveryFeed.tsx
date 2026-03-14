"use client";

import React, { useEffect, useState } from 'react';

interface DiscoveryResult {
    address: string;
    totalRoi: number;
    winRate: number;
    totalTrades: number;
    activityLevel?: 'Low' | 'Medium' | 'High';
    pnl24h?: number;
    label?: string;
    network?: string;
}

export const DiscoveryFeed = () => {
    const [wallets, setWallets] = useState<DiscoveryResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [copyingAddresses, setCopyingAddresses] = useState<Set<string>>(new Set());
    const [strategy, setStrategy] = useState<'Fixed' | 'Proportional'>('Proportional');
    const [capital, setCapital] = useState(100);

    useEffect(() => {
        const fetchDiscovery = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/solana-discovery');
                const data = await res.json();
                setWallets(data);
            } catch (error) {
                console.error("Error fetching discovery:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDiscovery();
        const interval = setInterval(fetchDiscovery, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const toggleCopy = async (address: string) => {
        const isCurrentlyCopying = copyingAddresses.has(address);
        const newCopying = new Set(copyingAddresses);

        if (isCurrentlyCopying) {
            newCopying.delete(address);
        } else {
            newCopying.add(address);
        }
        setCopyingAddresses(newCopying);

        try {
            await fetch('http://localhost:3001/api/autocopy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address,
                    enabled: !isCurrentlyCopying,
                    strategy,
                    amount: capital
                })
            });
        } catch (error) {
            console.error("Error toggling auto-copy in backend:", error);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-card p-4 rounded-xl animate-pulse h-24"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4 p-4 glass-card rounded-2xl mb-8 items-center justify-between border border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">My Capital</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={capital}
                                onChange={(e) => setCapital(Number(e.target.value))}
                                className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-white w-24 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                            />
                            <span className="text-xs text-slate-400 font-bold">USDC</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Strategy</span>
                    <div className="flex border border-white/10 rounded-xl overflow-hidden bg-black/20">
                        {(['Proportional', 'Fixed'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStrategy(s)}
                                className={`px-4 py-1.5 text-[10px] font-black uppercase transition-all ${strategy === s
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {wallets.map((wallet) => (
                <div key={wallet.address} className="glass-card p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 group hover:bg-white/5 transition-all border border-white/5">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                            {wallet.address.slice(2, 4).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-white font-bold text-sm">
                                    {(wallet as any).label || `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                                </p>
                                <span className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-purple-500/20 text-purple-400">☀️ SOL</span>
                            </div>
                            <p className="text-slate-500 font-mono text-[9px]">{wallet.address.slice(0, 12)}...{wallet.address.slice(-6)}</p>
                            <div className="flex gap-3 mt-1 items-center flex-wrap">
                                <span className="text-emerald-400 text-xs font-bold">ROI: +{wallet.totalRoi.toFixed(1)}%</span>
                                <span className="text-slate-400 text-xs">Txs: {wallet.totalTrades}</span>
                                {(wallet as any).pnl24h !== undefined && (
                                    <span className={`text-xs font-bold ${(wallet as any).pnl24h >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                                        24h: {(wallet as any).pnl24h >= 0 ? '+' : ''}{(wallet as any).pnl24h.toFixed(2)} SOL
                                    </span>
                                )}
                                {wallet.activityLevel && (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${wallet.activityLevel === 'High' ? 'bg-red-500/20 text-red-500' :
                                        wallet.activityLevel === 'Medium' ? 'bg-orange-500/20 text-orange-500' :
                                            'bg-slate-500/20 text-slate-500'
                                        }`}>
                                        {wallet.activityLevel === 'High' ? '🔥 High velocity' : wallet.activityLevel}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <p className="text-slate-500 text-[10px] uppercase tracking-tighter">Status</p>
                            <p className="text-blue-400 text-xs font-medium">Smart Money Identified</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => toggleCopy(wallet.address)}
                                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${copyingAddresses.has(wallet.address)
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95'
                                    }`}
                            >
                                {copyingAddresses.has(wallet.address) ? '✓ Copying' : 'Copy Trade'}
                            </button>

                            {copyingAddresses.has(wallet.address) && (
                                <button
                                    onClick={async () => {
                                        await fetch('http://localhost:3001/api/test-move', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ address: wallet.address })
                                        });
                                    }}
                                    className="text-[9px] uppercase font-bold text-slate-500 hover:text-blue-400 transition-colors"
                                >
                                    [ Trigger Test Move ]
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
