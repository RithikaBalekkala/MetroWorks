'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import LiveMetroMap from '@/components/LiveMetroMap';
import { useTranslation } from '@/lib/i18n-context';
import { useAuth } from '@/lib/auth-context';
import { useWallet } from '@/lib/wallet-context';
import { useBooking } from '@/lib/booking-context';
import { getSimulatedTrains } from '@/lib/gtfs-simulator';
import {
  ALL_STATIONS,
  calculateRoute,
  getStationAmenities,
  type AmenityCategory,
  type Station,
  type RouteResult,
} from '@/lib/metro-network';
import type { RushStatusStore, StationRushStatus } from '@/lib/rush-types';
import { getAmenityConfig } from '@/lib/amenity-config';
import { AmenityBadgeGroup } from '@/components/AmenityBadge';
import {
  Train,
  MapPin,
  Calendar,
  Clock,
  Users,
  ArrowRight,
  Wallet,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  LocateFixed,
} from 'lucide-react';

type DoorSide = 'LEFT' | 'RIGHT' | 'BOTH';

function getBoardingPreview(stationId: string): { platform: 1 | 2; doorSide: DoorSide } {
  const hash = stationId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const platform = hash % 2 === 0 ? 1 : 2;
  const sideIndex = hash % 3;
  const doorSide: DoorSide = sideIndex === 0 ? 'LEFT' : sideIndex === 1 ? 'RIGHT' : 'BOTH';
  return { platform, doorSide };
}

