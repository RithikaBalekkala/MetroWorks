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
  const { currentTicket, currentRoute, setCurrentRoute, generateTicket, refreshCurrentTicket } = useAppState();
  const router = useRouter();
  const [inlineMessage, setInlineMessage] = useState('');
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');
  const [tab, setTab] = useState<'planner' | 'ticket' | 'live'>('planner');
  const [ticketRefreshCount, setTicketRefreshCount] = useState(0);

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
        {tab === 'planner' && (
          <RoutePlannerTab
            fromStation={fromStation}
            toStation={toStation}
            setFromStation={setFromStation}
            setToStation={setToStation}
            onPlan={handlePlanRoute}
            route={currentRoute}
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
          <LiveMapTab trains={trains} fromStation={fromStation} />
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
}: {
  fromStation: string;
  toStation: string;
  setFromStation: (v: string) => void;
  setToStation: (v: string) => void;
  onPlan: () => void;
  route: import('@/lib/metro-network').RouteResult | null;
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Live GTFS Train Tracking Map
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function LiveMapTab({ trains, fromStation }: { trains: TrainPosition[]; fromStation: string }) {
  const selectedStation = ALL_STATIONS.find(s => s.id === fromStation);

  // Map boundaries for Bengaluru metro network
  const mapBounds = {
    minLat: 12.84, maxLat: 13.10,
    minLng: 77.50, maxLng: 77.76,
  };

  const project = (lat: number, lng: number) => ({
    x: ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100,
    y: 100 - ((lat - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) * 100,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          GTFS Real-Time Tracking
        </h3>
        <span className="text-[10px] font-mono text-black/40">
          {trains.length} trains active
        </span>
      </div>

      {/* Map Container */}
      <div className="relative bg-[#f2f7f3]/60 border border-gray-200 rounded-2xl overflow-hidden" style={{ height: 400 }}>
        {/* Grid background */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* SVG Map Layer */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {/* Purple Line Track */}
          <polyline
            points={PURPLE_LINE.map(s => {
              const p = project(s.lat, s.lng);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="#7B2D8E"
            strokeWidth="0.5"
            strokeOpacity="0.5"
          />
          {/* Green Line Track */}
          <polyline
            points={GREEN_LINE.map(s => {
              const p = project(s.lat, s.lng);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="#009A49"
            strokeWidth="0.5"
            strokeOpacity="0.5"
          />

          {/* Station Dots */}
          {ALL_STATIONS.map(s => {
            const p = project(s.lat, s.lng);
            const isSelected = s.id === fromStation;
            const isInterchange = s.interchange && s.interchange.length > 1;
            return (
              <g key={s.id}>
                <circle
                  cx={p.x} cy={p.y}
                  r={isInterchange ? 1.2 : 0.6}
                  fill={isSelected ? '#facc15' : isInterchange ? '#ffffff' : s.line === 'purple' ? '#7B2D8E' : '#009A49'}
                  stroke={isSelected ? '#facc15' : 'none'}
                  strokeWidth={isSelected ? 0.4 : 0}
                  opacity={isSelected ? 1 : 0.7}
                />
                {isSelected && (
                  <circle cx={p.x} cy={p.y} r={2.5} fill="none" stroke="#facc15" strokeWidth="0.3" opacity="0.5">
                    <animate attributeName="r" from="1.5" to="3.5" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Train Markers */}
          {trains.map(t => {
            const p = project(t.lat, t.lng);
            const color = t.line === 'purple' ? '#a855f7' : '#22c55e';
            return (
              <g key={t.trainId}>
                <rect
                  x={p.x - 1}
                  y={p.y - 0.5}
                  width={2}
                  height={1}
                  rx={0.3}
                  fill={color}
                  stroke="white"
                  strokeWidth="0.15"
                />
                {/* Pulse ring */}
                <circle cx={p.x} cy={p.y} r={1.5} fill="none" stroke={color} strokeWidth="0.2" opacity="0.3">
                  <animate attributeName="r" from="1" to="2.5" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur rounded-lg px-3 py-2 space-y-1">
          <div className="flex items-center gap-2 text-[9px] text-black/60">
            <div className="w-3 h-1.5 rounded-sm bg-purple-500" /> Purple Line
          </div>
          <div className="flex items-center gap-2 text-[9px] text-black/60">
            <div className="w-3 h-1.5 rounded-sm bg-green-500" /> Green Line
          </div>
          <div className="flex items-center gap-2 text-[9px] text-black/60">
            <div className="w-2 h-2 rounded-full bg-yellow-400" /> Selected
          </div>
        </div>

        {/* Selected station tooltip */}
        {selectedStation && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur rounded-lg px-3 py-2">
            <p className="text-[10px] text-black/50">Your Station</p>
            <p className="text-xs font-bold text-yellow-400">{selectedStation.name}</p>
          </div>
        )}
      </div>

      {/* Train List */}
      <div className="space-y-2">
        <h4 className="text-xs font-mono text-black/40 uppercase tracking-wider">Nearby Trains</h4>
        {trains.slice(0, 5).map(t => (
          <div key={t.trainId} className="flex items-center gap-3 bg-[#f2f7f3]/40 rounded-xl p-3 border border-gray-100">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.line === 'purple' ? 'bg-purple-500/20' : 'bg-green-500/20'}`}>
              <Train className={`w-4 h-4 ${t.line === 'purple' ? 'text-purple-400' : 'text-green-400'}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium">{t.trainId}</p>
              <p className="text-[10px] text-black/40">{t.currentStation.name} → {t.nextStation?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-green-400">{Math.round(t.speed)} km/h</p>
              <p className="text-[10px] text-black/40">{t.occupancy}% full</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
