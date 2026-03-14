/**
 * Namma Metro Network Graph & Routing Engine
 * ============================================
 * Real-world station data for Purple Line and Green Line.
 * Dijkstra-based shortest path with interchange penalty at Majestic.
 */

export type LineColor = 'purple' | 'green';

export type AmenityCategory =
  | 'HOSPITALS'
  | 'EDUCATION'
  | 'HOTELS'
  | 'MALLS'
  | 'TOURISM'
  | 'TECH_PARKS'
  | 'RAILWAY'
  | 'BUS_TERMINAL'
  | 'AIRPORT_CONNECT'
  | 'GOVERNMENT'
  | 'BIKE_PARKING'
  | 'CAR_PARKING';

export interface AmenityInfo {
  category: AmenityCategory;
  name: string;
  distanceMeters: number;
  walkMinutes: number;
  description: string;
}

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
  amenities?: AmenityCategory[];
  amenityDetails?: AmenityInfo[];
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

interface StationAmenityPayload {
  amenities: AmenityCategory[];
  amenityDetails: AmenityInfo[];
}

export interface ParkingSlot {
  capacity: number;
  available: number;
  pricing: string;
}

export interface StationParking {
  stationName: string;
  hasBikeParking: boolean;
  hasCarParking: boolean;
  bike: ParkingSlot;
  car?: ParkingSlot;
}

