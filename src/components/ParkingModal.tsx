'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import {
  getStationParking,
  type ParkingFacility,
  type StationParkingInfo,
} from '@/lib/metro-network';

interface ParkingModalProps {
  isOpen: boolean;
  stationName: string;
  onClose: () => void;
}

function availabilityTone(availableSpots: number, totalSpots: number): string {
  const ratio = totalSpots > 0 ? availableSpots / totalSpots : 0;
  if (ratio > 0.45) return 'text-green-700 bg-green-50 border-green-200';
  if (ratio > 0.2) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

function VehicleCard({ facility }: { facility: ParkingFacility }) {
  const tone = availabilityTone(facility.availableSpots, facility.totalSpots);

  return (
    <div className="rounded-xl border border-gray-200 p-3 bg-white">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-gray-900">{facility.vehicleType === 'BIKE' ? 'Bike Parking' : 'Car Parking'}</p>
        <span className={`text-xs rounded-full border px-2 py-0.5 ${tone}`}>
          {facility.availableSpots}/{facility.totalSpots} available
        </span>
      </div>
      <div className="mt-2 text-sm text-gray-600 space-y-1">
        <p>Hourly: Rs {facility.hourlyRate}</p>
        <p>Full day: Rs {facility.fullDayRate}</p>
        <p>Payment: {facility.paymentModes.join(', ')}</p>
        <p>{facility.covered ? 'Covered bay' : 'Open bay'} • {facility.cctvEnabled ? 'CCTV monitored' : 'No CCTV'}</p>
      </div>
    </div>
  );
}

export default function ParkingModal({ isOpen, stationName, onClose }: ParkingModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);

  const parking: StationParkingInfo | null = useMemo(() => getStationParking(stationName), [stationName]);

  useEffect(() => {
    if (!isOpen) return;

    const container = modalRef.current;
    if (!container) return;

    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    );
    focusable[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Station parking details"
        className="w-full h-full sm:h-auto sm:max-w-xl bg-white sm:rounded-2xl shadow-2xl p-5 sm:p-6 overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Parking at {stationName}</h3>
            <p className="text-sm text-gray-500">Live bay availability and tariff summary</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close parking details"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {!parking ? (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            Parking information is not available for this station yet.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <p className="font-semibold">{parking.facilityName}</p>
              <p className="mt-1">Entry: {parking.entryGate} • {parking.open24x7 ? 'Open 24x7' : 'Operational during station hours'}</p>
              <p className="mt-1 text-xs text-emerald-700">Last updated: {new Date(parking.lastUpdatedIso).toLocaleString()}</p>
            </div>

            {parking.facilities.map(facility => (
              <VehicleCard key={facility.vehicleType} facility={facility} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
