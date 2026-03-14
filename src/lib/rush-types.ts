export type CrowdLevel = 'LIGHT' | 'MODERATE' | 'HEAVY' | 'CRITICAL';

export type StationLine = 'PURPLE' | 'GREEN' | 'INTERCHANGE';

export type TrendDirection = 'RISING' | 'FALLING' | 'STABLE';

export interface StationRushStatus {
  stationId: string;
  stationName: string;
  line: StationLine;
  rushPercent: number;
  crowdLevel: CrowdLevel;
  trend: TrendDirection;
  headcount: number;
  capacity: number;
  lastUpdated: string;
  isCriticalAlert: boolean;
  alertMessage?: string;
  predictedEaseTime?: string;
  peakHourNote?: string;
}

export interface RushStatusStore {
  stations: Record<string, StationRushStatus>;
  lastGlobalUpdate: string;
  totalStationsMonitored: number;
  criticalCount: number;
  heavyCount: number;
  averageSystemLoad: number;
}

export interface RushUpdatePayload {
  stationId: string;
  stationName?: string;
  rushPercent: number;
  headcount?: number;
  timestamp?: string;
}

export interface RushUpdateResponse {
  success: boolean;
  stationId: string;
  stationName: string;
  crowdLevel: CrowdLevel;
  rushPercent: number;
  alertTriggered: boolean;
  alertMessage?: string;
  timestamp: string;
}

export interface RushGetResponse {
  success: boolean;
  data: RushStatusStore;
  timestamp: string;
}

export interface ManagementRushAlert {
  id: string;
  stationId: string;
  stationName: string;
  rushPercent: number;
  crowdLevel: CrowdLevel;
  message: string;
  suggestedActions: string[];
  triggeredAt: string;
  isRead: boolean;
  severity: 'WARNING' | 'URGENT' | 'EMERGENCY';
}
