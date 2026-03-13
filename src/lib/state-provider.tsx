'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { SignedTicket, createSignedTicket, refreshTicket, verifyTicketSignature } from '@/lib/crypto-ticket';
import { BloomFilter } from '@/lib/bloom-filter';
import { SystemEvent, DashboardState, generateEventStream, replayToIndex } from '@/lib/event-sourcing';
import { RouteResult } from '@/lib/metro-network';
import {
  buildBookingHmacPayload,
  signBookingPayload,
  computeBookingExpiryTime,
} from '@/lib/booking-context';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ScanResult {
  status: 'VALID' | 'INVALID_SIGNATURE' | 'REPLAY_ATTACK' | 'EXPIRED';
  message: string;
  timestamp: number;
  ticketId?: string;
}

interface LegacyBookingQrPayload {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  passengers: number;
  fare: number;
  hmac: string;
  expires?: string;
  refreshNonce?: string;
}

function parseLegacyBookingQr(raw: unknown): LegacyBookingQrPayload | null {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as Partial<LegacyBookingQrPayload>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.from !== 'string' ||
    typeof candidate.to !== 'string' ||
    typeof candidate.date !== 'string' ||
    typeof candidate.time !== 'string' ||
    typeof candidate.passengers !== 'number' ||
    typeof candidate.fare !== 'number' ||
    typeof candidate.hmac !== 'string'
  ) {
    return null;
  }

  return {
    id: candidate.id,
    from: candidate.from,
    to: candidate.to,
    date: candidate.date,
    time: candidate.time,
    passengers: candidate.passengers,
    fare: candidate.fare,
    hmac: candidate.hmac,
    expires: typeof candidate.expires === 'string' ? candidate.expires : undefined,
    refreshNonce: typeof candidate.refreshNonce === 'string' ? candidate.refreshNonce : undefined,
  };
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

  // ADK Crowd/Frequency (additive)
  crowdFrequencyBanner: {
    line: 'Purple' | 'Green';
    oldFrequencyMin: number;
    newFrequencyMin: number;
    affectedStations: string[];
    effectiveFrom: string;
    estimatedDuration: string;
    message: string;
    operatorNote: string;
  } | null;
  setCrowdFrequencyBanner: (v: {
    line: 'Purple' | 'Green';
    oldFrequencyMin: number;
    newFrequencyMin: number;
    affectedStations: string[];
    effectiveFrom: string;
    estimatedDuration: string;
    message: string;
    operatorNote: string;
  } | null) => void;
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
    // 1) Parse and branch by supported QR format
    let rawParsed: unknown;
    try {
      rawParsed = JSON.parse(qrData);
    } catch {
      const result: ScanResult = {
        status: 'INVALID_SIGNATURE',
        message: 'Malformed ticket data — cannot parse QR payload.',
        timestamp: Date.now(),
      };
      setScanHistory(prev => [result, ...prev]);
      return result;
    }

    const canonical = rawParsed as Partial<SignedTicket>;
    if (canonical?.payload && canonical?.signature) {
      const parsed = canonical as SignedTicket;

      // 2a) Verify canonical HMAC
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

      // 3a) Check expiry
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

      // 4a) Bloom Filter replay check
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

      // 5a) Insert into Bloom Filter and accept
      bloomFilterRef.current.insert(ticketFingerprint);
      const result: ScanResult = {
        status: 'VALID',
        message: `✅ GATE OPEN — Ticket ${parsed.payload.ticketId} validated. Route: ${parsed.payload.from} → ${parsed.payload.to}. Fare: ₹${parsed.payload.fare}.`,
        timestamp: Date.now(),
        ticketId: parsed.payload.ticketId,
      };
      setScanHistory(prev => [result, ...prev]);
      return result;
    }

    const legacy = parseLegacyBookingQr(rawParsed);
    if (!legacy) {
      const result: ScanResult = {
        status: 'INVALID_SIGNATURE',
        message: 'Malformed ticket data — unsupported QR payload shape.',
        timestamp: Date.now(),
      };
      setScanHistory(prev => [result, ...prev]);
      return result;
    }

    // 2b) Verify booking-format HMAC (supports both legacy and refreshed payloads)
    const expires = legacy.expires ?? computeBookingExpiryTime(legacy.date, legacy.time);
    const payload = buildBookingHmacPayload({
      id: legacy.id,
      from: legacy.from,
      to: legacy.to,
      date: legacy.date,
      time: legacy.time,
      passengers: legacy.passengers,
      fare: legacy.fare,
      expires,
      refreshNonce: legacy.refreshNonce,
    });
    const expectedHmac = signBookingPayload(payload);
    if (expectedHmac !== legacy.hmac) {
      const legacyPayloadWithoutNonce = buildBookingHmacPayload({
        id: legacy.id,
        from: legacy.from,
        to: legacy.to,
        date: legacy.date,
        time: legacy.time,
        passengers: legacy.passengers,
        fare: legacy.fare,
        expires,
      });
      const expectedLegacyHmac = signBookingPayload(legacyPayloadWithoutNonce);
      if (expectedLegacyHmac !== legacy.hmac) {
        const result: ScanResult = {
          status: 'INVALID_SIGNATURE',
          message: `HMAC-SHA256 verification FAILED for ticket ${legacy.id}. Possible tampering detected.`,
          timestamp: Date.now(),
          ticketId: legacy.id,
        };
        setScanHistory(prev => [result, ...prev]);
        return result;
      }
    }

    // 3b) Check expiry
    if (Date.now() > new Date(expires).getTime()) {
      const result: ScanResult = {
        status: 'EXPIRED',
        message: `Ticket ${legacy.id} has expired.`,
        timestamp: Date.now(),
        ticketId: legacy.id,
      };
      setScanHistory(prev => [result, ...prev]);
      return result;
    }

    // 4b) Bloom Filter replay check
    const ticketFingerprint = `${legacy.id}:${legacy.refreshNonce ?? legacy.hmac}`;
    if (bloomFilterRef.current.contains(ticketFingerprint)) {
      const result: ScanResult = {
        status: 'REPLAY_ATTACK',
        message: `🚨 REJECTED: Replay Attack Detected! Ticket ${legacy.id} has already been scanned. Bloom Filter match on fingerprint.`,
        timestamp: Date.now(),
        ticketId: legacy.id,
      };
      setScanHistory(prev => [result, ...prev]);
      return result;
    }

    // 5b) Insert into Bloom Filter and accept
    bloomFilterRef.current.insert(ticketFingerprint);
    const result: ScanResult = {
      status: 'VALID',
      message: `✅ GATE OPEN — Ticket ${legacy.id} validated. Route: ${legacy.from} → ${legacy.to}. Fare: ₹${legacy.fare}.`,
      timestamp: Date.now(),
      ticketId: legacy.id,
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
  const [crowdFrequencyBanner, setCrowdFrequencyBanner] = useState<AppState['crowdFrequencyBanner']>(null);

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
    crowdFrequencyBanner,
    setCrowdFrequencyBanner,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
