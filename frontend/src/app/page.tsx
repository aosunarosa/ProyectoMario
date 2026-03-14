"use client";

import React, { useState } from 'react';
import { WalletStatsCard } from '@/components/WalletStatsCard';
import { DiscoveryFeed } from '@/components/DiscoveryFeed';
import { ConnectWallet } from '@/components/ConnectWallet';
import { ExecutionLogs } from '@/components/ExecutionLogs';
import { PortfolioSummary } from '@/components/PortfolioSummary';
import { CustomTracker } from '@/components/CustomTracker';

export default function Home() {
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [scalperActive, setScalperActive] = useState(false);
  const [solanaScalperActive, setSolanaScalperActive] = useState(false);

  const toggleAutonomous = async () => {
    const nextState = !autonomousMode;
    setAutonomousMode(nextState);
    try {
      await fetch('http://localhost:3001/api/autonomous-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState })
      });
    } catch (error) {
      console.error("Error toggling autonomous mode:", error);
    }
  };

  const toggleScalper = async () => {
    const nextState = !scalperActive;
    setScalperActive(nextState);
    try {
      await fetch('http://localhost:3001/api/scalper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState, balance: 100 }) // Default 100 for demo
      });
    } catch (error) {
      console.error("Error toggling scalper:", error);
    }
  };

  const toggleSolanaScalper = async () => {
    const nextState = !solanaScalperActive;
    setSolanaScalperActive(nextState);
    try {
      await fetch('http://localhost:3001/api/solana-scalper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState, balance: 1.0 })
      });
    } catch (error) { console.error("Error toggling Solana scalper:", error); }
  };

  return (
    <main className="min-h-screen bg-premium-gradient px-6 py-12 lg:px-24">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-extrabold mb-2 tracking-tight">
            <span className="text-gradient">Smart Money</span> Tracker
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Real-time insights and automated scanning for the most profitable cryptocurrency wallets.
          </p>
        </div>
        <ConnectWallet />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content: Discovery & Rankings */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <div className="flex items-center gap-4 glass-card p-6 rounded-3xl justify-between border border-blue-500/30 bg-blue-500/10 shadow-2xl shadow-blue-500/10">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${autonomousMode ? 'bg-blue-400 animate-pulse' : 'bg-slate-700'}`}></div>
                <div>
                  <h3 className="text-white font-bold text-lg">Autonomous Alpha Rotation</h3>
                  <p className="text-blue-400 text-[10px] uppercase font-black tracking-widest">IA-Optimized Whale Selection Mode</p>
                </div>
              </div>
              <button
                onClick={toggleAutonomous}
                className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all transform active:scale-95 ${autonomousMode
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/40 border border-blue-400/50'
                  : 'bg-white/5 text-slate-500 border border-white/10 hover:border-white/20'
                  }`}
              >
                {autonomousMode ? 'IA Active' : 'Start IA Mode'}
              </button>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-white">Smart Discovery</h2>
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-widest border border-blue-500/20">
                AI Alpha Feed
              </span>
            </div>
            <DiscoveryFeed />
          </section>

          <CustomTracker />
        </div>

        {/* Sidebar: Portfolio & Logs */}
        <aside className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-6 text-white px-2">My Profile</h2>
            <PortfolioSummary />
          </section>

          <section>
            <h2 className="text-xl font-bold mb-6 text-white px-2">Operation Logs</h2>
            <ExecutionLogs />
          </section>

          <section className="glass-card p-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 shadow-2xl shadow-emerald-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${scalperActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-700'}`}></div>
                <h4 className="text-white font-bold uppercase text-[10px]">Degen Scalper</h4>
              </div>
              <button
                onClick={toggleScalper}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${scalperActive ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-500 border border-white/10'
                  }`}
              >
                {scalperActive ? 'Active' : 'Start Scalp'}
              </button>
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed mb-3">
              High-frequency momentum bot scanning for micro-movements every 15s.
            </p>
            <div className="flex items-center justify-between p-2 bg-black/20 rounded-xl border border-white/5">
              <span className="text-[9px] text-slate-500 font-bold uppercase">Allocated</span>
              <span className="text-emerald-400 text-xs font-black">100.00 USDC</span>
            </div>
          </section>

          {/* SOL Scalper (Solana) */}
          <section className="glass-card p-6 rounded-3xl border border-purple-500/30 bg-purple-500/10 shadow-2xl shadow-purple-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${solanaScalperActive ? 'bg-purple-400 animate-ping' : 'bg-slate-700'}`}></div>
                <div>
                  <h4 className="text-white font-bold uppercase text-[10px]">SOL Jupiter Scalper</h4>
                  <p className="text-purple-400 text-[8px] font-black uppercase tracking-widest">Solana · Jupiter DEX</p>
                </div>
              </div>
              <button
                onClick={toggleSolanaScalper}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${solanaScalperActive ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-white/5 text-slate-500 border border-white/10'
                  }`}
              >
                {solanaScalperActive ? '☀️ Active' : 'Start SOL'}
              </button>
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed mb-3">
              Monitors BONK · WIF · POPCAT · JUP · ai16z · RAY. Scores by 5m momentum + volume. Exits via real TP/SL.
            </p>
            <div className="flex items-center justify-between p-2 bg-black/20 rounded-xl border border-white/5">
              <span className="text-[9px] text-slate-500 font-bold uppercase">Allocated</span>
              <span className="text-purple-400 text-xs font-black">1.00 SOL</span>
            </div>
          </section>

          <section className="glass-card p-6 rounded-2xl border border-white/5 bg-white/5">
            <h4 className="text-[10px] font-black text-slate-500 mb-4 uppercase tracking-[0.2em]">Scanner Insights</h4>
            <div className="space-y-4">
              <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <p className="text-blue-400 text-[11px] font-black uppercase mb-1">Base Alpha</p>
                <p className="text-slate-500 text-[10px] leading-relaxed">Dynamic discovery is scanning the Base network every 5 seconds for high-ROI wallets.</p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <footer className="mt-24 pt-8 border-t border-white/5 text-slate-600 text-sm flex flex-col md:flex-row justify-between gap-4">
        <p>© 2026 Smart Money Wallet Tracker. Built for the elite.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-400 transition-colors">Documentation</a>
          <a href="#" className="hover:text-slate-400 transition-colors">Twitter</a>
          <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
        </div>
      </footer>
    </main>
  );
}
