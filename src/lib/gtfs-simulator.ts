/**
 * GTFS Real-Time Simulator
 * Simulates train positions moving along the metro lines.
 */

import { Station, PURPLE_LINE, GREEN_LINE } from './metro-network';

export interface TrainPosition {
  trainId: string;
  line: 'purple' | 'green';
  currentStation: Station;
  nextStation: Station | null;
  progress: number;       // 0-1 between current and next
  direction: 'forward' | 'backward';
  lat: number;
  lng: number;
  speed: number;          // km/h simulated
  occupancy: number;      // 0-100%
}

/** Interpolate between two stations */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Generate simulated train positions along the network.
 * Trains are placed at intervals along each line.
 */
export function getSimulatedTrains(tickMs: number): TrainPosition[] {
  const trains: TrainPosition[] = [];
  const lines: { line: 'purple' | 'green'; stations: Station[] }[] = [
    { line: 'purple', stations: PURPLE_LINE },
    { line: 'green', stations: GREEN_LINE },
  ];

  for (const { line, stations } of lines) {
    // Place a train every ~5 stations
    const trainCount = Math.floor(stations.length / 5);
    for (let i = 0; i < trainCount; i++) {
      const baseIdx = (i * 5 + Math.floor(tickMs / 3000)) % (stations.length - 1);
      const progress = (tickMs % 3000) / 3000;
      const current = stations[baseIdx];
      const next = stations[Math.min(baseIdx + 1, stations.length - 1)];

      trains.push({
        trainId: `${line.toUpperCase().charAt(0)}L-${String(i + 1).padStart(3, '0')}`,
        line,
        currentStation: current,
        nextStation: next,
        progress,
        direction: 'forward',
        lat: lerp(current.lat, next.lat, progress),
        lng: lerp(current.lng, next.lng, progress),
        speed: 32 + Math.random() * 8,
        occupancy: 30 + Math.floor(Math.random() * 60),
      });
    }
  }

  return trains;
}

/**
 * Get the nearest approaching train to a given station.
 */
export function getNearestTrain(
  stationId: string,
  trains: TrainPosition[]
): { train: TrainPosition; etaMins: number } | null {
  let nearest: TrainPosition | null = null;
  let minDist = Infinity;

  for (const t of trains) {
    if (t.nextStation?.id === stationId || t.currentStation.id === stationId) {
      const dist = t.nextStation?.id === stationId ? (1 - t.progress) : 0;
      if (dist < minDist) {
        minDist = dist;
        nearest = t;
      }
    }
  }

  if (!nearest) {
    // Find closest by station index on same line
    for (const t of trains) {
      const dist = Math.abs(t.currentStation.index - parseInt(stationId.slice(1)));
      if (dist < minDist) {
        minDist = dist;
        nearest = t;
      }
    }
  }

  if (!nearest) return null;
  return {
    train: nearest,
    etaMins: Math.max(1, Math.round(minDist * 2.2)),
  };
}
