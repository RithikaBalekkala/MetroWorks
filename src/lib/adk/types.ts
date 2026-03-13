export type Severity = 'LOW' | 'MED' | 'HIGH' | 'CRIT';

export interface AgentEnvelope<T> {
  agentName: string;
  reasoning: string;
  action: string;
  severity: Severity;
  affectedStations: string[];
  recommendedAction: string;
  result: T;
}

export interface RoutingSegment {
  line: 'Purple' | 'Green';
  from: string;
  to: string;
  stops: number;
  minutes: number;
  platform: number;
}

export interface RoutingToolResult {
  segments: RoutingSegment[];
  interchange: {
    required: boolean;
    station: string;
  };
  totalMinutes: number;
  fare: number;
  instructions: string[];
}

export interface RefundDraftResult {
  caseId: string;
  subject: string;
  body: string;
  refundDays: number;
}

export interface PlaceSuggestion {
  name: string;
  category: string;
  walkingMinutes: number;
  description: string;
  vibeTag: string;
  freeEntry?: boolean;
}

export interface PlacesToolResult {
  station: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  foodAndCafes: PlaceSuggestion[];
  historicalAndCultural: PlaceSuggestion[];
  shopping: PlaceSuggestion[];
  parks: PlaceSuggestion[];
}

export interface CrowdReading {
  station: string;
  tapIns: number;
  tapOuts: number;
  timestamp: string;
  platformOccupancy: number;
  systemLoad: 'NORMAL' | 'ELEVATED' | 'SURGE';
}

export interface CrowdToolResult {
  readings: CrowdReading[];
}

export interface NotifyToolResult {
  notificationId: string;
  sentAt: string;
  channelsNotified: string[];
  line: 'Purple' | 'Green';
  newFrequencyMin: number;
  affectedStations: string[];
  message: string;
  operatorNote: string;
}

export interface FrequencyUpdate {
  line: 'Purple' | 'Green';
  oldFrequencyMin: number;
  newFrequencyMin: number;
  affectedStations: string[];
  effectiveFrom: string;
  estimatedDuration: string;
  message: string;
  operatorNote: string;
}

export interface CrowdAlertResult {
  type: 'SURGE_ALERT';
  severity: Severity;
  station: string;
  currentTapRate: number;
  context: string;
  recommendation: string;
  xaiReasoning: string;
  frequencyUpdate?: FrequencyUpdate;
}
