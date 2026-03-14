import { ALL_STATIONS } from '@/lib/metro-network';

export type LostItemCategory =
  | 'BAG'
  | 'MOBILE'
  | 'WALLET'
  | 'LAPTOP'
  | 'DOCUMENTS'
  | 'JEWELLERY'
  | 'OTHER';

export interface LostFoundDesk {
  stationName: string;
  deskLocation: string;
  contactNumber: string;
  operatingHours: string;
  escalationOffice: string;
}

export interface LostFoundGuidance {
  stationName: string;
  category: LostItemCategory;
  nextSteps: string[];
  etaForCallbackHours: number;
  desk: LostFoundDesk;
  casePrefix: string;
}

const DESK_ALIASES: Record<string, string> = {
  majestic: 'Nadaprabhu Kempegowda Station Majestic',
  kempegowda: 'Nadaprabhu Kempegowda Station Majestic',
  'mg road': 'Mahatma Gandhi Road',
  'rv road': 'R.V. Road',
  'jp nagar': 'J.P. Nagar',
  yelachenahalli: 'Silk Institute',
  'electronic city': 'Silk Institute',
};

const STATION_DESK_OVERRIDES: Record<string, Omit<LostFoundDesk, 'stationName'>> = {
  'Nadaprabhu Kempegowda Station Majestic': {
    deskLocation: 'Concourse Level, Near AFC Gate 3',
    contactNumber: '+91-80-22969300',
    operatingHours: '06:00-23:00',
    escalationOffice: 'BMRCL Central Lost and Found Cell',
  },
  Whitefield: {
    deskLocation: 'Customer Care Counter, Gate B',
    contactNumber: '+91-80-22969431',
    operatingHours: '06:00-22:30',
    escalationOffice: 'Purple Line Operations Office',
  },
  'Silk Institute': {
    deskLocation: 'Station Control Room Lobby, Gate A',
    contactNumber: '+91-80-22969632',
    operatingHours: '06:00-22:30',
    escalationOffice: 'Green Line South Operations Office',
  },
};

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function resolveLostFoundStation(stationName?: string): string {
  if (!stationName) {
    return 'Nadaprabhu Kempegowda Station Majestic';
  }

  const raw = normalize(stationName);
  const aliasResolved = DESK_ALIASES[raw] ?? stationName;

  const exact = ALL_STATIONS.find(st => normalize(st.name) === normalize(aliasResolved));
  if (exact) return exact.name;

  const fuzzy = ALL_STATIONS.find(st => normalize(st.name).includes(raw));
  return fuzzy?.name ?? 'Nadaprabhu Kempegowda Station Majestic';
}

function deskForStation(stationName: string): LostFoundDesk {
  const override = STATION_DESK_OVERRIDES[stationName];
  if (override) {
    return { stationName, ...override };
  }

  return {
    stationName,
    deskLocation: 'Customer Care Counter, Main Concourse',
    contactNumber: '+91-80-22969000',
    operatingHours: '06:00-22:30',
    escalationOffice: 'BMRCL Zone Control Room',
  };
}

export function inferLostItemCategory(text: string): LostItemCategory {
  const msg = normalize(text);

  if (/bag|backpack|luggage/.test(msg)) return 'BAG';
  if (/phone|mobile|iphone|android/.test(msg)) return 'MOBILE';
  if (/wallet|purse|cash|cards/.test(msg)) return 'WALLET';
  if (/laptop|tablet/.test(msg)) return 'LAPTOP';
  if (/id|document|passport|license/.test(msg)) return 'DOCUMENTS';
  if (/jewel|gold|chain|ring/.test(msg)) return 'JEWELLERY';

  return 'OTHER';
}

export function getLostFoundGuidance(input: {
  stationName?: string;
  category?: LostItemCategory;
  contextText?: string;
}): LostFoundGuidance {
  const stationName = resolveLostFoundStation(input.stationName);
  const category = input.category ?? inferLostItemCategory(input.contextText ?? '');
  const desk = deskForStation(stationName);

  const nextSteps = [
    'Report item details at station control room or customer care desk.',
    'Share metro card or ticket ID, travel time window, and coach/platform details.',
    'Collect digital acknowledgement with case number for tracking.',
    'If item is high-value, request immediate CCTV trace registration.',
  ];

  if (category === 'DOCUMENTS' || category === 'JEWELLERY') {
    nextSteps.push('Carry a government ID copy when collecting the recovered item.');
  }

  return {
    stationName,
    category,
    nextSteps,
    etaForCallbackHours: 24,
    desk,
    casePrefix: `BMRCL-LF-${stationName.slice(0, 3).toUpperCase()}`,
  };
}
