"use client";

import React, { useEffect, useState, useRef } from 'react';

interface PortfolioData {
    balance: number;
    totalProfit: number;
    history: any[];
    openTrades: number;
    availableBalance?: number;
    openInvested?: number;
}

export const PortfolioSummary = () => {
    const [data, setData] = useState<PortfolioData | null>(null);
    const lastProfitMilestone = useRef<number>(0); // Track last $ milestone crossed
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Pre-load the profit sound
        audioRef.current = new Audio('/profit-alert.mp3');
        audioRef.current.volume = 0.7;
    }, []);

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/portfolio');
                const json = await res.json();
                setData(json);

                // Check if we crossed a new $1 profit milestone
                const currentMilestone = Math.floor(Math.max(json.totalProfit, 0));
                if (currentMilestone > lastProfitMilestone.current) {
                    lastProfitMilestone.current = currentMilestone;
                    if (currentMilestone > 0 && audioRef.current) {
                        audioRef.current.currentTime = 0;
                        audioRef.current.play().catch(() => { }); // play if browser allows
                    }
                }
            } catch (err) {
                console.error("Error fetching portfolio:", err);
            }
        };
        fetchPortfolio();
        const interval = setInterval(fetchPortfolio, 3000);
        return () => clearInterval(interval);
    }, []);

    if (!data) return null;

    const availableBalance = data.availableBalance ?? data.balance;
    const openInvested = data.openInvested ?? 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-2xl border border-white/5 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Balance</p>
                    <p className="text-2xl font-black text-white">{data.balance.toFixed(2)} <span className="text-xs text-blue-400">USDC</span></p>
                    {openInvested > 0 && (
                        <div className="flex gap-2 mt-1">
                            <span className="text-[9px] text-amber-400 font-bold">📊 {openInvested.toFixed(2)} invested</span>
                            <span className="text-[9px] text-emerald-400 font-bold">• {availableBalance.toFixed(2)} free</span>
                        </div>
                    )}
                </div>
                <div className="glass-card p-4 rounded-2xl border border-white/5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Total Profit</p>
                    <p className={`text-2xl font-black ${data.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {data.totalProfit >= 0 ? '+' : ''}{data.totalProfit.toFixed(4)} <span className="text-xs">USDC</span>
                    </p>
                    {data.openTrades > 0 && (
                        <p className="text-[9px] text-blue-400 mt-1 font-bold">🔴 {data.openTrades} position{data.openTrades > 1 ? 's' : ''} open</p>
                    )}
                </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Recent Output</h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-bold">LIVE SYNC</span>
                </div>

                <div className="space-y-3">
                    {data.history.length === 0 ? (
                        <p className="text-xs text-slate-500 italic text-center py-4">Waiting for first trade execution...</p>
                    ) : (
                        data.history.map((trade: any) => (
                            <div key={trade.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${trade.status === 'OPEN' ? 'bg-blue-400 animate-pulse' : trade.profit > 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                    <div>
                                        <p className="text-[12px] text-white font-black tracking-wide">
                                            {trade.tokenSymbol
                                                ? <span className="text-emerald-300">{trade.tokenSymbol}</span>
                                                : trade.walletAddress === 'SCALPER_BOT' || trade.walletAddress === 'SOL_SCALPER' ? '🤖 BOT' : `${trade.walletAddress.slice(0, 6)}...`
                                            }
                                            <span className="text-slate-500 font-normal text-[9px] ml-2">
                                                {trade.walletAddress === 'SCALPER_BOT' ? 'BASE SCALPER'
                                                    : trade.walletAddress === 'SOL_SCALPER' ? '☀️ SOL SCALPER'
                                                        : trade.walletAddress.slice(0, 8)}
                                            </span>
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[9px] text-slate-500 uppercase font-bold">{trade.status === 'OPEN' ? '📈 HOLDING' : '✔ CLOSED'}</p>
                                            <span className="text-[9px] text-slate-700">•</span>
                                            <p className="text-[9px] text-blue-300 font-bold">{trade.amountIn.toFixed(2)} USDC</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-black ${trade.profit > 0 ? 'text-emerald-400' : trade.profit < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                        {trade.status === 'OPEN' ? `⏳` : `${trade.profit >= 0 ? '+' : ''}${trade.profit?.toFixed(4)}`}
                                    </p>
                                    <p className="text-[9px] text-slate-600 font-bold">{new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