const STATION_AMENITY_MAP: Record<string, StationAmenityPayload> = {
  'mahatma gandhi road': {
    amenities: ['HOTELS', 'MALLS', 'TOURISM'],
    amenityDetails: [
      {
        category: 'HOTELS',
        name: 'The Oberoi Bengaluru',
        distanceMeters: 400,
        walkMinutes: 5,
        description: 'Luxury 5-star hotel',
      },
      {
        category: 'MALLS',
        name: 'Brigade Road Shopping',
        distanceMeters: 300,
        walkMinutes: 4,
        description: 'Major shopping street',
      },
      {
        category: 'TOURISM',
        name: 'MG Road Commercial Hub',
        distanceMeters: 100,
        walkMinutes: 2,
        description: 'Central business district',
      },
    ],
  },
  indiranagar: {
    amenities: ['HOSPITALS', 'HOTELS', 'MALLS'],
    amenityDetails: [
      {
        category: 'HOSPITALS',
        name: 'Manipal Hospital',
        distanceMeters: 1200,
        walkMinutes: 15,
        description: 'Multi-specialty hospital',
      },
      {
        category: 'MALLS',
        name: '100 Feet Road Restaurants',
        distanceMeters: 200,
        walkMinutes: 3,
        description: 'Popular dining and shopping zone',
      },
    ],
  },
  'nadaprabhu kempegowda station majestic': {
    amenities: ['BUS_TERMINAL', 'RAILWAY', 'HOTELS', 'GOVERNMENT', 'BIKE_PARKING', 'CAR_PARKING'],
    amenityDetails: [
      {
        category: 'BUS_TERMINAL',
        name: 'KSRTC Majestic Bus Stand',
        distanceMeters: 100,
        walkMinutes: 2,
        description: 'Main intercity bus terminal',
      },
      {
        category: 'RAILWAY',
        name: 'KSR Bengaluru City Railway Station',
        distanceMeters: 500,
        walkMinutes: 7,
        description: 'Main railway station',
      },
      {
        category: 'HOTELS',
        name: 'Hotel Woodlands',
        distanceMeters: 300,
        walkMinutes: 4,
        description: 'Budget and mid-range hotels cluster',
      },
      {
        category: 'BIKE_PARKING',
        name: 'Majestic Two-Wheeler Parking',
        distanceMeters: 50,
        walkMinutes: 1,
        description: 'Capacity 300 bikes. ₹5/hr, ₹30/day. Currently 112 spots available.',
      },
      {
        category: 'CAR_PARKING',
        name: 'Majestic Car Parking',
        distanceMeters: 80,
        walkMinutes: 1,
        description: 'Capacity 80 cars. ₹30/hr, ₹150/day. Often full on weekdays after 9am.',
      },
    ],
  },
  'dr. b.r. ambedkar station vidhana soudha': {
    amenities: ['GOVERNMENT', 'TOURISM'],
    amenityDetails: [
      {
        category: 'GOVERNMENT',
        name: 'Vidhana Soudha',
        distanceMeters: 200,
        walkMinutes: 3,
        description: 'Karnataka State Legislature Building',
      },
      {
        category: 'TOURISM',
        name: 'Cubbon Park',
        distanceMeters: 400,
        walkMinutes: 5,
        description: 'Historic public park, 300 acres',
      },
    ],
  },
  'cubbon park': {
    amenities: ['TOURISM', 'GOVERNMENT', 'HOSPITALS'],
    amenityDetails: [
      {
        category: 'TOURISM',
        name: 'Cubbon Park',
        distanceMeters: 100,
        walkMinutes: 2,
        description: 'Historic public park',
      },
      {
        category: 'HOSPITALS',
        name: 'Bowring Hospital',
        distanceMeters: 800,
        walkMinutes: 10,
        description: 'Government general hospital',
      },
      {
        category: 'GOVERNMENT',
        name: 'High Court of Karnataka',
        distanceMeters: 600,
        walkMinutes: 8,
        description: 'Karnataka High Court',
      },
    ],
  },
  baiyappanahalli: {
    amenities: ['RAILWAY', 'BUS_TERMINAL', 'BIKE_PARKING', 'CAR_PARKING'],
    amenityDetails: [
      {
        category: 'RAILWAY',
        name: 'Baiyappanahalli Railway Station',
        distanceMeters: 300,
        walkMinutes: 4,
        description: 'Suburban railway connectivity',
      },
      {
        category: 'BIKE_PARKING',
        name: 'Baiyappanahalli Bike Parking',
        distanceMeters: 60,
        walkMinutes: 1,
        description: 'Capacity 200 bikes. ₹5/hr, ₹25/day. 89 spots available.',
      },
      {
        category: 'CAR_PARKING',
        name: 'Baiyappanahalli Car Parking',
        distanceMeters: 80,
        walkMinutes: 1,
        description: 'Capacity 60 cars. ₹25/hr, ₹120/day. 14 spots available.',
      },
    ],
  },
  whitefield: {
    amenities: ['TECH_PARKS', 'HOTELS', 'MALLS', 'BIKE_PARKING', 'CAR_PARKING'],
    amenityDetails: [
      {
        category: 'TECH_PARKS',
        name: 'ITPL — International Tech Park',
        distanceMeters: 800,
        walkMinutes: 10,
        description: 'Major IT hub with 70+ companies',
      },
      {
        category: 'MALLS',
        name: 'Forum Shantiniketan Mall',
        distanceMeters: 1000,
        walkMinutes: 13,
        description: 'Large shopping and entertainment mall',
      },
      {
        category: 'HOTELS',
        name: 'Marriott Whitefield',
        distanceMeters: 1200,
        walkMinutes: 15,
        description: '5-star business hotel',
      },
      {
        category: 'BIKE_PARKING',
        name: 'Whitefield Bike Parking',
        distanceMeters: 100,
        walkMinutes: 2,
        description: 'Capacity 400 bikes. ₹5/hr, ₹30/day. Multi-level facility. 187 spots available.',
      },
      {
        category: 'CAR_PARKING',
        name: 'Whitefield Multi-level Car Park',
        distanceMeters: 150,
        walkMinutes: 2,
        description: 'Capacity 150 cars. ₹30/hr, ₹150/day. 62 spots currently available.',
      },
    ],
  },
  'electronic city': {
    amenities: ['TECH_PARKS', 'BIKE_PARKING', 'CAR_PARKING'],
    amenityDetails: [
      {
        category: 'TECH_PARKS',
        name: 'Electronic City Tech Park Cluster',
        distanceMeters: 600,
        walkMinutes: 8,
        description: 'Major tech park zone with large commuter traffic.',
      },
      {
        category: 'BIKE_PARKING',
        name: 'Electronic City Bike Parking',
        distanceMeters: 80,
        walkMinutes: 1,
        description: 'Largest bike parking on Green Line. Capacity 500. ₹5/hr. 234 spots available.',
      },
      {
        category: 'CAR_PARKING',
        name: 'Electronic City Car Parking',
        distanceMeters: 100,
        walkMinutes: 2,
        description: 'Capacity 200 cars. ₹30/hr, ₹150/day. 78 spots available. Tech park commuters.',
      },
    ],
  },
  krishnarajapura: {
    amenities: ['RAILWAY', 'HOSPITALS'],
    amenityDetails: [
      {
        category: 'RAILWAY',
        name: 'KR Puram Railway Station',
        distanceMeters: 400,
        walkMinutes: 5,
        description: 'Suburban railway station',
      },
    ],
  },
  'silk institute': {
    amenities: ['EDUCATION', 'TECH_PARKS', 'BIKE_PARKING', 'CAR_PARKING'],
    amenityDetails: [
      {
        category: 'EDUCATION',
        name: 'Central Silk Board',
        distanceMeters: 200,
        walkMinutes: 3,
        description: 'Government silk research institute',
      },
      {
        category: 'TECH_PARKS',
        name: 'Silk Board IT Corridor',
        distanceMeters: 500,
        walkMinutes: 7,
        description: 'Electronics City tech corridor start',
      },
      {
        category: 'BIKE_PARKING',
        name: 'Silk Institute Bike Parking',
        distanceMeters: 60,
        walkMinutes: 1,
        description: 'Capacity 250 bikes. ₹5/hr. Currently FULL during peak hours.',
      },
      {
        category: 'CAR_PARKING',
        name: 'Silk Institute Car Parking',
        distanceMeters: 80,
        walkMinutes: 1,
        description: 'Capacity 100 cars. ₹30/hr. Currently FULL — arrive before 8am.',
      },
    ],
  },
  nagasandra: {
    amenities: ['MALLS', 'BUS_TERMINAL'],
    amenityDetails: [
      {
        category: 'MALLS',
        name: 'Esteem Mall',
        distanceMeters: 700,
        walkMinutes: 9,
        description: 'Shopping mall',
      },
    ],
  },
  rajajinagar: {
    amenities: ['HOSPITALS', 'EDUCATION', 'MALLS'],
    amenityDetails: [
      {
        category: 'HOSPITALS',
        name: 'Rajajinagar General Hospital',
        distanceMeters: 500,
        walkMinutes: 7,
        description: 'Government district hospital',
      },
      {
        category: 'MALLS',
        name: 'Orion Mall',
        distanceMeters: 1500,
        walkMinutes: 18,
        description: 'Premium mall near Dr Rajkumar Road',
      },
    ],
  },
  'sampige road': {
    amenities: ['EDUCATION', 'HOSPITALS', 'TOURISM'],
    amenityDetails: [
      {
        category: 'EDUCATION',
        name: 'Indian Institute of Science (IISc)',
        distanceMeters: 1800,
        walkMinutes: 22,
        description: 'Premier research university',
      },
      {
        category: 'HOSPITALS',
        name: 'Kidwai Memorial Institute',
        distanceMeters: 1200,
        walkMinutes: 15,
        description: 'Speciality cancer hospital',
      },
      {
        category: 'TOURISM',
        name: 'Malleshwaram Market',
        distanceMeters: 300,
        walkMinutes: 4,
        description: 'Historic neighbourhood and market',
      },
    ],
  },
  yeshwanthpur: {
    amenities: ['RAILWAY', 'MALLS', 'BUS_TERMINAL', 'BIKE_PARKING'],
    amenityDetails: [
      {
        category: 'RAILWAY',
        name: 'Yeshwanthpur Railway Station',
        distanceMeters: 200,
        walkMinutes: 3,
        description: 'Major railway junction',
      },
      {
        category: 'MALLS',
        name: 'Orion Mall',
        distanceMeters: 1000,
        walkMinutes: 13,
        description: 'Large premium mall',
      },
      {
        category: 'BIKE_PARKING',
        name: 'Yeshwanthpur Bike Parking',
        distanceMeters: 70,
        walkMinutes: 1,
        description: 'Bike only. No car parking available. Capacity 180 bikes. 45 spots available.',
      },
    ],
  },
  jayanagar: {
    amenities: ['BIKE_PARKING', 'CAR_PARKING'],
    amenityDetails: [
      {
        category: 'BIKE_PARKING',
        name: 'Jayanagar Bike Parking',
        distanceMeters: 50,
        walkMinutes: 1,
        description: 'Capacity 120 bikes. ₹5/hr, ₹25/day. 23 spots available.',
      },
      {
        category: 'CAR_PARKING',
        name: 'Jayanagar Car Parking',
        distanceMeters: 70,
        walkMinutes: 1,
        description: 'Capacity 40 cars. ₹25/hr, ₹120/day. 5 spots available — limited.',
      },
    ],
  },
  peenya: {
    amenities: ['TECH_PARKS', 'GOVERNMENT'],
    amenityDetails: [
      {
        category: 'TECH_PARKS',
        name: 'Peenya Industrial Area',
        distanceMeters: 400,
        walkMinutes: 5,
        description: "One of Asia's largest industrial estates",
      },
    ],
  },
};

