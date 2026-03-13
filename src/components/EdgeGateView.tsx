'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppState } from '@/lib/state-provider';
import { serialiseTicket } from '@/lib/crypto-ticket';
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Scan,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Timer,
  Fingerprint,
  Cpu,
  Radio,
  Activity,
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EDGE GATE SIMULATOR — Offline Turnstile with Bloom Filter
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function EdgeGateView() {
  const { currentTicket, scanTicket, scanHistory, bloomFilter } = useAppState();
  const [flashState, setFlashState] = useState<'idle' | 'valid' | 'invalid' | 'replay'>('idle');
  const [lastResult, setLastResult] = useState<{
    status: 'VALID' | 'INVALID_SIGNATURE' | 'REPLAY_ATTACK' | 'EXPIRED';
    message: string;
    ticketId?: string;
    timestamp: number;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);

  // Simulate a scan of the current active ticket
  const handleScan = useCallback(() => {
    if (!currentTicket) return;
    setIsScanning(true);

    // Simulate scanner delay
    setTimeout(() => {
      const qrData = serialiseTicket(currentTicket);
      const result = scanTicket(qrData);
      setLastResult(result);
      setIsScanning(false);

      if (result.status === 'VALID') {
        setFlashState('valid');
      } else if (result.status === 'REPLAY_ATTACK') {
        setFlashState('replay');
      } else {
        setFlashState('invalid');
      }

      // Reset flash after animation
      setTimeout(() => setFlashState('idle'), 3000);
    }, 800);
  }, [currentTicket, scanTicket]);

  // Manual QR paste scan
  const [manualQR, setManualQR] = useState('');
  const handleManualScan = useCallback(() => {
    if (!manualQR.trim()) return;
    setIsScanning(true);
    setTimeout(() => {
      const result = scanTicket(manualQR.trim());
      setLastResult(result);
      setIsScanning(false);
      if (result.status === 'VALID') setFlashState('valid');
      else if (result.status === 'REPLAY_ATTACK') setFlashState('replay');
      else setFlashState('invalid');
      setTimeout(() => setFlashState('idle'), 3000);
      setManualQR('');
    }, 800);
  }, [manualQR, scanTicket]);

  const flashBg =
    flashState === 'valid'
      ? 'bg-green-500/10 border-green-500/50'
      : flashState === 'replay'
      ? 'bg-red-500/20 border-red-500/70'
      : flashState === 'invalid'
      ? 'bg-orange-500/10 border-orange-500/50'
      : 'bg-[#edf5ef]/50 border-gray-200';

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      flashState === 'replay' ? 'animate-pulse bg-red-950' : 'bg-gradient-to-b from-[#f7faf7] via-[#edf5ef] to-[#e6f0e8]'
    }`}>
      {/* FULL-SCREEN REPLAY ATTACK OVERLAY */}
      {flashState === 'replay' && (
        <div className="fixed inset-0 z-50 bg-red-900/90 flex items-center justify-center animate-pulse">
          <div className="text-center space-y-4 p-8">
            <div className="w-24 h-24 mx-auto rounded-full bg-red-500/30 border-4 border-red-500 flex items-center justify-center animate-bounce">
              <ShieldX className="w-12 h-12 text-red-300" />
            </div>
            <h1 className="text-4xl font-black text-red-100 tracking-tight">REJECTED</h1>
            <p className="text-xl font-bold text-red-300">🚨 REPLAY ATTACK DETECTED 🚨</p>
            <p className="text-sm text-red-200/70 max-w-md">
              This ticket has already been scanned. The Bloom Filter detected a duplicate fingerprint.
              Gate remains LOCKED. Security team notified.
            </p>
            <div className="mt-4 px-4 py-2 bg-red-800/50 rounded-lg text-xs font-mono text-red-300">
              BLOOM_FILTER_MATCH=TRUE | GATE_STATE=LOCKED | ALERT_LEVEL=CRITICAL
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shadow-xl shadow-cyan-500/20">
            <Cpu className="w-7 h-7 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-black tracking-tight">Edge Gate Validator</h1>
            <p className="text-xs text-black/40 font-mono">OFFLINE TURNSTILE SIMULATOR · BLOOM FILTER ACTIVE</p>
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
            <Radio className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-amber-400 font-mono">OFFLINE MODE</span>
          </div>
        </div>

        {/* Gate Status Panel */}
        <div className={`rounded-2xl border-2 p-6 transition-all duration-500 ${flashBg}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm font-mono text-black/50">GATE STATUS</div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
              flashState === 'valid'
                ? 'bg-green-500/20 text-green-400'
                : flashState === 'replay' || flashState === 'invalid'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-[#dde9df] text-black/40'
            }`}>
              {flashState === 'valid' ? '● OPEN' : flashState === 'idle' ? '○ STANDBY' : '✕ LOCKED'}
            </div>
          </div>

          {/* Scanner Visualization */}
          <div
            ref={scannerRef}
            className={`relative mx-auto w-48 h-48 rounded-2xl border-2 border-dashed flex items-center justify-center mb-6 transition-all ${
              isScanning
                ? 'border-cyan-400 bg-cyan-500/5'
                : flashState === 'valid'
                ? 'border-green-400 bg-green-500/5'
                : flashState === 'replay'
                ? 'border-red-500 bg-red-500/10'
                : 'border-gray-300 bg-[#f2f7f3]/50'
            }`}
          >
            {isScanning ? (
              <div className="text-center space-y-2">
                <Scan className="w-10 h-10 text-cyan-400 mx-auto animate-pulse" />
                <p className="text-xs text-cyan-400 font-mono">SCANNING...</p>
                {/* Scanner line animation */}
                <div className="absolute inset-x-4 h-0.5 bg-cyan-400/60 animate-bounce" style={{ top: '40%' }} />
              </div>
            ) : flashState === 'valid' ? (
              <div className="text-center space-y-2">
                <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
                <p className="text-xs text-green-400 font-bold">VALIDATED</p>
              </div>
            ) : flashState === 'replay' ? (
              <div className="text-center space-y-2">
                <ShieldAlert className="w-14 h-14 text-red-400 mx-auto animate-bounce" />
                <p className="text-xs text-red-400 font-bold">REPLAY DETECTED</p>
              </div>
            ) : flashState === 'invalid' ? (
              <div className="text-center space-y-2">
                <XCircle className="w-14 h-14 text-orange-400 mx-auto" />
                <p className="text-xs text-orange-400 font-bold">INVALID</p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <Fingerprint className="w-10 h-10 text-black/20 mx-auto" />
                <p className="text-[10px] text-black/30 font-mono">TAP TICKET</p>
              </div>
            )}
          </div>

          {/* Scan Button */}
          <button
            onClick={handleScan}
            disabled={!currentTicket || isScanning}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-black font-bold text-sm
              hover:from-cyan-500 hover:to-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed
              shadow-lg shadow-cyan-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Scan className="w-4 h-4" />
            {!currentTicket
              ? 'No Ticket Available — Generate one in Commuter View'
              : isScanning
              ? 'Validating...'
              : 'Scan Active Ticket'}
          </button>

          {/* Manual QR Input */}
          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-mono text-black/30 uppercase">Or paste QR data manually:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualQR}
                onChange={e => setManualQR(e.target.value)}
                placeholder="Paste raw QR JSON..."
                className="flex-1 bg-[#f2f7f3]/80 border border-gray-200 rounded-lg px-3 py-2 text-xs text-black/70 font-mono
                  outline-none focus:border-cyan-500/50 placeholder:text-black/20"
              />
              <button
                onClick={handleManualScan}
                disabled={!manualQR.trim() || isScanning}
                className="px-4 py-2 rounded-lg bg-[#dde9df] text-xs text-black/60 hover:bg-[#cfe0d3] transition disabled:opacity-30"
              >
                Scan
              </button>
            </div>
          </div>
        </div>

        {/* Last Result Detail */}
        {lastResult && (
          <div className={`rounded-xl border p-4 ${
            lastResult.status === 'VALID'
              ? 'bg-green-500/5 border-green-500/30'
              : lastResult.status === 'REPLAY_ATTACK'
              ? 'bg-red-500/10 border-red-500/40'
              : 'bg-orange-500/5 border-orange-500/30'
          }`}>
            <div className="flex items-start gap-3">
              {lastResult.status === 'VALID' ? (
                <ShieldCheck className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
              ) : lastResult.status === 'REPLAY_ATTACK' ? (
                <ShieldAlert className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-black">{lastResult.message}</p>
                <p className="text-[10px] text-black/30 font-mono mt-1">
                  Validated at {new Date(lastResult.timestamp).toLocaleTimeString()} | Bloom Fill: {(bloomFilter.fillRatio * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bloom Filter Visualization */}
        <div className="bg-[#f2f7f3]/40 border border-gray-200 rounded-2xl p-4">
          <h3 className="text-xs font-mono text-black/40 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity className="w-3 h-3" />
            Bloom Filter State
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#edf5ef]/50 rounded-xl p-3">
              <p className="text-[10px] text-black/40">Fill Ratio</p>
              <p className="text-xl font-bold text-cyan-400">{(bloomFilter.fillRatio * 100).toFixed(1)}%</p>
              <div className="mt-2 h-1.5 bg-[#dde9df] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${bloomFilter.fillRatio * 100}%` }}
                />
              </div>
            </div>
            <div className="bg-[#edf5ef]/50 rounded-xl p-3">
              <p className="text-[10px] text-black/40">Hash Functions (k)</p>
              <p className="text-xl font-bold text-purple-400">7</p>
              <p className="text-[10px] text-black/30 mt-1">FNV-1a variant</p>
            </div>
            <div className="bg-[#edf5ef]/50 rounded-xl p-3">
              <p className="text-[10px] text-black/40">Bit Array Size (m)</p>
              <p className="text-xl font-bold text-green-400">2,048</p>
              <p className="text-[10px] text-black/30 mt-1">256 bytes</p>
            </div>
            <div className="bg-[#edf5ef]/50 rounded-xl p-3">
              <p className="text-[10px] text-black/40">Scans Processed</p>
              <p className="text-xl font-bold text-amber-400">{scanHistory.length}</p>
              <p className="text-[10px] text-black/30 mt-1">This session</p>
            </div>
          </div>
        </div>

        {/* Scan History Log */}
        <div className="bg-[#f2f7f3]/40 border border-gray-200 rounded-2xl p-4">
          <h3 className="text-xs font-mono text-black/40 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Timer className="w-3 h-3" />
            Scan History Log
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {scanHistory.length === 0 ? (
              <p className="text-xs text-black/20 text-center py-4">No scans yet</p>
            ) : (
              scanHistory.map((scan, i) => (
                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                  scan.status === 'VALID'
                    ? 'bg-green-500/5'
                    : scan.status === 'REPLAY_ATTACK'
                    ? 'bg-red-500/10'
                    : 'bg-orange-500/5'
                }`}>
                  {scan.status === 'VALID' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                  ) : scan.status === 'REPLAY_ATTACK' ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-black/70 truncate">{scan.message}</p>
                    <p className="text-[9px] text-black/30 font-mono">{new Date(scan.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
