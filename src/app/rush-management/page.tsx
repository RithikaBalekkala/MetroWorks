'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type {
  CrowdLevel,
  ManagementRushAlert,
  RushStatusStore,
  StationRushStatus,
  TrendDirection,
} from '@/lib/rush-types';
import { getRushAlerts, markRushAlertRead } from '@/lib/notification-service';

const POLL_INTERVAL_MS = 60000;

function formatISTTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
}

function crowdLevelBadge(level: CrowdLevel): string {
  if (level === 'LIGHT') return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  if (level === 'MODERATE') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
  if (level === 'HEAVY') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
  return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
}

function trendLabel(trend: TrendDirection): { icon: string; className: string; label: string } {
  if (trend === 'RISING') return { icon: '↑', className: 'text-red-600 dark:text-red-400', label: 'Rising' };
  if (trend === 'FALLING') return { icon: '↓', className: 'text-green-600 dark:text-green-400', label: 'Falling' };
  return { icon: '→', className: 'text-gray-500 dark:text-gray-400', label: 'Stable' };
}

function levelAccent(level: CrowdLevel): string {
  if (level === 'LIGHT') return 'border-l-4 border-l-green-500';
  if (level === 'MODERATE') return 'border-l-4 border-l-yellow-500';
  if (level === 'HEAVY') return 'border-l-4 border-l-orange-500';
  return 'border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20';
}

