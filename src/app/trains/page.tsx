'use client';

import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useTranslation } from '@/lib/i18n-context';
import { PURPLE_LINE, GREEN_LINE, type Station } from '@/lib/metro-network';
import { Train, Clock, MapPin, IndianRupee, ChevronDown, ChevronUp } from 'lucide-react';

// Fare slabs based on distance
const FARE_CHART = [
  { minKm: 0, maxKm: 2, fare: 10 },
  { minKm: 2, maxKm: 4, fare: 15 },
  { minKm: 4, maxKm: 6, fare: 20 },
  { minKm: 6, maxKm: 8, fare: 25 },
  { minKm: 8, maxKm: 12, fare: 30 },
  { minKm: 12, maxKm: 16, fare: 35 },
  { minKm: 16, maxKm: 20, fare: 40 },
  { minKm: 20, maxKm: 25, fare: 45 },
  { minKm: 25, maxKm: 30, fare: 50 },
  { minKm: 30, maxKm: 100, fare: 60 },
];

// First and last train timings
const TRAIN_TIMINGS = {
  purple: { first: '05:00', last: '23:00' },
  green: { first: '05:00', last: '23:00' },
};

export default function TrainsPage() {
  const { t } = useTranslation();
  const [expandedLine, setExpandedLine] = useState<'purple' | 'green' | null>('purple');
  const [showFareChart, setShowFareChart] = useState(true);

  const purpleStations = [...PURPLE_LINE].sort((a: Station, b: Station) => a.index - b.index);
  const greenStations = [...GREEN_LINE].sort((a: Station, b: Station) => a.index - b.index);

  const toggleLine = (line: 'purple' | 'green') => {
    setExpandedLine(expandedLine === line ? null : line);
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Train className="w-8 h-8 text-[#7B2D8B]" />
            {t('trains.title')}
          </h1>
          <p className="text-gray-500 mt-2">View all metro lines, stations, and fares</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Station Lists */}
          <div className="lg:col-span-2 space-y-6">
            {/* Purple Line */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <button
                onClick={() => toggleLine('purple')}
                className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-[#7B2D8B] to-purple-700 text-white"
              >
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-white rounded-full" />
                  <div className="text-left">
                    <h2 className="text-xl font-bold">{t('trains.purpleLine')}</h2>
                    <p className="text-white/80 text-sm">
                      {purpleStations[0]?.name} ↔ {purpleStations[purpleStations.length - 1]?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="text-white/80">First Train: {TRAIN_TIMINGS.purple.first}</p>
                    <p className="text-white/80">Last Train: {TRAIN_TIMINGS.purple.last}</p>
                  </div>
                  {expandedLine === 'purple' ? (
                    <ChevronUp className="w-6 h-6" />
                  ) : (
                    <ChevronDown className="w-6 h-6" />
                  )}
                </div>
              </button>
              
              {expandedLine === 'purple' && (
                <div className="p-4 max-h-96 overflow-y-auto">
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-4 top-4 bottom-4 w-1 bg-[#7B2D8B] rounded-full" />
                    
                    {purpleStations.map((station, idx) => (
                      <div key={station.id} className="relative flex items-center gap-4 py-3 pl-10">
                        {/* Station dot */}
                        <div className={`absolute left-2 w-5 h-5 rounded-full border-4 border-white shadow ${
                          station.interchange ? 'bg-gradient-to-r from-[#7B2D8B] to-[#00A550]' : 'bg-[#7B2D8B]'
                        }`} />
                        
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{station.name}</p>
                          {station.interchange && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Interchange with Green Line
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">#{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Green Line */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <button
                onClick={() => toggleLine('green')}
                className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-[#00A550] to-green-600 text-white"
              >
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-white rounded-full" />
                  <div className="text-left">
                    <h2 className="text-xl font-bold">{t('trains.greenLine')}</h2>
                    <p className="text-white/80 text-sm">
                      {greenStations[0]?.name} ↔ {greenStations[greenStations.length - 1]?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="text-white/80">First Train: {TRAIN_TIMINGS.green.first}</p>
                    <p className="text-white/80">Last Train: {TRAIN_TIMINGS.green.last}</p>
                  </div>
                  {expandedLine === 'green' ? (
                    <ChevronUp className="w-6 h-6" />
                  ) : (
                    <ChevronDown className="w-6 h-6" />
                  )}
                </div>
              </button>
              
              {expandedLine === 'green' && (
                <div className="p-4 max-h-96 overflow-y-auto">
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-4 top-4 bottom-4 w-1 bg-[#00A550] rounded-full" />
                    
                    {greenStations.map((station, idx) => (
                      <div key={station.id} className="relative flex items-center gap-4 py-3 pl-10">
                        {/* Station dot */}
                        <div className={`absolute left-2 w-5 h-5 rounded-full border-4 border-white shadow ${
                          station.interchange ? 'bg-gradient-to-r from-[#7B2D8B] to-[#00A550]' : 'bg-[#00A550]'
                        }`} />
                        
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{station.name}</p>
                          {station.interchange && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              Interchange with Purple Line
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">#{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fare Chart */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-24">
              <button
                onClick={() => setShowFareChart(!showFareChart)}
                className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                <div className="flex items-center gap-3">
                  <IndianRupee className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Fare Chart</h2>
                </div>
                {showFareChart ? (
                  <ChevronUp className="w-6 h-6" />
                ) : (
                  <ChevronDown className="w-6 h-6" />
                )}
              </button>
              
              {showFareChart && (
                <div className="p-4">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b">
                        <th className="pb-2">{t('trains.distance')}</th>
                        <th className="pb-2 text-right">{t('trains.fare')}</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {FARE_CHART.map((slab, idx) => (
                        <tr key={idx} className="border-b border-gray-50">
                          <td className="py-3">
                            {slab.minKm} – {slab.maxKm} km
                          </td>
                          <td className="py-3 text-right font-semibold text-[#7B2D8B]">
                            ₹{slab.fare}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Operating Hours</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>05:00 AM – 11:00 PM</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Trains run every 5-10 minutes during peak hours
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
