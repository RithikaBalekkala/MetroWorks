'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ALL_STATIONS,
  GREEN_LINE,
  PURPLE_LINE,
  lineColorHex,
  type Station,
} from '@/lib/metro-network';
import { type TrainPosition, getNearestTrain } from '@/lib/gtfs-simulator';
import { Navigation, Train, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

type DoorSide = 'LEFT' | 'RIGHT' | 'BOTH';

interface LiveMetroMapProps {
  trains: TrainPosition[];
  fromStationId?: string;
  toStationId?: string;
  onSelectStation?: (stationId: string) => void;
  title?: string;
  compact?: boolean;
  destinationPlatform?: number;
  destinationDoorSide?: DoorSide;
  enableUserLocation?: boolean;
}

interface ProjectedPoint {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default function LiveMetroMap({
  trains,
  fromStationId,
  toStationId,
  onSelectStation,
  title = 'Live Metro Map',
  compact = false,
  destinationPlatform,
  destinationDoorSide,
  enableUserLocation = true,
}: LiveMetroMapProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string>('');
  const [zoom, setZoom] = useState(1.18);
  const [focusedStationId, setFocusedStationId] = useState<string | null>(null);

  const selectedFrom = ALL_STATIONS.find(s => s.id === fromStationId);
  const selectedTo = ALL_STATIONS.find(s => s.id === toStationId);

  const mapBounds = useMemo(() => {
    const lats = ALL_STATIONS.map(s => s.lat);
    const lngs = ALL_STATIONS.map(s => s.lng);
    return {
      minLat: Math.min(...lats) - 0.01,
      maxLat: Math.max(...lats) + 0.01,
      minLng: Math.min(...lngs) - 0.01,
      maxLng: Math.max(...lngs) + 0.01,
    };
  }, []);

  const project = (lat: number, lng: number): ProjectedPoint => {
    const x = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
    const y = 100 - ((lat - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;
    return {
      x: clamp(x, 0, 100),
      y: clamp(y, 0, 100),
    };
  };

  useEffect(() => {
    if (!enableUserLocation || typeof window === 'undefined') return;
    if (!navigator.geolocation) {
      setGeoError('Geolocation unavailable; showing network live view.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      position => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGeoError('');
      },
      () => {
        setGeoError('Location permission denied; using simulator fallback.');
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enableUserLocation]);

  const nearestToDestination = selectedTo ? getNearestTrain(selectedTo.id, trains) : null;

  const projectedStations = useMemo(
    () => ALL_STATIONS.map(station => ({ station, point: project(station.lat, station.lng) })),
    [mapBounds]
  );

  const projectedTrains = useMemo(
    () =>
      trains.map(train => {
        const point = project(train.lat, train.lng);
        const next = train.nextStation ? project(train.nextStation.lat, train.nextStation.lng) : point;
        const angle = Math.atan2(next.y - point.y, next.x - point.x) * (180 / Math.PI);
        return { train, point, angle };
      }),
    [trains, mapBounds]
  );

  const interchangeHubs = useMemo(() => {
    const hubs = new Map<string, { name: string; point: ProjectedPoint }>();
    projectedStations.forEach(({ station, point }) => {
      if (!(station.interchange && station.interchange.length > 1)) return;
      const key = `${station.name}_${Math.round(point.x * 10)}_${Math.round(point.y * 10)}`;
      if (!hubs.has(key)) {
        hubs.set(key, { name: station.name, point });
      }
    });
    return Array.from(hubs.values());
  }, [projectedStations]);

  const focusedStation = focusedStationId
    ? ALL_STATIONS.find(s => s.id === focusedStationId) || null
    : null;
  const focusedPoint = focusedStation ? project(focusedStation.lat, focusedStation.lng) : null;

  const userPoint = userLocation ? project(userLocation.lat, userLocation.lng) : null;
  const cardHeight = compact ? 'h-[320px]' : 'h-[420px]';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-black">{title}</h3>
        <span className="text-[10px] font-mono text-gray-600">{trains.length} trains active</span>
      </div>

      <div className={`relative ${cardHeight} overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-[#edf5ef] via-[#f8fcf9] to-[#e7f3ea]`}>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(17,17,17,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,.12) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        <div className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded-lg border border-gray-200 bg-white/90 p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setZoom(prev => clamp(prev - 0.15, 1, 2.4))}
            className="rounded-md p-1 text-gray-700 hover:bg-gray-100"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-10 text-center text-[10px] font-semibold text-gray-700">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom(prev => clamp(prev + 0.15, 1, 2.4))}
            className="rounded-md p-1 text-gray-700 hover:bg-gray-100"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1.18)}
            className="rounded-md p-1 text-gray-700 hover:bg-gray-100"
            aria-label="Reset zoom"
            title="Reset zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <div
          className="absolute inset-0"
          style={{
            transformOrigin: '50% 50%',
            transform: `scale(${zoom})`,
            transition: 'transform 240ms ease',
          }}
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
          <polyline
            points={PURPLE_LINE.map(s => {
              const p = project(s.lat, s.lng);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="#cda8d6"
            strokeWidth="1.55"
            strokeOpacity="0.45"
          />
          <polyline
            points={GREEN_LINE.map(s => {
              const p = project(s.lat, s.lng);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="#94dfb6"
            strokeWidth="1.55"
            strokeOpacity="0.45"
          />
          <polyline
            points={PURPLE_LINE.map(s => {
              const p = project(s.lat, s.lng);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke={lineColorHex('purple')}
            strokeWidth="0.62"
            strokeOpacity="0.45"
          />
          <polyline
            points={GREEN_LINE.map(s => {
              const p = project(s.lat, s.lng);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke={lineColorHex('green')}
            strokeWidth="0.62"
            strokeOpacity="0.45"
          />

          {interchangeHubs.map(hub => (
            <g key={`hub_${hub.name}`}>
              <circle cx={hub.point.x} cy={hub.point.y} r={2.1} fill="#ffffff" stroke="#111111" strokeWidth={0.15} opacity={0.95} />
              <circle cx={hub.point.x - 0.55} cy={hub.point.y} r={0.75} fill="#7B2D8E" opacity={0.95} />
              <circle cx={hub.point.x + 0.55} cy={hub.point.y} r={0.75} fill="#009A49" opacity={0.95} />
              <circle cx={hub.point.x} cy={hub.point.y} r={2.8} fill="none" stroke="#111111" strokeWidth={0.14} opacity={0.22}>
                <animate attributeName="r" from="2.4" to="3.3" dur="2.1s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.28" to="0.08" dur="2.1s" repeatCount="indefinite" />
              </circle>
            </g>
          ))}

          {projectedStations.map(({ station, point: p }) => {
            const isFrom = station.id === fromStationId;
            const isTo = station.id === toStationId;
            const isInterchange = station.interchange && station.interchange.length > 1;
            const stationColor = station.line === 'purple' ? '#7B2D8E' : '#009A49';

            return (
              <g key={station.id}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isInterchange ? 1.14 : 0.76}
                  fill={isFrom ? '#7B2D8E' : isTo ? '#009A49' : stationColor}
                  stroke={isTo || isFrom ? '#111111' : '#ffffff'}
                  strokeWidth={isTo || isFrom ? 0.22 : 0.1}
                  className="cursor-pointer"
                  onClick={() => {
                    setFocusedStationId(station.id);
                    onSelectStation?.(station.id);
                  }}
                />

              </g>
            );
          })}

          {projectedTrains.map(({ train, point: p, angle }) => {
            const trainColor = train.line === 'purple' ? '#a855f7' : '#22c55e';

            return (
              <g key={train.trainId} transform={`translate(${p.x} ${p.y}) rotate(${angle})`}>
                <rect x={-1.3} y={-0.55} width={2.6} height={1.1} rx={0.35} fill={trainColor} stroke="#111111" strokeWidth={0.12} />
                <polygon points="1.3,0 -0.1,-0.55 -0.1,0.55" fill={trainColor} opacity={0.85} />
                <text x={0} y={-1.1} textAnchor="middle" fontSize="1.35" fill="#111111" style={{ pointerEvents: 'none' }}>
                  {train.trainId}
                </text>
              </g>
            );
          })}

          {userPoint && (
            <g>
              <circle cx={userPoint.x} cy={userPoint.y} r={1.1} fill="#111111" />
              <circle cx={userPoint.x} cy={userPoint.y} r={2.3} fill="none" stroke="#111111" strokeWidth={0.2} opacity={0.45}>
                <animate attributeName="r" from="1.2" to="3.8" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.5" to="0" dur="1.8s" repeatCount="indefinite" />
              </circle>
            </g>
          )}
          </svg>
        </div>

        <div className="absolute left-2 top-2 rounded-lg border border-gray-200 bg-white/90 px-2 py-1 text-[10px] text-gray-700">
          Structured 3D View • Tap station for details
        </div>

        {focusedStation && focusedPoint && (
          <div
            className="absolute z-20 rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-[11px] shadow-sm"
            style={{
              left: `${Math.min(82, Math.max(3, focusedPoint.x + 4))}%`,
              top: `${Math.min(82, Math.max(5, focusedPoint.y - 3))}%`,
            }}
          >
            <p className="font-semibold text-black">{focusedStation.name}</p>
            <p className="text-gray-600">{focusedStation.line === 'purple' ? 'Purple Line' : 'Green Line'}</p>
            {focusedStation.interchange && focusedStation.interchange.length > 1 && (
              <p className="text-[#7B2D8B]">Interchange Hub</p>
            )}
          </div>
        )}

        <div className="absolute bottom-2 left-2 rounded-lg border border-gray-200 bg-white/90 px-3 py-2 text-[10px] text-black">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#7B2D8E]" />
            Source
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#009A49]" />
            Destination
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Navigation className="h-3 w-3" />
            My live location
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-black">
          <p className="text-xs uppercase tracking-wide text-gray-500">Selected Route</p>
          <p className="mt-1 font-semibold">{selectedFrom?.name || 'Select source'} → {selectedTo?.name || 'Select destination'}</p>
          {geoError && <p className="mt-2 text-xs text-amber-600">{geoError}</p>}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-black">
          <p className="text-xs uppercase tracking-wide text-gray-500">Destination Boarding Info</p>
          <p className="mt-1 font-semibold">Platform {destinationPlatform ?? '-'} • Door {destinationDoorSide ?? '-'}</p>
          {nearestToDestination && (
            <p className="mt-1 text-xs text-gray-600">
              Next train {nearestToDestination.train.trainId} arrives in ~{nearestToDestination.etaMins} min
            </p>
          )}
        </div>
      </div>

      {!compact && (
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-gray-600">Live Trains</h4>
          {trains.slice(0, 6).map(train => (
            <div key={train.trainId} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${train.line === 'purple' ? 'bg-purple-100' : 'bg-green-100'}`}>
                <Train className={`h-4 w-4 ${train.line === 'purple' ? 'text-purple-600' : 'text-green-600'}`} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-black">{train.trainId}</p>
                <p className="text-[11px] text-gray-600">{train.currentStation.name} → {train.nextStation?.name || 'Terminal'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-black">{Math.round(train.speed)} km/h</p>
                <p className="text-[11px] text-gray-600">{train.occupancy}% occupancy</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
