export const PURPLE_LINE = [
  'Whitefield',
  'Kadugodi',
  'Pattandur Agrahara',
  'Sri Sathya Sai Hospital',
  'Nallurhalli',
  'Kundalahalli',
  'Brookefield',
  'Tin Factory',
  'Indiranagar',
  'Halasuru',
  'Trinity',
  'MG Road',
  'Cubbon Park',
  'Vidhana Soudha',
  'Sir M Visvesvaraya',
  'Majestic',
  'City Railway Station',
  'Magadi Road',
  'Hosahalli',
  'Vijayanagar',
  'Attiguppe',
  'Deepanjali Nagar',
  'Mysuru Road',
] as const;

export const GREEN_LINE = [
  'Nagasandra',
  'Dasarahalli',
  'Jalahalli',
  'Peenya Industry',
  'Peenya',
  'Goraguntepe',
  'Yeshwanthpur',
  'Sandal Soap Factory',
  'Majestic',
  'Chickpete',
  'Krishna Rajendra Market',
  'National College',
  'Lalbagh',
  'South End Circle',
  'Jayanagar',
  'Rashtreeya Vidyalaya Road',
  'Banashankari',
  'Jayaprakash Nagar',
  'Yelachenahalli',
  'Konanakunte Cross',
  'Doddakallasandra',
  'Vajrahalli',
  'Silk Institute',
] as const;

export const INTERCHANGE_STATION = 'Majestic';
export const GREEN_YELLOW_INTERCHANGE = 'Rashtreeya Vidyalaya Road';

export const OPERATING_HOURS = {
  start: '05:00',
  end: '23:00',
} as const;

export const WEEKDAY_FREQUENCY_MIN = {
  min: 5,
  max: 6,
} as const;

export const AVERAGE_INTER_STATION_TIME_MIN = 2.5;
export const INTERCHANGE_PENALTY_MIN = 5;

function indexOfStation(line: readonly string[], station: string): number {
  return line.findIndex(s => s.toLowerCase() === station.trim().toLowerCase());
}

export function resolveLineForStation(station: string): 'Purple' | 'Green' | null {
  const onPurple = indexOfStation(PURPLE_LINE, station) >= 0;
  const onGreen = indexOfStation(GREEN_LINE, station) >= 0;
  if (onPurple && !onGreen) return 'Purple';
  if (onGreen && !onPurple) return 'Green';
  if (onPurple && onGreen) return 'Purple';
  return null;
}

export function computeStationStops(line: readonly string[], from: string, to: string): number {
  const a = indexOfStation(line, from);
  const b = indexOfStation(line, to);
  if (a < 0 || b < 0) return 0;
  return Math.abs(a - b);
}

export function sliceLine(line: readonly string[], from: string, to: string): string[] {
  const a = indexOfStation(line, from);
  const b = indexOfStation(line, to);
  if (a < 0 || b < 0) return [];
  if (a <= b) return line.slice(a, b + 1);
  return [...line.slice(b, a + 1)].reverse();
}

export function estimateFareByStops(stops: number): number {
  if (stops <= 2) return 10;
  if (stops <= 5) return 15;
  if (stops <= 9) return 25;
  if (stops <= 13) return 35;
  if (stops <= 18) return 45;
  return 60;
}

export function estimateMinutes(from: string, to: string, stops: number, includesInterchange: boolean): number {
  const norm = `${from.toLowerCase()}->${to.toLowerCase()}`;
  const reverse = `${to.toLowerCase()}->${from.toLowerCase()}`;

  if (norm === 'whitefield->majestic' || reverse === 'whitefield->majestic') return 42;
  if (norm === 'majestic->silk institute' || reverse === 'majestic->silk institute') return 47;
  if (norm === 'whitefield->silk institute' || reverse === 'whitefield->silk institute') return 90;
  if (norm === 'nagasandra->silk institute' || reverse === 'nagasandra->silk institute') return 57;

  const base = Math.round(stops * AVERAGE_INTER_STATION_TIME_MIN);
  return includesInterchange ? base + INTERCHANGE_PENALTY_MIN : base;
}
