"use client";

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

interface Log {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning';
    timestamp: string;
}

export const ExecutionLogs = () => {
    const [logs, setLogs] = useState<Log[]>([]);

    useEffect(() => {
        const socket = io('http://localhost:3001');

        socket.on('execution_log', (newLog: Log) => {
            setLogs((prev) => [newLog, ...prev].slice(0, 10));
        });

        // Simulated logs for demo if socket isn't active
        const interval = setInterval(() => {
            if (logs.length === 0) {
                setLogs([{
                    id: Math.random().toString(),
                    message: "Watchtower: Monitoring smart wallets...",
                    type: 'info',
                    timestamp: new Date().toLocaleTimeString()
                }]);
            }
        }, 5000);

        return () => {
            socket.disconnect();
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="glass-card p-6 rounded-2xl border border-white/5 bg-white/5 h-80 overflow-hidden flex flex-col">
            <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                Live Execution Logs
            </h4>
            <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                {logs.length === 0 ? (
                    <p className="text-slate-500 text-xs italic text-center mt-12">Waiting for smart wallet movements...</p>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="text-[10px] font-mono border-l-2 border-white/10 pl-3 py-1">
                            <span className="text-slate-500 mr-2">[{log.timestamp}]</span>
                            <span className={
                                log.type === 'success' ? 'text-emerald-400' :
                                    log.type === 'warning' ? 'text-amber-400' : 'text-blue-400'
                            }>
                                {log.message}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
