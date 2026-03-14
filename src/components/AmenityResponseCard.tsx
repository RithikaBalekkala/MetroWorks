'use client';

import { useRouter } from 'next/navigation';
import type { AmenityCategory } from '@/lib/metro-network';
import { getAmenityConfig } from '@/lib/amenity-config';

interface AmenityResponseCardProps {
  category: AmenityCategory;
  stations: string[];
  primaryRecommendation: string;
  details: string;
  userQuery: string;
}

export default function AmenityResponseCard({
  category,
  stations,
  primaryRecommendation,
  details,
  userQuery,
}: AmenityResponseCardProps) {
  const router = useRouter();
  const config = getAmenityConfig(category);
  const otherStations = stations.filter(st => st !== primaryRecommendation);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-gray-900">
          <span className="mr-1">{config.emoji}</span>
          {config.label}
        </p>
        <span className="text-xs text-gray-400">Namma Metro Guide</span>
      </div>

      <div className={`mt-2 rounded-xl p-3 border ${config.bgColor} ${config.borderColor}`}>
        <p className={`text-sm font-semibold ${config.textColor}`}>
          Best station: {primaryRecommendation}
        </p>
        <p className="mt-1 text-sm text-gray-700">{details}</p>
      </div>

      {otherStations.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-1">Also available at:</p>
          <div className="flex flex-wrap gap-1.5">
            {otherStations.map(station => (
              <span key={station} className="bg-gray-100 rounded-full text-xs px-2 py-0.5 text-gray-700">
                {station}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => router.push(`/booking?to=${encodeURIComponent(primaryRecommendation)}`)}
        className="mt-3 text-sm text-[#7B2D8B] hover:text-[#6a2679] font-medium"
        aria-label={`Book journey to ${primaryRecommendation}`}
      >
        Book journey to {primaryRecommendation} →
      </button>

      <p className="mt-2 text-[11px] text-gray-400">Query: {userQuery}</p>
    </div>
  );
}
