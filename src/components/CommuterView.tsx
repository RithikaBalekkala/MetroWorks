'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppState } from '@/lib/state-provider';
import {
  ALL_STATIONS,
  PURPLE_LINE,
  GREEN_LINE,
  calculateRoute,
  lineColorHex,
  Station,
} from '@/lib/metro-network';
import { serialiseTicket } from '@/lib/crypto-ticket';
import { getSimulatedTrains, TrainPosition } from '@/lib/gtfs-simulator';
import LiveMetroMap from '@/components/LiveMetroMap';
import QRCode from 'react-qr-code';
import {
  MapPin,
  ArrowRight,
  Clock,
  IndianRupee,
  RefreshCw,
  Train,
  Navigation,
  Zap,
  Shield,
  ChevronDown,
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMUTER VIEW — Mobile-First Metro Ticketing Interface
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function CommuterView() {
  const {
    currentTicket,
    currentRoute,
    setCurrentRoute,
    generateTicket,
    refreshCurrentTicket,
    crowdFrequencyBanner,
  } = useAppState();
  const router = useRouter();
  const [inlineMessage, setInlineMessage] = useState('');
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');
  const [tab, setTab] = useState<'planner' | 'ticket' | 'live'>('planner');
  const [ticketRefreshCount, setTicketRefreshCount] = useState(0);
  const [chatSummary, setChatSummary] = useState('');
  const [placesResult, setPlacesResult] = useState<{
    station: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    foodAndCafes: Array<{ name: string; walkingMinutes: number; vibeTag: string }>;
    historicalAndCultural: Array<{ name: string; walkingMinutes: number; vibeTag: string }>;
    shopping: Array<{ name: string; walkingMinutes: number; vibeTag: string }>;
    parks: Array<{ name: string; walkingMinutes: number; vibeTag: string }>;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // ── Auto-refresh QR every 30 seconds ──
  useEffect(() => {
    if (!currentTicket) return;
    const interval = setInterval(() => {
      refreshCurrentTicket();
      setTicketRefreshCount(c => c + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, [currentTicket, refreshCurrentTicket]);

  // ── GTFS Live Tracking State ──
  const [tickMs, setTickMs] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTickMs(Date.now()), 1500);
    return () => clearInterval(timer);
  }, []);
  const trains = useMemo(() => getSimulatedTrains(tickMs), [tickMs]);

  // ── Route Planning ──
  const handlePlanRoute = useCallback(() => {
    if (!fromStation || !toStation) return;

    const user = localStorage.getItem('bmrcl_user');
    if (!user) {
      // show inline message then redirect to auth with redirect param
      setInlineMessage('Please log in to book tickets');
      setTimeout(() => {
        router.push('/auth?redirect=/booking&reason=login_required');
      }, 900);
      return;
    }

    const route = calculateRoute(fromStation, toStation);
    if (route) {
      setCurrentRoute(route);
      const fromName = ALL_STATIONS.find(s => s.id === fromStation)?.name || '';
      const toName = ALL_STATIONS.find(s => s.id === toStation)?.name || '';
      generateTicket(fromName, toName, route.fare);

      setAiLoading(true);
      Promise.all([
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Plan route from ${fromName} to ${toName}`,
            from: fromName,
            to: toName,
          }),
        }),
        fetch('/api/places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            station: toName,
            timeOfDay: 'afternoon',
          }),
        }),
      ])
        .then(async ([chatRes, placesRes]) => {
          const chatJson = await chatRes.json();
          const placesJson = await placesRes.json();

          setChatSummary(
            chatJson?.data?.result?.commuter_message ||
              `Board at ${fromName} and continue toward ${toName}.`
          );

          const placesData = placesJson?.data?.result;
          if (placesData?.station) {
            setPlacesResult({
              station: placesData.station,
              timeOfDay: placesData.timeOfDay ?? 'afternoon',
              foodAndCafes: placesData.foodAndCafes ?? [],
              historicalAndCultural: placesData.historicalAndCultural ?? [],
              shopping: placesData.shopping ?? [],
              parks: placesData.parks ?? [],
            });
          } else {
            setPlacesResult(null);
          }
        })
        .catch(() => {
          setChatSummary('AI assistant is temporarily unavailable. Route card remains accurate.');
          setPlacesResult(null);
        })
        .finally(() => setAiLoading(false));
    }
  }, [fromStation, toStation, setCurrentRoute, generateTicket, router]);

  const qrValue = currentTicket ? serialiseTicket(currentTicket) : '';

  return (
    <div className="mx-auto max-w-[420px] min-h-screen bg-gradient-to-b from-[#f7faf7] via-[#edf5ef] to-[#e6f0e8] text-black relative overflow-hidden">
      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-[#f3e9f7] to-[#e9f7ef] backdrop-blur-md border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-green-500 flex items-center justify-center">
            <Train className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Namma Metro</h1>
            <p className="text-[10px] text-black/60 font-mono tracking-widest uppercase">Autonomous Ticketing v2.0</p>
          </div>
          <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/40">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400 font-mono">LIVE</span>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="relative z-10 flex bg-[#edf5ef]/80 backdrop-blur border-b border-gray-100">
        {[
          { key: 'planner' as const, icon: Navigation, label: 'Route' },
          { key: 'ticket' as const, icon: Shield, label: 'Ticket' },
          { key: 'live' as const, icon: Zap, label: 'Live Map' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 text-[11px] font-medium transition-all ${
              tab === t.key
                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/5'
                : 'text-black/40 hover:text-black/70'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-4">
        {crowdFrequencyBanner && (
          <div className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
            <p className="font-semibold">Service Advisory: {crowdFrequencyBanner.line} Line</p>
            <p>{crowdFrequencyBanner.message}</p>
          </div>
        )}
        {inlineMessage && (
          <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {inlineMessage}
          </div>
        )}
        {tab === 'planner' && (
          <RoutePlannerTab
            fromStation={fromStation}
            toStation={toStation}
            setFromStation={setFromStation}
            setToStation={setToStation}
            onPlan={handlePlanRoute}
            route={currentRoute}
            aiLoading={aiLoading}
            chatSummary={chatSummary}
            placesResult={placesResult}
          />
        )}
        {tab === 'ticket' && (
          <TicketTab
            ticket={currentTicket}
            qrValue={qrValue}
            refreshCount={ticketRefreshCount}
            route={currentRoute}
          />
        )}
        {tab === 'live' && (
          <LiveMetroMap
            trains={trains}
            fromStationId={fromStation}
            toStationId={toStation}
            onSelectStation={(stationId) => {
              if (!fromStation) {
                setFromStation(stationId);
                return;
              }
              if (!toStation && stationId !== fromStation) {
                setToStation(stationId);
                return;
              }
              if (stationId === fromStation) {
                setFromStation('');
              } else if (stationId === toStation) {
                setToStation('');
              }
            }}
            title="GTFS Real-Time Tracking"
          />
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Station Selector Dropdown
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function StationSelector({
  label,
  value,
  onChange,
  icon,
  color,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="relative">
      <label className="text-[10px] font-mono text-black/50 uppercase tracking-wider mb-1 block">{label}</label>
      <div className={`relative flex items-center bg-[#f2f7f3]/80 border rounded-xl px-3 py-2.5 ${color}`}>
        <div className="mr-2 text-black/60">{icon}</div>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="bg-transparent text-black text-sm flex-1 outline-none appearance-none cursor-pointer"
        >
          <option value="" className="bg-[#f2f7f3]">Select Station</option>
          <optgroup label="━━ Purple Line ━━" className="bg-[#f2f7f3]">
            {PURPLE_LINE.map(s => (
              <option key={s.id} value={s.id} className="bg-[#f2f7f3] text-purple-300">
                🟣 {s.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="━━ Green Line ━━" className="bg-[#f2f7f3]">
            {GREEN_LINE.map(s => (
              <option key={s.id} value={s.id} className="bg-[#f2f7f3] text-green-300">
                🟢 {s.name}
              </option>
            ))}
          </optgroup>
        </select>
        <ChevronDown className="w-4 h-4 text-black/40" />
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Route Planner Tab
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function RoutePlannerTab({
  fromStation,
  toStation,
  setFromStation,
  setToStation,
  onPlan,
  route,
  aiLoading,
  chatSummary,
  placesResult,
}: {
  fromStation: string;
  toStation: string;
  setFromStation: (v: string) => void;
  setToStation: (v: string) => void;
  onPlan: () => void;
  route: import('@/lib/metro-network').RouteResult | null;
  aiLoading: boolean;
  chatSummary: string;
  placesResult: {
    station: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    foodAndCafes: Array<{ name: string; walkingMinutes: number; vibeTag: string }>;
    historicalAndCultural: Array<{ name: string; walkingMinutes: number; vibeTag: string }>;
    shopping: Array<{ name: string; walkingMinutes: number; vibeTag: string }>;
    parks: Array<{ name: string; walkingMinutes: number; vibeTag: string }>;
  } | null;
}) {
  return (
    <div className="space-y-4">
      <StationSelector
        label="From"
        value={fromStation}
        onChange={setFromStation}
        icon={<MapPin className="w-4 h-4" />}
        color="border-purple-500/30 focus-within:border-purple-500/70"
      />

      <div className="flex justify-center">
        <div className="w-8 h-8 rounded-full bg-[#f2f7f3] border border-gray-200 flex items-center justify-center">
          <ArrowRight className="w-4 h-4 text-black/60 rotate-90" />
        </div>
      </div>

      <StationSelector
        label="To"
        value={toStation}
        onChange={setToStation}
        icon={<MapPin className="w-4 h-4" />}
        color="border-green-500/30 focus-within:border-green-500/70"
      />

      <button
        onClick={onPlan}
        disabled={!fromStation || !toStation}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-green-600 text-black font-bold text-sm
          hover:from-purple-500 hover:to-green-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed
          shadow-lg shadow-purple-500/20 active:scale-[0.98]"
      >
        Plan Journey & Generate Ticket
      </button>

      {/* Route Result Card */}
      {route && (
        <div className="mt-4 bg-[#f2f7f3]/60 backdrop-blur border border-gray-200 rounded-2xl p-4 space-y-4 animate-in slide-in-from-bottom-4">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-2xl font-bold">{route.totalDurationMins}</span>
              <span className="text-xs text-black/50">min</span>
            </div>
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-green-400" />
              <span className="text-2xl font-bold">{route.fare}</span>
            </div>
            <div className="px-2 py-1 rounded-lg bg-[#dde9df] text-xs text-black/60">
              {route.totalStations} stops
            </div>
          </div>

          {/* Segments */}
          {route.segments.map((seg, i) => (
            <div key={i} className="space-y-2">
              {i > 0 && (
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <RefreshCw className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-medium">
                    Change to {seg.line === 'purple' ? 'Purple' : 'Green'} Line at Majestic
                  </span>
                  <span className="ml-auto text-[10px] text-yellow-400/60">+5 min walk</span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-1">
                  <div
                    className="w-3 h-3 rounded-full border-2"
                    style={{ borderColor: lineColorHex(seg.line), backgroundColor: lineColorHex(seg.line) + '40' }}
                  />
                  <div
                    className="w-0.5 flex-1 min-h-[40px]"
                    style={{ backgroundColor: lineColorHex(seg.line) + '60' }}
                  />
                  <div
                    className="w-3 h-3 rounded-full border-2"
                    style={{ borderColor: lineColorHex(seg.line), backgroundColor: lineColorHex(seg.line) }}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{seg.from.name}</p>
                  <p className="text-[11px] text-black/40">
                    {seg.stationCount} stops · ~{seg.durationMins} min · {seg.line === 'purple' ? 'Purple' : 'Green'} Line
                  </p>
                  <p className="text-sm font-medium">{seg.to.name}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Interchange callout */}
          {route.interchanges.length > 0 && (
            <div className="text-[10px] text-center text-black/40 font-mono">
              INTERCHANGE: {route.interchanges.join(', ')}
            </div>
          )}
        </div>
      )}

      {(aiLoading || chatSummary || placesResult) && (
        <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-black/70">AI Trip Assistant</p>
          {aiLoading && <p className="text-xs text-black/50">Loading route insights and nearby places...</p>}
          {!aiLoading && chatSummary && (
            <p className="text-xs text-black/70">{chatSummary}</p>
          )}
          {!aiLoading && placesResult && (
            <div className="space-y-2">
              <p className="text-[11px] text-black/50">
                Around {placesResult.station} ({placesResult.timeOfDay})
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {[
                  { title: 'Food', list: placesResult.foodAndCafes },
                  { title: 'Culture', list: placesResult.historicalAndCultural },
                  { title: 'Shopping', list: placesResult.shopping },
                  { title: 'Parks', list: placesResult.parks },
                ].map(section => (
                  <div key={section.title} className="rounded-lg bg-[#f6faf7] border border-gray-100 p-2">
                    <p className="font-medium text-black/70 mb-1">{section.title}</p>
                    {section.list.slice(0, 2).map(item => (
                      <p key={item.name} className="text-black/50 truncate">
                        {item.name} ({item.walkingMinutes}m)
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Stateful QR Ticket Tab (refreshes every 30s)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TicketTab({
  ticket,
  qrValue,
  refreshCount,
  route,
}: {
  ticket: import('@/lib/crypto-ticket').SignedTicket | null;
  qrValue: string;
  refreshCount: number;
  route: import('@/lib/metro-network').RouteResult | null;
}) {
  const [countdown, setCountdown] = useState(30);
  const [userLoggedIn, setUserLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    setCountdown(30);
    const timer = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 30)), 1000);
    return () => clearInterval(timer);
  }, [refreshCount]);

  useEffect(() => {
    // check session on mount
    setUserLoggedIn(!!localStorage.getItem('bmrcl_user'));
  }, []);

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-black/30 space-y-3">
        <Shield className="w-12 h-12" />
        <p className="text-sm">Plan a route first to generate your ticket</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ticket Card */}
      <div className="bg-gradient-to-br from-[#f8edf9] to-[#eaf6ee] border border-gray-200 rounded-2xl overflow-hidden">
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-purple-900/60 to-green-900/60 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-black/50 tracking-wider">NAMMA METRO e-TICKET</p>
            <p className="text-xs font-mono text-black/70 mt-0.5">{ticket.payload.ticketId}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400 font-mono">ACTIVE</span>
          </div>
        </div>

        {/* Route Info */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-black/40">FROM</p>
              <p className="text-sm font-medium">{ticket.payload.from}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-black/30" />
            <div className="text-right">
              <p className="text-[10px] text-black/40">TO</p>
              <p className="text-sm font-medium">{ticket.payload.to}</p>
            </div>
          </div>
          {route && (
            <div className="flex items-center gap-4 mt-2 text-[10px] text-black/40">
              <span>{route.totalDurationMins} min</span>
              <span>{route.totalStations} stops</span>
              <span className="text-green-400 font-bold">₹{route.fare}</span>
            </div>
          )}
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center py-5 px-4">
            {userLoggedIn ? (
              <div className="bg-white p-3 rounded-xl shadow-2xl shadow-purple-500/10">
                <QRCode value={qrValue || 'EMPTY'} size={180} level="M" />
              </div>
            ) : (
              <div className="bg-white p-3 rounded-xl shadow-2xl shadow-purple-500/10 filter blur-sm flex items-center justify-center w-[180px] h-[180px]">
                <div className="text-center">
                  <p className="text-sm text-gray-700">🔒 Login to view your QR ticket</p>
                  <Link href="/auth" className="mt-2 inline-block px-3 py-1 bg-[#7B2D8B] text-black rounded-lg text-xs">Login Now</Link>
                </div>
              </div>
            )}
          <div className="mt-3 flex items-center gap-2">
            <RefreshCw className={`w-3 h-3 text-purple-400 ${countdown <= 5 ? 'animate-spin' : ''}`} />
            <span className="text-[11px] text-black/50 font-mono">
              Auto-refresh in <span className={`font-bold ${countdown <= 5 ? 'text-red-400' : 'text-purple-400'}`}>{countdown}s</span>
            </span>
          </div>
          <p className="text-[9px] text-black/30 font-mono mt-1">
            HMAC-SHA256 · Nonce: {ticket.payload.nonce.slice(0, 8)}…
          </p>
        </div>

        {/* Security Footer */}
        <div className="bg-[#edf5ef]/60 px-4 py-2 flex items-center justify-between text-[9px] text-black/30 font-mono">
          <span>Device: {ticket.payload.deviceHash}</span>
          <span>Sig: {ticket.signature.slice(0, 12)}…</span>
        </div>
      </div>

      {/* Anti-Screenshot Warning */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
        <Shield className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[11px] text-red-400 font-medium">Screenshot Protection Active</p>
          <p className="text-[10px] text-black/40">
            This QR regenerates every 30 seconds with a new nonce and HMAC signature.
            Screenshots will fail edge-gate validation.
          </p>
        </div>
      </div>
    </div>
  );
}

