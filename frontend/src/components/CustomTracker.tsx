"use client";

import React, { useState } from 'react';

export const CustomTracker = () => {
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleTrack = async () => {
        if (!address.startsWith('0x') || address.length !== 42) {
            alert('Please enter a valid Base wallet address');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/autocopy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address,
                    enabled: true,
                    strategy: 'Proportional',
                    amount: 100, // Default 100 USDC based on user request
                    slippage: 0.01 // 1%
                })
            });

            if (response.ok) {
                setStatus('success');
                setAddress('');
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                setStatus('error');
            }
        } catch (err) {
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="glass-card p-10 rounded-[3rem] border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
            <h3 className="text-xl font-bold mb-4 text-white">Custom Tracking</h3>
            <p className="text-slate-400 text-sm mb-6">
                Track any Base address manually to analyze performance and enable auto-copy.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
                <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="0x... (Base Wallet Address)"
                    className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-mono"
                />
                <button
                    onClick={handleTrack}
                    disabled={loading}
                    className={`bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 whitespace-nowrap ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Processing...' : status === 'success' ? '✓ Added' : 'Track Address'}
                </button>
            </div>
            {status === 'error' && <p className="text-rose-400 text-[10px] mt-2 font-bold uppercase tracking-widest">Failed to add address. Try again.</p>}
        </section>
    );
};