const STATION_NAME_ALIAS: Record<string, string> = {
  'mg road': 'mahatma gandhi road',
  'majestic (kempegowda)': 'nadaprabhu kempegowda station majestic',
  majestic: 'nadaprabhu kempegowda station majestic',
  'kempegowda': 'nadaprabhu kempegowda station majestic',
  'vidhana soudha': 'dr. b.r. ambedkar station vidhana soudha',
  'whitefield (kadugodi)': 'whitefield',
  'kr puram': 'krishnarajapura',
  'silk institute (yelachenahalli)': 'silk institute',
  yelachenahalli: 'silk institute',
  'silk institute (electronic city)': 'silk institute',
  malleshwaram: 'sampige road',
  'electronic city': 'silk institute',
  'peenya industry': 'peenya',
};

const STATION_PARKING_MAP: Record<string, StationParking> = {
  'nadaprabhu kempegowda station majestic': {
    stationName: 'Nadaprabhu Kempegowda Station Majestic',
    hasBikeParking: true,
    hasCarParking: true,
    bike: {
      capacity: 300,
      available: 112,
      pricing: '₹5/hr, ₹30/day',
    },
    car: {
      capacity: 80,
      available: 0,
      pricing: '₹30/hr, ₹150/day',
    },
  },
  whitefield: {
    stationName: 'Whitefield',
    hasBikeParking: true,
    hasCarParking: true,
    bike: {
      capacity: 400,
      available: 187,
      pricing: '₹5/hr, ₹30/day',
    },
    car: {
      capacity: 150,
      available: 62,
      pricing: '₹30/hr, ₹150/day',
    },
  },
  'electronic city': {
    stationName: 'Electronic City',
    hasBikeParking: true,
    hasCarParking: true,
    bike: {
      capacity: 500,
      available: 234,
      pricing: '₹5/hr',
    },
    car: {
      capacity: 200,
      available: 78,
      pricing: '₹30/hr, ₹150/day',
    },
  },
  baiyappanahalli: {
    stationName: 'Baiyappanahalli',
    hasBikeParking: true,
    hasCarParking: true,
    bike: {
      capacity: 200,
      available: 89,
      pricing: '₹5/hr, ₹25/day',
    },
    car: {
      capacity: 60,
      available: 14,
      pricing: '₹25/hr, ₹120/day',
    },
  },
  yeshwanthpur: {
    stationName: 'Yeshwanthpur',
    hasBikeParking: true,
    hasCarParking: false,
    bike: {
      capacity: 180,
      available: 45,
      pricing: '₹5/hr',
    },
  },
  'silk institute': {
    stationName: 'Silk Institute',
    hasBikeParking: true,
    hasCarParking: true,
    bike: {
      capacity: 250,
      available: 0,
      pricing: '₹5/hr',
    },
    car: {
      capacity: 100,
      available: 0,
      pricing: '₹30/hr',
    },
  },
  jayanagar: {
    stationName: 'Jayanagar',
    hasBikeParking: true,
    hasCarParking: true,
    bike: {
      capacity: 120,
      available: 23,
      pricing: '₹5/hr, ₹25/day',
    },
    car: {
      capacity: 40,
      available: 5,
      pricing: '₹25/hr, ₹120/day',
    },
  },
};

