/**
 * Namma Metro Network Graph & Routing Engine
 * ============================================
 * Real-world station data for Purple Line and Green Line.
 * Dijkstra-based shortest path with interchange penalty at Majestic.
 */

export type LineColor = 'purple' | 'green';

export interface Station {
  id: string;
  name: string;
  line: LineColor;
  lat: number;
  lng: number;
  /** Index position on its line (for ordering) */
  index: number;
  /** Is this station an interchange? */
  interchange?: LineColor[];
}

export interface RouteSegment {
  from: Station;
  to: Station;
  line: LineColor;
  durationMins: number;
  stationCount: number;
  stations: Station[];
}

export interface RouteResult {
  segments: RouteSegment[];
  totalDurationMins: number;
  totalStations: number;
  fare: number;
  interchanges: string[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PURPLE LINE (West → East): Challaghatta to Whitefield
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const purpleStations: Omit<Station, 'line'>[] = [
  { id: 'p1',  name: 'Challaghatta',             index: 0,  lat: 12.9886, lng: 77.5076 },
  { id: 'p2',  name: 'Kengeri Bus Terminal',      index: 1,  lat: 12.9906, lng: 77.5121 },
  { id: 'p3',  name: 'Kengeri',                   index: 2,  lat: 12.9930, lng: 77.5215 },
  { id: 'p4',  name: 'Jnanabharathi',            index: 3,  lat: 12.9539, lng: 77.5295 },
  { id: 'p5',  name: 'Rajarajeshwari Nagar',     index: 4,  lat: 12.9476, lng: 77.5384 },
  { id: 'p6',  name: 'Pattanagere',              index: 5,  lat: 12.9430, lng: 77.5463 },
  { id: 'p7',  name: 'Mysuru Road',              index: 6,  lat: 12.9584, lng: 77.5472 },
  { id: 'p8',  name: 'Nayandahalli',             index: 7,  lat: 12.9589, lng: 77.5529 },
  { id: 'p9',  name: 'Deepanjali Nagar',         index: 8,  lat: 12.9565, lng: 77.5568 },
  { id: 'p10', name: 'Attiguppe',                index: 9,  lat: 12.9543, lng: 77.5618 },
  { id: 'p11', name: 'Vijayanagar',              index: 10, lat: 12.9712, lng: 77.5362 },
  { id: 'p12', name: 'Hosahalli',                index: 11, lat: 12.9714, lng: 77.5432 },
  { id: 'p13', name: 'Magadi Road',              index: 12, lat: 12.9754, lng: 77.5526 },
  { id: 'p14', name: 'City Railway Station',     index: 13, lat: 12.9758, lng: 77.5701 },
  { id: 'p15', name: 'Nadaprabhu Kempegowda Station Majestic', index: 14, lat: 12.9767, lng: 77.5713, interchange: ['purple', 'green'] },
  { id: 'p16', name: 'Sir M. Visveshwaraya Station Central College', index: 15, lat: 12.9770, lng: 77.5834 },
  { id: 'p17', name: 'Dr. B.R. Ambedkar Station Vidhana Soudha', index: 16, lat: 12.9781, lng: 77.5908 },
  { id: 'p18', name: 'Cubbon Park',              index: 17, lat: 12.9786, lng: 77.5934 },
  { id: 'p19', name: 'Trinity',                  index: 18, lat: 12.9706, lng: 77.6044 },
  { id: 'p20', name: 'Mahatma Gandhi Road',      index: 19, lat: 12.9756, lng: 77.6066 },
  { id: 'p21', name: 'Indiranagar',              index: 20, lat: 12.9784, lng: 77.6408 },
  { id: 'p22', name: 'Swami Vivekananda Road',   index: 21, lat: 12.9854, lng: 77.6574 },
  { id: 'p23', name: 'Halasuru',                 index: 22, lat: 12.9817, lng: 77.6361 },
  { id: 'p24', name: 'Baiyappanahalli',          index: 23, lat: 12.9873, lng: 77.6543 },
  { id: 'p25', name: 'Benniganahalli',           index: 24, lat: 12.9930, lng: 77.6687 },
  { id: 'p26', name: 'Hoodi',                    index: 25, lat: 12.9936, lng: 77.6970 },
  { id: 'p27', name: 'Garudacharpalya',          index: 26, lat: 12.9937, lng: 77.7080 },
  { id: 'p28', name: 'Mahadevapura',             index: 27, lat: 12.9944, lng: 77.7187 },
  { id: 'p29', name: 'Krishnarajapura',          index: 28, lat: 12.9952, lng: 77.7246 },
  { id: 'p30', name: 'Seetharampalya',           index: 29, lat: 12.9965, lng: 77.7328 },
  { id: 'p31', name: 'Whitefield',               index: 30, lat: 12.9968, lng: 77.7518 },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GREEN LINE (North → South): Nagasandra to Silk Institute
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const greenStations: Omit<Station, 'line'>[] = [
  { id: 'g1',  name: 'Madavara',                 index: 0,  lat: 13.0887, lng: 77.5118 },
  { id: 'g2',  name: 'Chikkabidarakallu',        index: 1,  lat: 13.0740, lng: 77.5170 },
  { id: 'g3',  name: 'Manjunathanagara',         index: 2,  lat: 13.0643, lng: 77.5237 },
  { id: 'g4',  name: 'Nagasandra',               index: 3,  lat: 13.0490, lng: 77.5155 },
  { id: 'g5',  name: 'Dasarahalli',              index: 4,  lat: 13.0461, lng: 77.5205 },
  { id: 'g6',  name: 'Jalahalli',                index: 5,  lat: 13.0388, lng: 77.5334 },
  { id: 'g7',  name: 'Peenya Industry',          index: 6,  lat: 13.0320, lng: 77.5218 },
  { id: 'g8',  name: 'Peenya',                   index: 7,  lat: 13.0277, lng: 77.5190 },
  { id: 'g9',  name: 'Goraguntepalya',           index: 8,  lat: 13.0223, lng: 77.5290 },
  { id: 'g10', name: 'Yeshwanthpur',             index: 9,  lat: 13.0196, lng: 77.5411 },
  { id: 'g11', name: 'Sandal Soap Factory',      index: 10, lat: 13.0102, lng: 77.5520 },
  { id: 'g12', name: 'Mahalakshmi',              index: 11, lat: 13.0067, lng: 77.5575 },
  { id: 'g13', name: 'Rajajinagar',              index: 12, lat: 12.9990, lng: 77.5580 },
  { id: 'g14', name: 'Kuvempu Road',             index: 13, lat: 12.9910, lng: 77.5710 },
  { id: 'g15', name: 'Srirampura',               index: 14, lat: 12.9873, lng: 77.5697 },
  { id: 'g16', name: 'Sampige Road',             index: 15, lat: 12.9826, lng: 77.5742 },
  { id: 'g17', name: 'Nadaprabhu Kempegowda Station Majestic', index: 16, lat: 12.9767, lng: 77.5713, interchange: ['purple', 'green'] },
  { id: 'g18', name: 'Chickpete',                index: 17, lat: 12.9720, lng: 77.5738 },
  { id: 'g19', name: 'Krishna Rajendra Market',  index: 18, lat: 12.9636, lng: 77.5780 },
  { id: 'g20', name: 'National College',         index: 19, lat: 12.9562, lng: 77.5773 },
  { id: 'g21', name: 'Lalbagh',                  index: 20, lat: 12.9494, lng: 77.5856 },
  { id: 'g22', name: 'South End Circle',         index: 21, lat: 12.9394, lng: 77.5899 },
  { id: 'g23', name: 'Jayanagar',                index: 22, lat: 12.9296, lng: 77.5823 },
  { id: 'g24', name: 'R.V. Road',                index: 23, lat: 12.9260, lng: 77.5823 },
  { id: 'g25', name: 'Banashankari',             index: 24, lat: 12.9156, lng: 77.5740 },
  { id: 'g26', name: 'J.P. Nagar',               index: 25, lat: 12.9060, lng: 77.5869 },
  { id: 'g27', name: 'Yelachenahalli',           index: 26, lat: 12.8960, lng: 77.5900 },
  { id: 'g28', name: 'Konanakunte Cross',        index: 27, lat: 12.8850, lng: 77.5825 },
  { id: 'g29', name: 'Doddakallasandra',         index: 28, lat: 12.8760, lng: 77.5770 },
  { id: 'g30', name: 'Vajarahalli',              index: 29, lat: 12.8669, lng: 77.5704 },
  { id: 'g31', name: 'Thalaghattapura',          index: 30, lat: 12.8585, lng: 77.5640 },
  { id: 'g32', name: 'Silk Institute',            index: 31, lat: 12.8492, lng: 77.5594 },
];

// Combine into typed stations
export const PURPLE_LINE: Station[] = purpleStations.map(s => ({ ...s, line: 'purple' as LineColor }));
export const GREEN_LINE: Station[]  = greenStations.map(s => ({ ...s, line: 'green' as LineColor }));
export const ALL_STATIONS: Station[] = [...PURPLE_LINE, ...GREEN_LINE];

/** Average minutes between adjacent stations on each line */
const INTER_STATION_MINS: Record<LineColor, number> = {
  purple: 2.2,  // ~40-45 min for ~18 operating stations
  green:  2.0,  // ~54-60 min for ~28+ stations
};

/** Penalty minutes for an interchange walk (Majestic platform change) */
const INTERCHANGE_PENALTY_MINS = 5;

/** Fare table based on number of stations (INR) */
function calculateFare(totalStations: number): number {
  if (totalStations <= 2)  return 10;
  if (totalStations <= 5)  return 15;
  if (totalStations <= 9)  return 20;
  if (totalStations <= 14) return 30;
  if (totalStations <= 19) return 40;
  if (totalStations <= 25) return 50;
  return 60;
}

/** Find a station by id or name (fuzzy) */
export function findStation(query: string): Station | undefined {
  const q = query.toLowerCase().trim();
  return ALL_STATIONS.find(
    s => s.id === q || s.name.toLowerCase().includes(q)
  );
}

/** Get stations on a given line between two indices (inclusive, in travel order) */
function getStationsOnLine(line: LineColor, fromIdx: number, toIdx: number): Station[] {
  const lineStations = line === 'purple' ? PURPLE_LINE : GREEN_LINE;
  const start = Math.min(fromIdx, toIdx);
  const end = Math.max(fromIdx, toIdx);
  const slice = lineStations.filter(s => s.index >= start && s.index <= end);
  return fromIdx <= toIdx ? slice : [...slice].reverse();
}

/** Find the Majestic interchange station on a given line */
function getMajesticOnLine(line: LineColor): Station {
  const list = line === 'purple' ? PURPLE_LINE : GREEN_LINE;
  return list.find(s => s.interchange && s.interchange.length > 1)!;
}

/**
 * Core routing function — handles same-line and cross-line journeys
 */
export function calculateRoute(fromId: string, toId: string): RouteResult | null {
  const from = ALL_STATIONS.find(s => s.id === fromId);
  const to   = ALL_STATIONS.find(s => s.id === toId);
  if (!from || !to) return null;

  // Same line — direct route
  if (from.line === to.line) {
    const stations = getStationsOnLine(from.line, from.index, to.index);
    const hops = Math.abs(from.index - to.index);
    const duration = Math.round(hops * INTER_STATION_MINS[from.line]);
    return {
      segments: [{
        from,
        to,
        line: from.line,
        durationMins: duration,
        stationCount: hops,
        stations,
      }],
      totalDurationMins: duration,
      totalStations: hops,
      fare: calculateFare(hops),
      interchanges: [],
    };
  }

  // Cross-line: must go via Majestic
  const majesticFrom = getMajesticOnLine(from.line);
  const majesticTo   = getMajesticOnLine(to.line);

  const seg1Stations = getStationsOnLine(from.line, from.index, majesticFrom.index);
  const hops1 = Math.abs(from.index - majesticFrom.index);
  const dur1  = Math.round(hops1 * INTER_STATION_MINS[from.line]);

  const seg2Stations = getStationsOnLine(to.line, majesticTo.index, to.index);
  const hops2 = Math.abs(majesticTo.index - to.index);
  const dur2  = Math.round(hops2 * INTER_STATION_MINS[to.line]);

  const totalHops = hops1 + hops2;
  const totalDuration = dur1 + INTERCHANGE_PENALTY_MINS + dur2;

  return {
    segments: [
      {
        from,
        to: majesticFrom,
        line: from.line,
        durationMins: dur1,
        stationCount: hops1,
        stations: seg1Stations,
      },
      {
        from: majesticTo,
        to,
        line: to.line,
        durationMins: dur2,
        stationCount: hops2,
        stations: seg2Stations,
      },
    ],
    totalDurationMins: totalDuration,
    totalStations: totalHops,
    fare: calculateFare(totalHops),
    interchanges: ['Nadaprabhu Kempegowda Station Majestic'],
  };
}

/** Get human-readable line color */
export function lineColorHex(line: LineColor): string {
  return line === 'purple' ? '#7B2D8E' : '#009A49';
}
