import type {
  CrowdLevel,
  RushStatusStore,
  RushUpdatePayload,
  StationLine,
  StationRushStatus,
  TrendDirection,
} from '@/lib/rush-types';

/*
 * IN-MEMORY STATE STORE
 * Uses module-level variables that persist for the lifetime
 * of the Next.js server process.
 * Resets on every server restart or new deployment.
 * In production, replace this with Redis or a database.
 */

const STATION_CONFIG: Record<string, {
  name: string;
  line: StationLine;
  capacity: number;
  importanceWeight: number;
}> = {
  majestic: {
    name: 'Majestic', line: 'INTERCHANGE',
    capacity: 3000, importanceWeight: 1.0,
  },
  mg_road: {
    name: 'MG Road', line: 'PURPLE',
    capacity: 1800, importanceWeight: 0.9,
  },
  indiranagar: {
    name: 'Indiranagar', line: 'PURPLE',
    capacity: 1200, importanceWeight: 0.8,
  },
  whitefield: {
    name: 'Whitefield', line: 'PURPLE',
    capacity: 2000, importanceWeight: 0.85,
  },
  baiyappanahalli: {
    name: 'Baiyappanahalli', line: 'PURPLE',
    capacity: 1000, importanceWeight: 0.7,
  },
  electronic_city: {
    name: 'Electronic City', line: 'GREEN',
    capacity: 1600, importanceWeight: 0.85,
  },
  silk_institute: {
    name: 'Silk Institute', line: 'GREEN',
    capacity: 1100, importanceWeight: 0.65,
  },
  nagasandra: {
    name: 'Nagasandra', line: 'GREEN',
    capacity: 700, importanceWeight: 0.5,
  },
  yeshwanthpur: {
    name: 'Yeshwanthpur', line: 'GREEN',
    capacity: 1100, importanceWeight: 0.7,
  },
  vidhana_soudha: {
    name: 'Vidhana Soudha', line: 'PURPLE',
    capacity: 900, importanceWeight: 0.7,
  },
  cubbon_park: {
    name: 'Cubbon Park', line: 'PURPLE',
    capacity: 800, importanceWeight: 0.65,
  },
  kr_puram: {
    name: 'KR Puram', line: 'PURPLE',
    capacity: 900, importanceWeight: 0.65,
  },
  rajajinagar: {
    name: 'Rajajinagar', line: 'GREEN',
    capacity: 850, importanceWeight: 0.55,
  },
  malleshwaram: {
    name: 'Malleshwaram', line: 'GREEN',
    capacity: 750, importanceWeight: 0.6,
  },
  peenya: {
    name: 'Peenya', line: 'GREEN',
    capacity: 600, importanceWeight: 0.5,
  },
};

const previousReadings: Map<string, number> = new Map();

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clampPercent(value: number): number {
  return Math.min(Math.max(value, 5), 98);
}

function basePercentFromTime(totalMinutes: number, isWeekend: boolean): number {
  if (totalMinutes >= 330 && totalMinutes <= 479) {
    return randomInRange(25, 40);
  }

  if (totalMinutes >= 480 && totalMinutes <= 630) {
    return isWeekend ? randomInRange(45, 60) : randomInRange(70, 95);
  }

  if (totalMinutes >= 631 && totalMinutes <= 779) {
    return randomInRange(35, 55);
  }

  if (totalMinutes >= 780 && totalMinutes <= 989) {
    if (isWeekend && totalMinutes <= 1080) {
      return randomInRange(65, 80);
    }
    return randomInRange(40, 60);
  }

  if (totalMinutes >= 990 && totalMinutes <= 1200) {
    return isWeekend ? randomInRange(65, 88) : randomInRange(75, 98);
  }

  if (totalMinutes >= 1201 && totalMinutes <= 1350) {
    return randomInRange(30, 50);
  }

  return randomInRange(5, 20);
}

export function getTimeBasedRushPercent(stationId: string, now: Date): number {
  const hour = now.getHours();
  const minute = now.getMinutes();
  const totalMinutes = hour * 60 + minute;
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const weight = STATION_CONFIG[stationId]?.importanceWeight ?? 0.4;

  const basePercent = basePercentFromTime(totalMinutes, isWeekend);
  const weighted = basePercent * (0.5 + weight * 0.5);
  const variance = randomInRange(-8, 8);
  const result = clampPercent(weighted + variance);

  return Math.round(result);
}

export function getCrowdLevel(rushPercent: number): CrowdLevel {
  if (rushPercent < 40) return 'LIGHT';
  if (rushPercent < 65) return 'MODERATE';
  if (rushPercent < 85) return 'HEAVY';
  return 'CRITICAL';
}

export function getTrend(stationId: string, currentPercent: number): TrendDirection {
  const prev = previousReadings.get(stationId);
  if (prev === undefined) return 'STABLE';
  if (currentPercent > prev + 4) return 'RISING';
  if (currentPercent < prev - 4) return 'FALLING';
  return 'STABLE';
}

export function getPredictedEaseTime(rushPercent: number, now: Date): string | undefined {
  if (rushPercent < 65) return undefined;

  const hour = now.getHours();

  if (hour >= 8 && hour <= 10) {
    return 'Crowd expected to ease after 10:30';
  }
  if (hour >= 16 && hour <= 20) {
    return 'Crowd expected to ease after 20:00';
  }
  if (rushPercent >= 85) {
    return 'Heavy crowd - plan for 15-20 min extra time';
  }
  return undefined;
}