function levelTextColor(level: CrowdLevel): string {
  if (level === 'LIGHT') return 'text-green-600 dark:text-green-400';
  if (level === 'MODERATE') return 'text-yellow-600 dark:text-yellow-400';
  if (level === 'HEAVY') return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function lineBadgeClass(line: StationRushStatus['line']): string {
  if (line === 'PURPLE') return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
  if (line === 'GREEN') return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  return 'bg-gradient-to-r from-purple-600 to-green-600 text-white';
}

function severityClass(severity: ManagementRushAlert['severity']): string {
  if (severity === 'EMERGENCY') return 'border-l-red-600';
  if (severity === 'URGENT') return 'border-l-orange-500';
  return 'border-l-yellow-500';
}

export default function RushManagementPage() {
  const [store, setStore] = useState<RushStatusStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [activeFilter, setActiveFilter] = useState<CrowdLevel | 'ALL'>('ALL');
  const [selectedLine, setSelectedLine] = useState<'ALL' | 'PURPLE' | 'GREEN' | 'INTERCHANGE'>('ALL');
  const [selectedStation, setSelectedStation] = useState<StationRushStatus | null>(null);
  const [alerts, setAlerts] = useState<ManagementRushAlert[]>([]);
  const [sortBy, setSortBy] = useState<'rush' | 'name' | 'trend'>('rush');
  const [showAlerts, setShowAlerts] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const loadAlerts = useCallback(() => {
    const rushAlerts = getRushAlerts();
    setAlerts(rushAlerts.slice(0, 10));
  }, []);

  const fetchRushStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/rush-status?autoRefresh=true', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = (await res.json()) as { success?: boolean; data?: RushStatusStore };
      if (json.success && json.data) {
        setStore(json.data);
        setLastRefreshed(new Date());
        setError(null);
      }
    } catch {
      setError('Unable to fetch live data. Retrying...');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRushStatus();
    loadAlerts();

    intervalRef.current = setInterval(() => {
      fetchRushStatus();
      loadAlerts();
      setCountdown(60);
    }, POLL_INTERVAL_MS);

    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 60));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [fetchRushStatus, loadAlerts]);

  const stations = store ? Object.values(store.stations) : [];

  const filteredStations = stations
    .filter(s => activeFilter === 'ALL' || s.crowdLevel === activeFilter)
    .filter(s => selectedLine === 'ALL' || s.line === selectedLine)
    .sort((a, b) => {
      if (sortBy === 'rush') return b.rushPercent - a.rushPercent;
      if (sortBy === 'name') return a.stationName.localeCompare(b.stationName);
      if (sortBy === 'trend') {
        const order: Record<TrendDirection, number> = { RISING: 0, STABLE: 1, FALLING: 2 };
        return order[a.trend] - order[b.trend];
      }
      return 0;
    });

  const criticalStations = stations.filter(station => station.isCriticalAlert);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="mt-3 text-gray-700 dark:text-gray-200">Loading live rush data...</p>
        </div>
      </div>
    );
  }

  if (error && !store) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 p-6 text-center">
          <p className="text-red-600 dark:text-red-400 text-xl">⚠</p>
          <p className="mt-2 text-gray-800 dark:text-gray-100">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchRushStatus();
            }}
            className="mt-4 rounded-xl bg-purple-600 text-white px-4 py-2 hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm px-4 py-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📡 Rush Management</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Live station crowd monitoring - Namma Metro Bangalore</p>
          </div>

          <div className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2 w-full md:w-auto">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <span className={`${loading ? 'animate-spin' : 'animate-pulse'} inline-block`}>
                {loading ? '◌' : '🟢'}
              </span>
              <span>Auto-refreshing every 60 seconds</span>
            </div>
            <div className="mt-2 h-1 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 60) * 100}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{countdown}s until next refresh</div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {lastRefreshed ? `Last updated: ${formatISTTime(lastRefreshed)}` : 'Fetching...'}
            </div>
            <button
              type="button"
              onClick={() => {
                fetchRushStatus();
                loadAlerts();
                setCountdown(60);
              }}
              className="mt-2 text-xs rounded-lg border border-purple-600 text-purple-700 dark:text-purple-300 dark:border-purple-400 px-2 py-1 hover:bg-purple-50 dark:hover:bg-purple-950/30"
            >
              ↻ Refresh Now
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 py-4">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">📊 Average System Load</p>
            <p className={`text-2xl font-bold ${
              (store?.averageSystemLoad ?? 0) > 80 ? 'text-red-600 dark:text-red-400' :
              (store?.averageSystemLoad ?? 0) > 50 ? 'text-orange-600 dark:text-orange-400' :
              'text-green-600 dark:text-green-400'
            }`}>
              {store?.averageSystemLoad ?? 0}%
            </p>
            <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div className="h-full bg-purple-500" style={{ width: `${store?.averageSystemLoad ?? 0}%` }} />
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">🚨 Critical Stations</p>
            <p className={`text-2xl font-bold ${(store?.criticalCount ?? 0) > 0 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-green-600 dark:text-green-400'}`}>
              {store?.criticalCount ?? 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{(store?.criticalCount ?? 0) === 0 ? '✓ All Clear' : 'Immediate attention needed'}</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">⚠️ Heavy Load</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{store?.heavyCount ?? 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">stations</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">📡 Stations Monitored</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{store?.totalStationsMonitored ?? 0}</p>
            <span className="inline-flex items-center text-xs text-green-600 dark:text-green-400">Live</span>
          </div>
        </div>

        {criticalStations.length > 0 && (
          <section className="mx-4 mb-4 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4">
            <h2 className="font-semibold text-red-800 dark:text-red-300">🚨 {criticalStations.length} Station(s) at Critical Capacity</h2>
            <div className="mt-3 space-y-2">
              {criticalStations.map(station => (
                <div key={station.stationId} className="flex flex-wrap items-center gap-2 text-sm text-red-700 dark:text-red-300">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                  <span className="font-bold">{station.stationName}</span>
                  <span className="text-lg font-black">{station.rushPercent}%</span>
                  <span className="truncate">{station.alertMessage}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedStation(station)}
                    className="ml-auto text-xs underline"
                  >
                    View Details →
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="px-4 pb-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Filter by crowd level:</span>
            {(['ALL', 'LIGHT', 'MODERATE', 'HEAVY', 'CRITICAL'] as const).map(level => (
              <button
                key={level}
                type="button"
                onClick={() => setActiveFilter(level)}
                className={`text-xs rounded-full px-3 py-1 border ${
                  activeFilter === level
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                {level === 'ALL' ? 'All' : level === 'LIGHT' ? '🟢 Light' : level === 'MODERATE' ? '🟡 Moderate' : level === 'HEAVY' ? '🟠 Heavy' : '🔴 Critical'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'PURPLE', 'GREEN', 'INTERCHANGE'] as const).map(line => (
                <button
                  key={line}
                  type="button"
                  onClick={() => setSelectedLine(line)}
                  className={`text-xs rounded-full px-3 py-1 border ${
                    selectedLine === line
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {line === 'ALL' ? 'All Lines' : line === 'PURPLE' ? '● Purple Line' : line === 'GREEN' ? '● Green Line' : '⟳ Interchange'}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {(['rush', 'name', 'trend'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSortBy(s)}
                  className={`text-xs rounded-full px-3 py-1 border ${
                    sortBy === s
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {s === 'rush' ? 'Rush %' : s === 'name' ? 'Name A-Z' : 'Trend'}
                </button>
              ))}
            </div>
          </div>
        </section>

        {filteredStations.length === 0 ? (
          <div className="mx-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">No stations match your current filters.</p>
            <button
              type="button"
              onClick={() => {
                setActiveFilter('ALL');
                setSelectedLine('ALL');
              }}
              className="mt-3 rounded-xl bg-purple-600 text-white px-4 py-2 hover:bg-purple-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
            {filteredStations.map(station => {
              const trend = trendLabel(station.trend);
              return (
                <button
                  type="button"
                  key={station.stationId}
                  onClick={() => setSelectedStation(station)}
                  className={`text-left rounded-2xl border p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-md transition-all ${levelAccent(station.crowdLevel)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{station.stationName}</p>
                      <span className={`inline-flex text-xs px-2 py-0.5 rounded-full mt-1 ${lineBadgeClass(station.line)}`}>
                        {station.line === 'PURPLE' ? '● Purple Line' : station.line === 'GREEN' ? '● Green Line' : '⟳ Interchange'}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${crowdLevelBadge(station.crowdLevel)}`}>
                      {station.crowdLevel === 'LIGHT' ? '🟢 Light Crowd' : station.crowdLevel === 'MODERATE' ? '🟡 Moderate Rush' : station.crowdLevel === 'HEAVY' ? '🟠 Heavy Rush' : '🔴 Critical - Delays Expected'}
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className={`text-4xl font-black ${levelTextColor(station.crowdLevel)}`}>{station.rushPercent}%</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">capacity</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{station.headcount} of {station.capacity} passengers</p>
                  </div>

                  <div className="mt-3 relative h-4 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ease-out ${
                        station.rushPercent < 40 ? 'bg-green-500' :
                        station.rushPercent < 65 ? 'bg-yellow-500' :
                        station.rushPercent < 85 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${station.rushPercent}%` }}
                    />
                    <span className="absolute left-[40%] top-0 h-full w-px bg-gray-400/70" />
                    <span className="absolute left-[65%] top-0 h-full w-px bg-amber-500/80" />
                    <span className="absolute left-[85%] top-0 h-full w-px bg-red-500" />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className={trend.className}>{trend.icon} {trend.label}</span>
                    {station.peakHourNote && <span className="text-xs text-amber-600 dark:text-amber-400">⏰ {station.peakHourNote}</span>}
                  </div>

                  {station.predictedEaseTime && (
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">💡 {station.predictedEaseTime}</p>
                  )}

                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">🕐 Updated: {formatISTTime(station.lastUpdated)}</p>
                </button>
              );
            })}
          </section>
        )}

        <section className="mx-4 mt-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            type="button"
            onClick={() => setShowAlerts(prev => !prev)}
            className="w-full px-4 py-3 text-left font-semibold text-gray-900 dark:text-white"
          >
            📋 Recent Management Alerts {showAlerts ? '▲' : '▼'}
          </button>

          {showAlerts && (
            <div className="px-4 pb-4 space-y-3">
              {alerts.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No alerts in the last hour. All stations within normal limits.</p>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className={`border-l-4 ${severityClass(alert.severity)} rounded-xl border border-gray-200 dark:border-gray-800 p-3`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{alert.id} • {formatISTTime(alert.triggeredAt)}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">{alert.severity}</span>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white mt-1">{alert.stationName} • {alert.rushPercent}%</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{alert.message}</p>
                    {!alert.isRead && (
                      <button
                        type="button"
                        onClick={() => {
                          markRushAlertRead(alert.id);
                          loadAlerts();
                        }}
                        className="mt-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </main>

      {selectedStation && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedStation(null)}
        >
          <div
            className="max-w-lg w-full rounded-2xl shadow-2xl p-6 bg-white dark:bg-gray-900 max-h-[85vh] overflow-y-auto"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedStation.stationName}</h2>
                <span className={`inline-flex text-xs px-2 py-0.5 rounded-full mt-1 ${lineBadgeClass(selectedStation.line)}`}>
                  {selectedStation.line}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStation(null)}
                className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex justify-center">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="14" fill="none" className="text-gray-200 dark:text-gray-700" />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="14"
                  fill="none"
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                  strokeDasharray={2 * Math.PI * 80}
                  strokeDashoffset={(2 * Math.PI * 80) * (1 - selectedStation.rushPercent / 100)}
                  className={levelTextColor(selectedStation.crowdLevel)}
                />
                <text x="100" y="98" textAnchor="middle" className="fill-current text-3xl font-bold text-gray-900 dark:text-white">
                  {selectedStation.rushPercent}%
                </text>
                <text x="100" y="120" textAnchor="middle" className="fill-current text-sm text-gray-500 dark:text-gray-400">
                  {selectedStation.crowdLevel}
                </text>
              </svg>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                <p className="text-gray-500 dark:text-gray-400">Headcount</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedStation.headcount}</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                <p className="text-gray-500 dark:text-gray-400">Capacity</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedStation.capacity}</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                <p className="text-gray-500 dark:text-gray-400">Trend</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedStation.trend}</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                <p className="text-gray-500 dark:text-gray-400">Line</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedStation.line}</p>
              </div>
            </div>

            <div className={`mt-4 rounded-xl p-3 ${
              selectedStation.crowdLevel === 'LIGHT' ? 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300' :
              selectedStation.crowdLevel === 'MODERATE' ? 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300' :
              selectedStation.crowdLevel === 'HEAVY' ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300' :
              'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300'
            }`}>
              <p className="font-semibold">{selectedStation.crowdLevel}</p>
              <p className="text-sm mt-1">
                {selectedStation.crowdLevel === 'LIGHT' ? 'Great time to travel! Comfortable journey expected.' :
                selectedStation.crowdLevel === 'MODERATE' ? 'Normal crowds. Travel as planned. Slightly busier.' :
                selectedStation.crowdLevel === 'HEAVY' ? 'Busy station. Expect slight queuing at gates. Consider traveling in 30-45 minutes if flexible.' :
                'Station at near capacity. Significant delays likely. Consider alternate station or delay journey by 1 hour.'}
              </p>
            </div>

            {selectedStation.isCriticalAlert && selectedStation.alertMessage && (
              <div className="mt-4 rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-3">
                <p className="font-semibold text-red-800 dark:text-red-300">{selectedStation.alertMessage}</p>
                <ol className="mt-2 list-decimal pl-5 text-sm text-red-700 dark:text-red-300 space-y-1">
                  <li>Deploy station crowd-control staff immediately.</li>
                  <li>Open all gates and monitor queue spillover.</li>
                  <li>Issue passenger advisory for alternate stations.</li>
                </ol>
              </div>
            )}

            {selectedStation.peakHourNote && (
              <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">⏰ {selectedStation.peakHourNote}</p>
            )}
            {selectedStation.predictedEaseTime && (
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">💡 {selectedStation.predictedEaseTime}</p>
            )}

            <div className="mt-5 flex gap-3">
              <Link
                href={`/booking?to=${encodeURIComponent(selectedStation.stationName)}`}
                className="flex-1 rounded-xl bg-purple-600 text-white text-center py-2 hover:bg-purple-700"
              >
                Book Journey Here
              </Link>
              <button
                type="button"
                onClick={() => setSelectedStation(null)}
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