function BookingStationSelector({
  label,
  value,
  disabled,
  onChange,
  icon,
  stations,
  accent,
  excludeStationId,
  placeholder,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (stationId: string) => void;
  icon: React.ReactNode;
  stations: Station[];
  accent: string;
  excludeStationId?: string;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<AmenityCategory[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const AMENITY_FILTERS: AmenityCategory[] = [
    'HOSPITALS',
    'EDUCATION',
    'HOTELS',
    'MALLS',
    'TOURISM',
    'TECH_PARKS',
    'RAILWAY',
    'BUS_TERMINAL',
    'GOVERNMENT',
    'BIKE_PARKING',
    'CAR_PARKING',
  ];

  const selectedStation = stations.find(station => station.id === value) ?? null;
  const filteredStations = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return stations.filter(station => {
      if (station.id === excludeStationId) return false;

      const matchSearch = !normalized || station.name.toLowerCase().includes(normalized);
      if (!matchSearch) return false;

      if (activeFilters.length === 0) return true;

      const categories = getStationAmenities(station.name);
      return categories.some(category => activeFilters.includes(category));
    });
  }, [activeFilters, excludeStationId, query, stations]);

  useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isOpen]);

  return (
    <div ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {icon}
        {label}
      </label>

      <div className={`relative border border-gray-300 rounded-xl bg-white ${disabled ? 'opacity-70' : ''}`}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(prev => !prev)}
          className={`w-full px-4 py-3 text-left flex items-center justify-between rounded-xl ${accent} disabled:cursor-not-allowed`}
        >
          <span className={`text-sm ${selectedStation ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            {selectedStation ? selectedStation.name : placeholder}
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && !disabled && (
          <div className="absolute left-0 right-0 mt-1 z-40 bg-white border border-gray-200 rounded-xl shadow-xl p-3">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search station"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#7B2D8B]"
            />

            <div className="mt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Filter by amenity:</p>
                {activeFilters.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilters([])}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {AMENITY_FILTERS.map(category => {
                  const config = getAmenityConfig(category);
                  const active = activeFilters.includes(category);

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveFilters(prev => (
                        prev.includes(category)
                          ? prev.filter(item => item !== category)
                          : [...prev, category]
                      ))}
                      className={`text-xs border rounded-full px-2 py-0.5 ${
                        active
                          ? `${config.bgColor} ${config.textColor} ${config.borderColor}`
                          : 'bg-white text-gray-600 border-gray-300'
                      }`}
                    >
                      {config.emoji} {config.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-2 max-h-64 overflow-y-auto space-y-1">
              {filteredStations.length === 0 ? (
                <p className="text-xs text-gray-500 px-2 py-2">No stations match search/filter.</p>
              ) : (
                filteredStations.map(station => (
                  <button
                    key={station.id}
                    type="button"
                    onClick={() => {
                      onChange(station.id);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-lg text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate">{station.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        station.line === 'purple'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {station.line === 'purple' ? '● Purple' : '● Green'}
                      </span>
                    </div>
                    <AmenityBadgeGroup
                      categories={getStationAmenities(station.name)}
                      size="xs"
                      maxVisible={3}
                    />
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function toRushStationId(stationName: string): string | null {
  const normalized = stationName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[()]/g, '');

  const aliasMap: Record<string, string> = {
    'mahatma_gandhi_road': 'mg_road',
    'nadaprabhu_kempegowda_station_majestic': 'majestic',
    'dr._b.r._ambedkar_station_vidhana_soudha': 'vidhana_soudha',
    'krishnarajapura': 'kr_puram',
    'sampige_road': 'malleshwaram',
  };

  return aliasMap[normalized] ?? normalized;
}

function StationRushIndicator({ stationName }: { stationName: string }) {
  const [status, setStatus] = useState<{ rushPercent: number; crowdLevel: string } | null>(null);

  useEffect(() => {
    if (!stationName) {
      setStatus(null);
      return;
    }

    const stationId = toRushStationId(stationName);
    if (!stationId) {
      setStatus(null);
      return;
    }

    fetch(`/api/rush-status?stationId=${encodeURIComponent(stationId)}`)
      .then(r => r.json())
      .then((data: { success?: boolean; data?: RushStatusStore }) => {
        if (!data.success || !data.data) {
          setStatus(null);
          return;
        }

        const stationValues = Object.values(data.data.stations) as StationRushStatus[];
        const station = stationValues[0];

        if (!station) {
          setStatus(null);
          return;
        }

        setStatus({
          rushPercent: station.rushPercent,
          crowdLevel: station.crowdLevel,
        });
      })
      .catch(() => setStatus(null));
  }, [stationName]);

  if (!status || !stationName) return null;

  const colors: Record<string, string> = {
    LIGHT: 'text-green-600 bg-green-50 border-green-200',
    MODERATE: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    HEAVY: 'text-orange-600 bg-orange-50 border-orange-200',
    CRITICAL: 'text-red-600 bg-red-50 border-red-200',
  };

  const labels: Record<string, string> = {
    LIGHT: '🟢 Light Crowd',
    MODERATE: '🟡 Moderate Rush',
    HEAVY: '🟠 Heavy Rush',
    CRITICAL: '🔴 Critical - Delays',
  };

  const colorClass = colors[status.crowdLevel] ?? colors.MODERATE;
  const label = labels[status.crowdLevel] ?? labels.MODERATE;

  return (
    <div className={`mt-1 text-xs px-2 py-1 rounded-lg border inline-flex items-center gap-1 ${colorClass}`}>
      {label}
      {' · '}
      {Math.round(status.rushPercent)}% capacity
    </div>
  );
}

export default function BookingPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const { balance, debit, canAfford } = useWallet();
  const { createTicket } = useBooking();

  const [sessionChecked, setSessionChecked] = useState(false);

  // LocalStorage session check to avoid flash — redirect guests to auth and resume after login
  useEffect(() => {
    const u = localStorage.getItem('bmrcl_user');
    if (!u) {
      router.replace('/auth?redirect=/booking');
      return;
    }
    setSessionChecked(true);
  }, [router]);

  // Form state
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [passengers, setPassengers] = useState(1);

  // UI state
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [liveMapExpanded, setLiveMapExpanded] = useState(false);
  const [stationSelectionMode, setStationSelectionMode] = useState<'from' | 'to'>('from');

  const [tickMs, setTickMs] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTickMs(Date.now()), 1500);
    return () => clearInterval(timer);
  }, []);
  const trains = useMemo(() => getSimulatedTrains(tickMs), [tickMs]);

  // Sort stations alphabetically
  const sortedStations = useMemo(() => {
    return [...ALL_STATIONS].sort((a: Station, b: Station) => a.name.localeCompare(b.name));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const toParam = params.get('to');
    if (!toParam) return;

    const normalized = toParam.trim().toLowerCase();
    const matched = ALL_STATIONS.find(station => station.name.trim().toLowerCase() === normalized);
    if (matched) {
      setToStation(matched.id);
    }
  }, []);

  // Set default date/time
  useEffect(() => {
    const now = new Date();
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().slice(0, 5));
  }, []);

  // Keep existing auth-context redirect as a fallback
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth?redirect=/booking');
    }
  }, [user, authLoading, router]);

  const handleFindRoute = () => {
    setError('');
    
    if (!fromStation || !toStation) {
      setError('Please select both source and destination stations');
      return;
    }
    
    if (fromStation === toStation) {
      setError('Source and destination cannot be the same');
      return;
    }

    const result = calculateRoute(fromStation, toStation);
    
    if (!result) {
      setError('Unable to find route between selected stations');
      return;
    }

    setRouteResult(result);
    setStep('confirm');
  };

  const totalFare = routeResult ? routeResult.fare * passengers : 0;
  const canPay = canAfford(totalFare);
  const boardingPreview = toStation ? getBoardingPreview(toStation) : null;

  const handleConfirmBooking = async () => {
    if (!routeResult || !canPay) return;

    setProcessing(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Debit wallet
    const success = debit(totalFare, `Ticket: ${getStationName(fromStation)} → ${getStationName(toStation)}`);
    
    if (!success) {
      setError('Payment failed. Please try again.');
      setProcessing(false);
      return;
    }

    // Create ticket
    createTicket({
      fromStation: getStationName(fromStation),
      toStation: getStationName(toStation),
      platform: boardingPreview?.platform,
      doorSide: boardingPreview?.doorSide,
      date,
      time,
      passengers,
      farePerPerson: routeResult.fare,
      totalFare,
      route: routeResult.segments.flatMap(seg => seg.stations.map(s => s.name)),
      duration: routeResult.totalDurationMins,
    });

    setStep('success');
    setProcessing(false);
  };

  const getStationName = (id: string): string => {
    const station = ALL_STATIONS.find((s: Station) => s.id === id);
    return station?.name || id;
  };

  const handleViewTickets = () => {
    router.push('/tickets');
  };

  const handleBookAnother = () => {
    setFromStation('');
    setToStation('');
    setPassengers(1);
    setRouteResult(null);
    setStep('select');
    setError('');
  };

  if (authLoading || !user) {
    return (
      <AppShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#7B2D8B] border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  if (!sessionChecked) {
    return (
      <AppShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#7B2D8B] border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Train className="w-8 h-8 text-[#7B2D8B]" />
            {t('booking.title')}
          </h1>
          <p className="text-gray-500 mt-2">Plan your journey and book tickets</p>
        </div>

        {/* Wallet Balance Info */}
        <div className="mb-6 flex items-center justify-between p-4 bg-gradient-to-r from-[#7B2D8B] to-purple-700 rounded-xl text-white">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5" />
            <span>{t('dashboard.walletBalance')}</span>
          </div>
          <span className="text-xl font-bold">₹{balance.toFixed(2)}</span>
        </div>

        {/* Expandable Live Map */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <button
            onClick={() => setLiveMapExpanded(prev => !prev)}
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left"
          >
            <div>
              <p className="text-sm font-semibold text-black">Live Map Assisted Booking</p>
              <p className="text-xs text-gray-600">
                Select stations from live map, view train movement, platform arrival, and door-side info
              </p>
            </div>
            {liveMapExpanded ? (
              <ChevronUp className="h-5 w-5 text-[#7B2D8B]" />
            ) : (
              <ChevronDown className="h-5 w-5 text-[#7B2D8B]" />
            )}
          </button>

          {liveMapExpanded && (
            <div className="border-t border-gray-100 px-4 pb-4 pt-3">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setStationSelectionMode('from')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    stationSelectionMode === 'from'
                      ? 'bg-[#7B2D8B] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Select Source on Map
                </button>
                <button
                  onClick={() => setStationSelectionMode('to')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    stationSelectionMode === 'to'
                      ? 'bg-[#00A550] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Select Destination on Map
                </button>
                <div className="ml-auto flex items-center gap-2 rounded-lg bg-[#f2f7f3] px-3 py-1.5 text-xs text-gray-700">
                  <LocateFixed className="h-3.5 w-3.5 text-[#00A550]" />
                  GPS + Simulator Fallback
                </div>
              </div>

              <LiveMetroMap
                trains={trains}
                fromStationId={fromStation}
                toStationId={toStation}
                compact
                destinationPlatform={boardingPreview?.platform}
                destinationDoorSide={boardingPreview?.doorSide}
                onSelectStation={(stationId) => {
                  setError('');
                  if (stationSelectionMode === 'from') {
                    if (stationId === toStation) {
                      setError('Source and destination cannot be the same');
                      return;
                    }
                    setFromStation(stationId);
                    return;
                  }

                  if (stationId === fromStation) {
                    setError('Source and destination cannot be the same');
                    return;
                  }
                  setToStation(stationId);
                }}
                title="Live Metro Network"
              />

              <div className="mt-3 rounded-xl border border-[#d7e4d8] bg-[#f7fbf8] p-3 text-sm text-black">
                <p className="font-semibold">Wallet-Linked Payment</p>
                <p className="mt-1 text-xs text-gray-700">
                  After selecting source and destination, proceed with route confirmation and pay directly from your E-Wallet.
                </p>
                <p className="mt-1 text-xs text-gray-700">
                  Current wallet balance: <span className="font-semibold text-[#7B2D8B]">₹{balance.toFixed(2)}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'success' ? (
          // Success State
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-500 mb-6">
              Your ticket has been booked successfully. You can view and manage it from My Tickets.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleViewTickets}
                className="px-6 py-3 bg-[#7B2D8B] text-white font-semibold rounded-xl hover:bg-[#6a2679] transition"
              >
                View Tickets
              </button>
              <button
                onClick={handleBookAnother}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
              >
                Book Another
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Form */}
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg p-6">
              <div className="space-y-5">
                {/* From Station */}
                <div>
                  <BookingStationSelector
                    label={t('booking.source')}
                    value={fromStation}
                    disabled={step === 'confirm'}
                    onChange={setFromStation}
                    stations={sortedStations}
                    excludeStationId={toStation}
                    accent="focus:ring-2 focus:ring-[#7B2D8B]"
                    icon={<MapPin className="w-4 h-4 inline mr-1 text-[#7B2D8B]" />}
                    placeholder="Select source station"
                  />
                  <StationRushIndicator stationName={fromStation ? getStationName(fromStation) : ''} />
                </div>

                {/* To Station */}
                <div>
                  <BookingStationSelector
                    label={t('booking.destination')}
                    value={toStation}
                    disabled={step === 'confirm'}
                    onChange={setToStation}
                    stations={sortedStations}
                    excludeStationId={fromStation}
                    accent="focus:ring-2 focus:ring-[#00A550]"
                    icon={<MapPin className="w-4 h-4 inline mr-1 text-[#00A550]" />}
                    placeholder="Select destination station"
                  />
                  <StationRushIndicator stationName={toStation ? getStationName(toStation) : ''} />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {t('booking.date')}
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      disabled={step === 'confirm'}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7B2D8B] focus:border-transparent outline-none disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {t('booking.time')}
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      disabled={step === 'confirm'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7B2D8B] focus:border-transparent outline-none disabled:bg-gray-50"
                    />
                  </div>
                </div>

                {/* Passengers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    {t('booking.passengers')}
                  </label>
                  <div className="flex items-center gap-4">
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <button
                        key={num}
                        onClick={() => setPassengers(num)}
                        disabled={step === 'confirm'}
                        className={`w-10 h-10 rounded-lg font-semibold transition disabled:cursor-not-allowed ${
                          passengers === num
                            ? 'bg-[#7B2D8B] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                {step === 'select' ? (
                  <button
                    onClick={handleFindRoute}
                    className="w-full py-4 bg-[#7B2D8B] text-white font-semibold rounded-xl hover:bg-[#6a2679] transition flex items-center justify-center gap-2"
                  >
                    {t('booking.findRoute')}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep('select')}
                      className="flex-1 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleConfirmBooking}
                      disabled={!canPay || processing}
                      className="flex-1 py-4 bg-[#00A550] text-white font-semibold rounded-xl hover:bg-[#008c44] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {t('booking.pay')} ₹{totalFare}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Card */}
            <div className="lg:col-span-2">
              {routeResult ? (
                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                  <h3 className="font-semibold text-gray-900 mb-4">Journey Summary</h3>
                  
                  <div className="space-y-4">
                    {/* Route */}
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-[#7B2D8B] rounded-full" />
                      <span className="font-medium">{getStationName(fromStation)}</span>
                    </div>
                    <div className="ml-1.5 w-0.5 h-8 bg-gray-200" />
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-[#00A550] rounded-full" />
                      <span className="font-medium">{getStationName(toStation)}</span>
                    </div>

                    <hr className="my-4" />

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">{t('booking.duration')}</p>
                        <p className="font-semibold">{routeResult.totalDurationMins} mins</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Stations</p>
                        <p className="font-semibold">{routeResult.totalStations}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('booking.platform')}</p>
                        <p className="font-semibold">Platform {boardingPreview?.platform ?? '1/2'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Door Side</p>
                        <p className="font-semibold">{boardingPreview?.doorSide ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('booking.passengers')}</p>
                        <p className="font-semibold">{passengers}</p>
                      </div>
                    </div>

                    {routeResult.interchanges.length > 0 && (
                      <div className="p-3 bg-yellow-50 rounded-lg text-sm">
                        <p className="font-medium text-yellow-800">Interchange Required</p>
                        <p className="text-yellow-700">Change at {routeResult.interchanges.join(', ')}</p>
                      </div>
                    )}

                    <hr className="my-4" />

                    {/* Fare */}
                    <div className="flex items-center justify-between text-lg">
                      <span className="text-gray-600">{t('booking.totalFare')}</span>
                      <span className="text-2xl font-bold text-[#7B2D8B]">₹{totalFare}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      ₹{routeResult.fare} × {passengers} passenger{passengers > 1 ? 's' : ''}
                    </p>

                    {!canPay && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {t('booking.insufficientBalance')}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-6 text-center">
                  <Train className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select stations to see journey details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
