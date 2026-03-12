'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { SignedTicket, createSignedTicket, refreshTicket, verifyTicketSignature } from '@/lib/crypto-ticket';
import { BloomFilter } from '@/lib/bloom-filter';
import { SystemEvent, DashboardState, generateEventStream, replayToIndex } from '@/lib/event-sourcing';
import { RouteResult } from '@/lib/metro-network';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ScanResult {
  status: 'VALID' | 'INVALID_SIGNATURE' | 'REPLAY_ATTACK' | 'EXPIRED';
  message: string;
  timestamp: number;
  ticketId?: string;
}

interface AppState {
  // Commuter
  currentTicket: SignedTicket | null;
  currentRoute: RouteResult | null;
  setCurrentRoute: (r: RouteResult | null) => void;
  generateTicket: (from: string, to: string, fare: number) => void;
  refreshCurrentTicket: () => void;

  // Edge Gate
  bloomFilter: BloomFilter;
  scanHistory: ScanResult[];
  scanTicket: (qrData: string) => ScanResult;

  // Dashboard
  eventStream: SystemEvent[];
  replayIndex: number;
  setReplayIndex: (idx: number) => void;
  dashboardState: DashboardState;
  isLivePlaying: boolean;
  setIsLivePlaying: (v: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // ── Commuter State ──
  const [currentTicket, setCurrentTicket] = useState<SignedTicket | null>(null);
  const [currentRoute, setCurrentRoute] = useState<RouteResult | null>(null);

  const generateTicket = useCallback((from: string, to: string, fare: number) => {
    const ticket = createSignedTicket(from, to, fare);
    setCurrentTicket(ticket);
  }, []);

  const refreshCurrentTicket = useCallback(() => {
    setCurrentTicket(prev => prev ? refreshTicket(prev) : null);
  }, []);

  // ── Edge Gate State ──
  const bloomFilterRef = useRef(new BloomFilter(2048, 7));
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);

  const scanTicket = useCallback((qrData: string): ScanResult => {
    // 1) Parse
    let parsed: SignedTicket;
    try {
      parsed = JSON.parse(qrData);
      if (!parsed.payload || !parsed.signature) throw new Error();
    } catch {
      const result: ScanResult = {
        status: 'INVALID_SIGNATURE',
        message: 'Malformed ticket data — cannot parse QR payload.',
        timestamp: Date.now(),
      };
      setScanHistory(prev => [result, ...prev]);
      return result;
    }

    // 2) Verify HMAC
    if (!verifyTicketSignature(parsed)) {
      const result: ScanResult = {
        status: 'INVALID_SIGNATURE',
        message: `HMAC-SHA256 verification FAILED for ticket ${parsed.payload.ticketId}. Possible tampering detected.`,
        timestamp: Date.now(),
        ticketId: parsed.payload.ticketId,
      };
      setScanHistory(prev => [result, ...prev]);
      return result;
    }

    // 3) Check expiry
    if (Date.now() > parsed.payload.expiresAt) {
      const result: ScanResult = {
        status: 'EXPIRED',
        message: `Ticket ${parsed.payload.ticketId} has expired.`,
        timestamp: Date.now(),
        ticketId: parsed.payload.ticketId,
      };
      setScanHistory(prev => [result, ...prev]);
      return result;
    }

    // 4) Bloom Filter replay check
    const ticketFingerprint = `${parsed.payload.ticketId}:${parsed.payload.nonce}`;
    if (bloomFilterRef.current.contains(ticketFingerprint)) {
      const result: ScanResult = {
        status: 'REPLAY_ATTACK',
        message: `🚨 REJECTED: Replay Attack Detected! Ticket ${parsed.payload.ticketId} has already been scanned. Bloom Filter match on fingerprint.`,
        timestamp: Date.now(),
        ticketId: parsed.payload.ticketId,
      };
      setScanHistory(prev => [result, ...prev]);
      return result;
    }

    // 5) Insert into Bloom Filter and accept
    bloomFilterRef.current.insert(ticketFingerprint);
    const result: ScanResult = {
      status: 'VALID',
      message: `✅ GATE OPEN — Ticket ${parsed.payload.ticketId} validated. Route: ${parsed.payload.from} → ${parsed.payload.to}. Fare: ₹${parsed.payload.fare}.`,
      timestamp: Date.now(),
      ticketId: parsed.payload.ticketId,
    };
    setScanHistory(prev => [result, ...prev]);
    return result;
  }, []);

  // ── Dashboard / Event Sourcing State ──
  const [eventStream] = useState<SystemEvent[]>(() => generateEventStream(30));
  const [replayIndex, setReplayIndex] = useState<number>(eventStream.length - 1);
  const [dashboardState, setDashboardState] = useState<DashboardState>(() =>
    replayToIndex(eventStream, eventStream.length - 1)
  );
  const [isLivePlaying, setIsLivePlaying] = useState(false);

  // Recompute dashboard state whenever replay index changes
  useEffect(() => {
    setDashboardState(replayToIndex(eventStream, replayIndex));
  }, [eventStream, replayIndex]);

  // Live playback: auto-advance replay index
  useEffect(() => {
    if (!isLivePlaying) return;
    if (replayIndex >= eventStream.length - 1) {
      setIsLivePlaying(false);
      return;
    }
    const timer = setInterval(() => {
      setReplayIndex(prev => {
        if (prev >= eventStream.length - 1) {
          setIsLivePlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [isLivePlaying, replayIndex, eventStream.length]);

  const value: AppState = {
    currentTicket,
    currentRoute,
    setCurrentRoute,
    generateTicket,
    refreshCurrentTicket,
    bloomFilter: bloomFilterRef.current,
    scanHistory,
    scanTicket,
    eventStream,
    replayIndex,
    setReplayIndex,
    dashboardState,
    isLivePlaying,
    setIsLivePlaying,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