function normalizeAmenityStationName(stationName: string): string {
  return stationName.trim().toLowerCase().replace(/\s+/g, ' ');
}

function resolveAmenityStationName(stationName: string): string {
  const normalized = normalizeAmenityStationName(stationName);
  return STATION_NAME_ALIAS[normalized] ?? normalized;
}

function getStationAmenityPayload(stationName: string): StationAmenityPayload | null {
  const normalized = normalizeAmenityStationName(stationName);
  const direct = STATION_AMENITY_MAP[normalized];
  if (direct) return direct;

  const resolved = resolveAmenityStationName(stationName);
  return STATION_AMENITY_MAP[resolved] ?? null;
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
export const PURPLE_LINE: Station[] = purpleStations.map(s => {
  const amenityPayload = getStationAmenityPayload(s.name);
  return {
    ...s,
    line: 'purple' as LineColor,
    ...(amenityPayload ? {
      amenities: amenityPayload.amenities,
      amenityDetails: amenityPayload.amenityDetails,
    } : {}),
  };
});

export const GREEN_LINE: Station[]  = greenStations.map(s => {
  const amenityPayload = getStationAmenityPayload(s.name);
  return {
    ...s,
    line: 'green' as LineColor,
    ...(amenityPayload ? {
      amenities: amenityPayload.amenities,
      amenityDetails: amenityPayload.amenityDetails,
    } : {}),
  };
});
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

import type { ModificationAnalysis, JourneyLine } from '@/types/modification';

function toJourneyLine(line: LineColor): Exclude<JourneyLine, 'INTERCHANGE'> {
  return line === 'purple' ? 'PURPLE' : 'GREEN';
}

function normalizeStationKey(stationName: string): string {
  return stationName.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findStationByName(stationName: string): Station | undefined {
  const normalized = normalizeStationKey(stationName);
  return ALL_STATIONS.find(station => station.name.toLowerCase() === normalized);
}

export function getStationIndex(stationName: string, line: 'PURPLE' | 'GREEN'): number {
  const normalized = normalizeStationKey(stationName);
  const stations = line === 'PURPLE' ? PURPLE_LINE : GREEN_LINE;
  const station = stations.find(st => st.name.toLowerCase() === normalized);
  return station ? station.index : -1;
}

export function getJourneyLine(fromStation: string, toStation: string): JourneyLine {
  const from = findStationByName(fromStation);
  const to = findStationByName(toStation);

  if (!from || !to) {
    return 'INTERCHANGE';
  }

  if (from.line === to.line) {
    return toJourneyLine(from.line);
  }

  return 'INTERCHANGE';
}

export function analyseModification(
  fromStation: string,
  originalDestination: string,
  newDestination: string
): ModificationAnalysis {
  const fromKey = normalizeStationKey(fromStation);
  const originalKey = normalizeStationKey(originalDestination);
  const newDestinationKey = normalizeStationKey(newDestination);

  if (newDestinationKey === fromKey) {
    return {
      modificationType: 'INVALID',
      originalFare: 0,
      newFare: 0,
      fareDifference: 0,
      refundAmount: 0,
      extraCharge: 0,
      originalStops: 0,
      newStops: 0,
      newLine: 'INTERCHANGE',
      errorReason: 'Destination cannot be the same as origin',
    };
  }

  if (newDestinationKey === originalKey) {
    return {
      modificationType: 'INVALID',
      originalFare: 0,
      newFare: 0,
      fareDifference: 0,
      refundAmount: 0,
      extraCharge: 0,
      originalStops: 0,
      newStops: 0,
      newLine: 'INTERCHANGE',
      errorReason: 'This is already your destination',
    };
  }

  const from = findStationByName(fromStation);
  const original = findStationByName(originalDestination);
  const destination = findStationByName(newDestination);

  if (!from || !original || !destination) {
    return {
      modificationType: 'INVALID',
      originalFare: 0,
      newFare: 0,
      fareDifference: 0,
      refundAmount: 0,
      extraCharge: 0,
      originalStops: 0,
      newStops: 0,
      newLine: 'INTERCHANGE',
      errorReason: 'No valid route found to selected station',
    };
  }

  const originalRoute = calculateRoute(from.id, original.id);
  const newRoute = calculateRoute(from.id, destination.id);

  if (!originalRoute || !newRoute) {
    return {
      modificationType: 'INVALID',
      originalFare: originalRoute?.fare ?? 0,
      newFare: newRoute?.fare ?? 0,
      fareDifference: 0,
      refundAmount: 0,
      extraCharge: 0,
      originalStops: originalRoute?.totalStations ?? 0,
      newStops: newRoute?.totalStations ?? 0,
      newLine: getJourneyLine(fromStation, newDestination),
      errorReason: 'No valid route found to selected station',
    };
  }

  if (newRoute.interchanges.length > 1 || originalRoute.interchanges.length > 1) {
    return {
      modificationType: 'INVALID',
      originalFare: originalRoute.fare,
      newFare: newRoute.fare,
      fareDifference: Math.abs(newRoute.fare - originalRoute.fare),
      refundAmount: 0,
      extraCharge: 0,
      originalStops: originalRoute.totalStations,
      newStops: newRoute.totalStations,
      newLine: getJourneyLine(fromStation, newDestination),
      errorReason: 'Cross-line modifications not supported',
    };
  }

  const originalLine = getJourneyLine(fromStation, originalDestination);
  const newLine = getJourneyLine(fromStation, newDestination);

  if (originalLine === 'INTERCHANGE' || newLine === 'INTERCHANGE' || originalLine !== newLine) {
    return {
      modificationType: 'INVALID',
      originalFare: originalRoute.fare,
      newFare: newRoute.fare,
      fareDifference: Math.abs(newRoute.fare - originalRoute.fare),
      refundAmount: 0,
      extraCharge: 0,
      originalStops: originalRoute.totalStations,
      newStops: newRoute.totalStations,
      newLine,
      errorReason: 'Cross-line modifications not supported',
    };
  }

  const fromIndex = getStationIndex(fromStation, originalLine);
  const originalIndex = getStationIndex(originalDestination, originalLine);
  const newIndex = getStationIndex(newDestination, newLine);

  if (fromIndex < 0 || originalIndex < 0 || newIndex < 0) {
    return {
      modificationType: 'INVALID',
      originalFare: originalRoute.fare,
      newFare: newRoute.fare,
      fareDifference: Math.abs(newRoute.fare - originalRoute.fare),
      refundAmount: 0,
      extraCharge: 0,
      originalStops: originalRoute.totalStations,
      newStops: newRoute.totalStations,
      newLine,
      errorReason: 'Could not determine station order for modification',
    };
  }

  const originalOffset = originalIndex - fromIndex;
  const newOffset = newIndex - fromIndex;

  if (originalOffset === 0 || newOffset === 0) {
    return {
      modificationType: 'INVALID',
      originalFare: originalRoute.fare,
      newFare: newRoute.fare,
      fareDifference: Math.abs(newRoute.fare - originalRoute.fare),
      refundAmount: 0,
      extraCharge: 0,
      originalStops: originalRoute.totalStations,
      newStops: newRoute.totalStations,
      newLine,
      errorReason: 'Destination cannot be the same as origin',
    };
  }

  if (Math.sign(originalOffset) !== Math.sign(newOffset)) {
    return {
      modificationType: 'INVALID',
      originalFare: originalRoute.fare,
      newFare: newRoute.fare,
      fareDifference: Math.abs(newRoute.fare - originalRoute.fare),
      refundAmount: 0,
      extraCharge: 0,
      originalStops: originalRoute.totalStations,
      newStops: newRoute.totalStations,
      newLine,
      errorReason: 'New destination must stay in the same travel direction',
    };
  }

  const extension = Math.abs(newOffset) > Math.abs(originalOffset);
  const shortening = Math.abs(newOffset) < Math.abs(originalOffset);

  if (!extension && !shortening) {
    return {
      modificationType: 'INVALID',
      originalFare: originalRoute.fare,
      newFare: newRoute.fare,
      fareDifference: 0,
      refundAmount: 0,
      extraCharge: 0,
      originalStops: originalRoute.totalStations,
      newStops: newRoute.totalStations,
      newLine,
      errorReason: 'This is already your destination',
    };
  }

  const fareDifference = Math.abs(newRoute.fare - originalRoute.fare);

  return {
    modificationType: extension ? 'EXTENSION' : 'SHORTENING',
    originalFare: originalRoute.fare,
    newFare: newRoute.fare,
    fareDifference,
    refundAmount: extension ? 0 : fareDifference,
    extraCharge: extension ? fareDifference : 0,
    originalStops: originalRoute.totalStations,
    newStops: newRoute.totalStations,
    newLine,
  };
}

export function getStationAmenities(
  stationName: string
): AmenityCategory[] {
  const station = ALL_STATIONS.find(
    s => resolveAmenityStationName(s.name) === resolveAmenityStationName(stationName)
  );
  return station?.amenities ?? [];
}

export function getStationsWithAmenity(
  category: AmenityCategory
): string[] {
  return ALL_STATIONS
    .filter(s => s.amenities?.includes(category))
    .map(s => s.name);
}

export function getAmenityDetails(
  stationName: string
): AmenityInfo[] {
  const station = ALL_STATIONS.find(
    s => resolveAmenityStationName(s.name) === resolveAmenityStationName(stationName)
  );
  return station?.amenityDetails ?? [];
}

export function getStationParking(stationName: string): StationParking | null {
  const normalized = normalizeAmenityStationName(stationName);
  const direct = STATION_PARKING_MAP[normalized];
  if (direct) return direct;

  const resolved = resolveAmenityStationName(stationName);
  return STATION_PARKING_MAP[resolved] ?? null;
}
