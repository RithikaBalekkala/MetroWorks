'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useTranslation } from '@/lib/i18n-context';
import { useAuth } from '@/lib/auth-context';
import { useWallet } from '@/lib/wallet-context';
import { useBooking } from '@/lib/booking-context';
import { ALL_STATIONS, calculateRoute, type Station, type RouteResult } from '@/lib/metro-network';
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
} from 'lucide-react';

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

  // Sort stations alphabetically
  const sortedStations = useMemo(() => {
    return [...ALL_STATIONS].sort((a: Station, b: Station) => a.name.localeCompare(b.name));
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1 text-[#7B2D8B]" />
                    {t('booking.source')}
                  </label>
                  <div className="relative">
                    <select
                      value={fromStation}
                      onChange={e => setFromStation(e.target.value)}
                      disabled={step === 'confirm'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7B2D8B] focus:border-transparent outline-none appearance-none bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select source station</option>
                      {sortedStations.map((station: Station) => (
                        <option key={station.id} value={station.id} disabled={station.id === toStation}>
                          {station.name} ({station.line === 'purple' ? 'Purple' : 'Green'})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* To Station */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1 text-[#00A550]" />
                    {t('booking.destination')}
                  </label>
                  <div className="relative">
                    <select
                      value={toStation}
                      onChange={e => setToStation(e.target.value)}
                      disabled={step === 'confirm'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00A550] focus:border-transparent outline-none appearance-none bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select destination station</option>
                      {sortedStations.map((station: Station) => (
                        <option key={station.id} value={station.id} disabled={station.id === fromStation}>
                          {station.name} ({station.line === 'purple' ? 'Purple' : 'Green'})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
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
                        <p className="font-semibold">Platform 1/2</p>
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
