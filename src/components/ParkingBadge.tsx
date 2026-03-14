import React from 'react';
import {
  getStationParking,
  hasParkingForVehicle,
  type ParkingVehicleType,
} from '@/lib/metro-network';

interface ParkingBadgeProps {
  stationName: string;
  size?: 'xs' | 'sm' | 'md';
}

const sizeStyles: Record<NonNullable<ParkingBadgeProps['size']>, string> = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

function vehicleLabel(vehicle: ParkingVehicleType): string {
  return vehicle === 'BIKE' ? 'Bike' : 'Car';
}

export default function ParkingBadge({ stationName, size = 'sm' }: ParkingBadgeProps) {
  const parking = getStationParking(stationName);

  if (!parking?.available) {
    return null;
  }

  const availableVehicles = (['BIKE', 'CAR'] as ParkingVehicleType[])
    .filter(vehicle => hasParkingForVehicle(stationName, vehicle));

  if (availableVehicles.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1" aria-label={`Parking available at ${stationName}`}>
      {availableVehicles.map(vehicle => (
        <span
          key={vehicle}
          className={`rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 font-medium ${sizeStyles[size]}`}
        >
          P {vehicleLabel(vehicle)}
        </span>
      ))}
    </div>
  );
}
