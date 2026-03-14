"use client";

import React, { useEffect, useState } from 'react';

interface WalletStatsData {
    address: string;
    totalRoi: number;
    winRate: number;
    totalTrades: number;
    profitableTrades: number;
}

export const WalletStatsCard = ({ address }: { address: string }) => {
    const [stats, setStats] = useState<WalletStatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`http://localhost:3001/api/wallet/${address}`);
                const data = await res.json();
                setStats(data);
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        if (address) {
            fetchStats();
        }
    }, [address]);

    if (loading) {
        return (
            <div className="glass-card p-6 rounded-2xl animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-slate-700 rounded w-1/2"></div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group transition-all hover:scale-[1.02]">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="w-24 h-24 bg-blue-500 rounded-full blur-3xl"></div>
            </div>

            <h3 className="text-slate-400 text-sm font-medium mb-1">Total ROI</h3>
            <div className="text-3xl font-bold mb-4">
                <span className={stats.totalRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {stats.totalRoi >= 0 ? '+' : ''}{stats.totalRoi}%
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Win Rate</p>
                    <p className="text-lg font-semibold text-slate-200">{(stats.winRate * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Total Trades</p>
                    <p className="text-lg font-semibold text-slate-200">{stats.totalTrades}</p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-slate-500 text-[10px] break-all font-mono opacity-60">
                    {stats.address}
                </p>
            </div>
        </div>
    );
};
