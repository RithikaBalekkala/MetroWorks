'use client';

import React, { useState, useMemo } from 'react';
import { useAppState } from '@/lib/state-provider';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Brain,
  Play,
  Pause,
  Rewind,
  FastForward,
  AlertTriangle,
  Activity,
  Users,
  Cpu,
  Radio,
  Shield,
  Gauge,
  Clock,
  Terminal,
  ChevronRight,
  Zap,
  TrendingUp,
  MonitorDot,
} from 'lucide-react';
import type { SystemEvent } from '@/lib/event-sourcing';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// XAI OPERATOR DASHBOARD — Time-Travel Command Center
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function OperatorDashboard() {
  const {
    eventStream,
    replayIndex,
    setReplayIndex,
    dashboardState,
    isLivePlaying,
    setIsLivePlaying,
  } = useAppState();

  const [selectedAlert, setSelectedAlert] = useState<SystemEvent | null>(null);

  // Current event timestamp display
  const currentTimestamp = eventStream[replayIndex]
    ? new Date(eventStream[replayIndex].timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--:--';

  // Progress percentage
  const progress = eventStream.length > 0 ? ((replayIndex + 1) / eventStream.length) * 100 : 0;

  // XAI events with reasoning
  const xaiEvents = useMemo(
    () => dashboardState.alerts.filter(e => e.xaiReasoning),
    [dashboardState.alerts]
  );

  // Crowd level color
  const crowdColor =
    dashboardState.crowdLevel === 'CRITICAL'
      ? 'text-red-400'
      : dashboardState.crowdLevel === 'HIGH'
      ? 'text-orange-400'
      : dashboardState.crowdLevel === 'MODERATE'
      ? 'text-yellow-400'
      : 'text-green-400';

  const crowdBg =
    dashboardState.crowdLevel === 'CRITICAL'
      ? 'bg-red-500/10 border-red-500/30'
      : dashboardState.crowdLevel === 'HIGH'
      ? 'bg-orange-500/10 border-orange-500/30'
      : dashboardState.crowdLevel === 'MODERATE'
      ? 'bg-yellow-500/10 border-yellow-500/30'
      : 'bg-green-500/10 border-green-500/30';

  return (
    <div className="min-h-screen bg-[#f7faf7] text-black">
      {/* Top Bar */}
      <div className="bg-[#edf5ef] border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">BMRCL Command Center</h1>
            <p className="text-[10px] text-black/30 font-mono">XAI OPERATOR DASHBOARD · EVENT SOURCING REPLAY</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            <MonitorDot className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] text-cyan-400 font-mono">CONTROL ROOM</span>
          </div>
          <div className="text-xs font-mono text-black/40">
            Events: {replayIndex + 1}/{eventStream.length}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* ━━━━━ TIME-TRAVEL REPLAY CONTROL ━━━━━ */}
        <div className="bg-white border border-cyan-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Event Sourcing Time-Travel Replay
            </h2>
            <span className="text-lg font-mono text-black font-bold">{currentTimestamp}</span>
          </div>

          {/* Slider */}
          <div className="relative mb-3">
            <input
              type="range"
              min={0}
              max={eventStream.length - 1}
              value={replayIndex}
              onChange={e => {
                setIsLivePlaying(false);
                setReplayIndex(parseInt(e.target.value));
              }}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[#dde9df]
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-400/30
                [&::-webkit-slider-thumb]:cursor-pointer"
            />
            {/* Progress fill */}
            <div
              className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-cyan-600 to-purple-600 pointer-events-none"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Transport Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => { setIsLivePlaying(false); setReplayIndex(0); }}
              className="p-2 rounded-lg bg-[#f2f7f3] hover:bg-[#dde9df] transition text-black/60 hover:text-black"
              title="Go to start"
            >
              <Rewind className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setIsLivePlaying(false); setReplayIndex(Math.max(0, replayIndex - 10)); }}
              className="p-2 rounded-lg bg-[#f2f7f3] hover:bg-[#dde9df] transition text-black/60 hover:text-black"
              title="Back 10 events"
            >
              <Rewind className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsLivePlaying(!isLivePlaying)}
              className={`p-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                isLivePlaying
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
              }`}
            >
              {isLivePlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isLivePlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => { setIsLivePlaying(false); setReplayIndex(Math.min(eventStream.length - 1, replayIndex + 10)); }}
              className="p-2 rounded-lg bg-[#f2f7f3] hover:bg-[#dde9df] transition text-black/60 hover:text-black"
              title="Forward 10 events"
            >
              <FastForward className="w-3 h-3" />
            </button>
            <button
              onClick={() => { setIsLivePlaying(false); setReplayIndex(eventStream.length - 1); }}
              className="p-2 rounded-lg bg-[#f2f7f3] hover:bg-[#dde9df] transition text-black/60 hover:text-black"
              title="Go to end (live)"
            >
              <FastForward className="w-4 h-4" />
            </button>
          </div>

          {/* Event type markers on timeline */}
          <div className="mt-3 h-6 relative">
            {eventStream.map((evt, i) => {
              if (!evt.xaiReasoning) return null;
              const left = (i / (eventStream.length - 1)) * 100;
              const color =
                evt.type === 'CROWD_SURGE'
                  ? '#ef4444'
                  : evt.type === 'AI_REROUTE'
                  ? '#a855f7'
                  : evt.type === 'ANOMALY_DETECTED'
                  ? '#f59e0b'
                  : evt.type === 'TRAIN_DELAY'
                  ? '#3b82f6'
                  : '#06b6d4';
              return (
                <div
                  key={evt.id}
                  className="absolute top-0 w-1.5 h-5 rounded-full cursor-pointer hover:scale-y-125 transition"
                  style={{ left: `${left}%`, backgroundColor: color }}
                  title={`${evt.type} at ${evt.station}`}
                  onClick={() => { setIsLivePlaying(false); setReplayIndex(i); setSelectedAlert(evt); }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] font-mono text-black/20 mt-1">
            <span>T-30 min</span>
            <span>T-20 min</span>
            <span>T-10 min</span>
            <span>NOW</span>
          </div>
        </div>

        {/* ━━━━━ KPI Cards ━━━━━ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            icon={<Users className="w-4 h-4 text-cyan-400" />}
            label="Tap-Ins"
            value={dashboardState.tapIns.toLocaleString()}
            color="cyan"
          />
          <KPICard
            icon={<TrendingUp className="w-4 h-4 text-purple-400" />}
            label="Tap-Outs"
            value={dashboardState.tapOuts.toLocaleString()}
            color="purple"
          />
          <KPICard
            icon={<Gauge className={`w-4 h-4 ${crowdColor}`} />}
            label="Crowd Level"
            value={dashboardState.crowdLevel}
            color={dashboardState.crowdLevel === 'CRITICAL' ? 'red' : dashboardState.crowdLevel === 'HIGH' ? 'orange' : 'green'}
            customBg={crowdBg}
          />
          <KPICard
            icon={<Radio className="w-4 h-4 text-green-400" />}
            label="Active Gates"
            value={`${dashboardState.activeGates}/${dashboardState.totalGates}`}
            color="green"
          />
        </div>

        {/* ━━━━━ Charts Row ━━━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Telemetry Line Chart */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <h3 className="text-xs font-mono text-black/40 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Real-Time Telemetry (Tap-In / Tap-Out)
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardState.telemetryHistory.slice(-30)}>
                  <defs>
                    <linearGradient id="tapInGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="tapOutGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#475569' }} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="tapIns" stroke="#06b6d4" fill="url(#tapInGrad)" strokeWidth={2} name="Tap-Ins" />
                  <Area type="monotone" dataKey="tapOuts" stroke="#a855f7" fill="url(#tapOutGrad)" strokeWidth={2} name="Tap-Outs" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Crowd Level Bar Chart */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <h3 className="text-xs font-mono text-black/40 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-3 h-3" />
              Crowd Density Index
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardState.telemetryHistory.slice(-20)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#475569' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                  />
                  <Bar dataKey="crowd" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Crowd %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ━━━━━ XAI Alert Feed + Detail Panel ━━━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Alert Feed */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-4">
            <h3 className="text-xs font-mono text-black/40 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Brain className="w-3 h-3" />
              Explainable AI (XAI) Alert Feed
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {xaiEvents.length === 0 ? (
                <p className="text-xs text-black/20 text-center py-8">
                  Drag the timeline slider forward to see AI events appear…
                </p>
              ) : (
                xaiEvents.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={() => setSelectedAlert(evt)}
                    className={`w-full text-left p-3 rounded-xl border transition-all hover:bg-[#f2f7f3]/50 ${
                      selectedAlert?.id === evt.id
                        ? 'bg-[#f2f7f3]/60 border-cyan-500/40'
                        : 'bg-[#edf5ef]/30 border-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <EventIcon type={evt.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${eventTypeBadgeColor(evt.type)}`}>
                            {evt.type}
                          </span>
                          <span className="text-[10px] text-black/30 font-mono">
                            {new Date(evt.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-black/60 mt-1 truncate">{evt.station} · {evt.line} line</p>
                        <p className="text-[11px] text-black/40 mt-0.5 line-clamp-2">{evt.xaiReasoning}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-black/20 shrink-0 mt-1" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* XAI Detail Panel */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <h3 className="text-xs font-mono text-black/40 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Terminal className="w-3 h-3" />
              AI Reasoning Detail
            </h3>
            {selectedAlert ? (
              <div className="space-y-3">
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono ${eventTypeBadgeColor(selectedAlert.type)}`}>
                  <EventIcon type={selectedAlert.type} />
                  {selectedAlert.type}
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-black/30">Station</p>
                    <p className="text-sm font-medium">{selectedAlert.station}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-black/30">Line</p>
                    <p className="text-sm font-medium capitalize">{selectedAlert.line}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-black/30">Timestamp</p>
                    <p className="text-sm font-mono">{new Date(selectedAlert.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-[#edf5ef]/60 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] text-cyan-400 font-mono mb-1">XAI REASONING:</p>
                  <p className="text-xs text-black/70 leading-relaxed">{selectedAlert.xaiReasoning}</p>
                </div>
                <div className="bg-[#edf5ef]/60 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] text-purple-400 font-mono mb-1">EVENT DATA (JSON):</p>
                  <pre className="text-[10px] text-black/50 font-mono overflow-x-auto">
                    {JSON.stringify(selectedAlert.data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-black/20 space-y-2">
                <Brain className="w-8 h-8" />
                <p className="text-xs">Select an alert to view AI reasoning</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Sub-components
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function KPICard({
  icon,
  label,
  value,
  color,
  customBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  customBg?: string;
}) {
  const bg = customBg || `bg-${color}-500/5 border-${color}-500/20`;
  return (
    <div className={`rounded-xl border p-3 ${bg}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-[10px] text-black/40 font-mono uppercase">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function EventIcon({ type }: { type: string }) {
  switch (type) {
    case 'CROWD_SURGE':
      return <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />;
    case 'AI_REROUTE':
      return <Brain className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    case 'ANOMALY_DETECTED':
      return <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case 'GATE_OFFLINE':
      return <Cpu className="w-3.5 h-3.5 text-red-400 shrink-0" />;
    case 'TRAIN_DELAY':
      return <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    case 'CAPACITY_SCALE':
      return <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    case 'BLOOM_FILTER_ALERT':
      return <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    default:
      return <Activity className="w-3.5 h-3.5 text-black/40 shrink-0" />;
  }
}

function eventTypeBadgeColor(type: string): string {
  switch (type) {
    case 'CROWD_SURGE':
      return 'bg-red-500/10 text-red-400';
    case 'AI_REROUTE':
      return 'bg-purple-500/10 text-purple-400';
    case 'ANOMALY_DETECTED':
      return 'bg-amber-500/10 text-amber-400';
    case 'GATE_OFFLINE':
      return 'bg-red-500/10 text-red-400';
    case 'TRAIN_DELAY':
      return 'bg-blue-500/10 text-blue-400';
    case 'CAPACITY_SCALE':
      return 'bg-cyan-500/10 text-cyan-400';
    case 'BLOOM_FILTER_ALERT':
      return 'bg-cyan-500/10 text-cyan-400';
    default:
      return 'bg-slate-500/10 text-black/40';
  }
}