export function getPeakHourNote(now: Date): string | undefined {
  const total = now.getHours() * 60 + now.getMinutes();

  if (total >= 480 && total <= 630) {
    return 'Morning Peak - 08:00 to 10:30';
  }
  if (total >= 990 && total <= 1200) {
    return 'Evening Peak - 16:30 to 20:00';
  }
  return undefined;
}

const rushStore: RushStatusStore = {
  stations: {},
  lastGlobalUpdate: new Date().toISOString(),
  totalStationsMonitored: Object.keys(STATION_CONFIG).length,
  criticalCount: 0,
  heavyCount: 0,
  averageSystemLoad: 0,
};

function updateAggregates(): void {
  const stations = Object.values(rushStore.stations);
  if (stations.length === 0) {
    rushStore.criticalCount = 0;
    rushStore.heavyCount = 0;
    rushStore.averageSystemLoad = 0;
    rushStore.lastGlobalUpdate = new Date().toISOString();
    return;
  }

  rushStore.criticalCount = stations.filter(station => station.rushPercent >= 85).length;
  rushStore.heavyCount = stations.filter(station => station.crowdLevel === 'HEAVY').length;
  rushStore.averageSystemLoad = Math.round(
    stations.reduce((acc, station) => acc + station.rushPercent, 0) / stations.length
  );
  rushStore.lastGlobalUpdate = new Date().toISOString();
}

function initializeStore(): void {
  const now = new Date();

  Object.entries(STATION_CONFIG).forEach(([stationId, config]) => {
    const rushPercent = getTimeBasedRushPercent(stationId, now);
    const status: StationRushStatus = {
      stationId,
      stationName: config.name,
      line: config.line,
      rushPercent,
      crowdLevel: getCrowdLevel(rushPercent),
      trend: 'STABLE',
      headcount: Math.round((rushPercent / 100) * config.capacity),
      capacity: config.capacity,
      lastUpdated: now.toISOString(),
      isCriticalAlert: rushPercent >= 85,
      alertMessage: rushPercent >= 85
        ? `URGENT: High crowd density at ${config.name} - ${rushPercent}% capacity. Deploying staff for crowd control.`
        : undefined,
      predictedEaseTime: getPredictedEaseTime(rushPercent, now),
      peakHourNote: getPeakHourNote(now),
    };

    rushStore.stations[stationId] = status;
    previousReadings.set(stationId, rushPercent);
  });

  updateAggregates();
}

export function getRushStore(): RushStatusStore {
  updateAggregates();
  return rushStore;
}

export function updateStationRush(payload: RushUpdatePayload): StationRushStatus {
  const config = STATION_CONFIG[payload.stationId];
  if (!config) {
    throw new Error('Unknown stationId');
  }

  const now = new Date();
  const roundedPercent = Math.round(payload.rushPercent);
  const trend = getTrend(payload.stationId, roundedPercent);
  const crowdLevel = getCrowdLevel(roundedPercent);

  const previous = rushStore.stations[payload.stationId]?.rushPercent;
  if (typeof previous === 'number') {
    previousReadings.set(payload.stationId, previous);
  }

  const updated: StationRushStatus = {
    stationId: payload.stationId,
    stationName: config.name,
    line: config.line,
    rushPercent: roundedPercent,
    crowdLevel,
    trend,
    headcount: payload.headcount ?? Math.round((roundedPercent / 100) * config.capacity),
    capacity: config.capacity,
    lastUpdated: payload.timestamp ?? now.toISOString(),
    isCriticalAlert: roundedPercent >= 85,
    alertMessage: roundedPercent >= 85
      ? `URGENT: High crowd density at ${config.name} - ${roundedPercent}% capacity. Deploying staff for crowd control.`
      : undefined,
    predictedEaseTime: getPredictedEaseTime(roundedPercent, now),
    peakHourNote: getPeakHourNote(now),
  };

  rushStore.stations[payload.stationId] = updated;
  previousReadings.set(payload.stationId, roundedPercent);
  updateAggregates();
  return updated;
}

export function autoRefreshAllStations(): void {
  const now = new Date();

  Object.entries(STATION_CONFIG).forEach(([stationId, config]) => {
    const baseline = getTimeBasedRushPercent(stationId, now);
    const variance = randomInRange(-5, 5);
    const rushPercent = Math.round(clampPercent(baseline + variance));

    const previous = rushStore.stations[stationId]?.rushPercent;
    if (typeof previous === 'number') {
      previousReadings.set(stationId, previous);
    }

    rushStore.stations[stationId] = {
      stationId,
      stationName: config.name,
      line: config.line,
      rushPercent,
      crowdLevel: getCrowdLevel(rushPercent),
      trend: getTrend(stationId, rushPercent),
      headcount: Math.round((rushPercent / 100) * config.capacity),
      capacity: config.capacity,
      lastUpdated: now.toISOString(),
      isCriticalAlert: rushPercent >= 85,
      alertMessage: rushPercent >= 85
        ? `URGENT: High crowd density at ${config.name} - ${rushPercent}% capacity. Deploying staff for crowd control.`
        : undefined,
      predictedEaseTime: getPredictedEaseTime(rushPercent, now),
      peakHourNote: getPeakHourNote(now),
    };

    previousReadings.set(stationId, rushPercent);
  });

  rushStore.lastGlobalUpdate = now.toISOString();
  updateAggregates();
}

export function getStationRush(stationId: string): StationRushStatus | null {
  return rushStore.stations[stationId] ?? null;
}

export function getCriticalStations(): StationRushStatus[] {
  return Object.values(rushStore.stations).filter(station => station.rushPercent >= 85);
}

initializeStore();
