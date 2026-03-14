import { LlmAgent } from '@google/adk';
import { placesTool } from '@/lib/adk/tools/placesTool';
import {
  getStationsWithAmenity,
  getAmenityDetails,
  getStationAmenities,
  type AmenityCategory,
} from '@/lib/metro-network';

function buildAmenityContext(): string {
  const categories: AmenityCategory[] = [
    'HOSPITALS',
    'EDUCATION',
    'HOTELS',
    'MALLS',
    'TOURISM',
    'TECH_PARKS',
    'RAILWAY',
    'BUS_TERMINAL',
    'GOVERNMENT',
    'BIKE_PARKING',
    'CAR_PARKING',
  ];

  const lines = categories
    .map(cat => {
      const stations = getStationsWithAmenity(cat);
      if (stations.length === 0) return null;
      return `${cat}: ${stations.join(', ')}`;
    })
    .filter((line): line is string => Boolean(line));

  return lines.join('\n');
}

export function queryAmenityByCategory(
  category: AmenityCategory,
  nearStation?: string
): {
  stations: string[];
  primaryRecommendation: string;
  details: string;
} {
  const stations = getStationsWithAmenity(category);

  if (stations.length === 0) {
    return {
      stations: [],
      primaryRecommendation: '',
      details: `No stations with ${category} amenities found.`,
    };
  }

  const prioritized = nearStation
    ? [nearStation, ...stations.filter(st => st !== nearStation)]
    : stations;

  const primary = prioritized.find(st => getStationAmenities(st).includes(category)) ?? stations[0];

  const details = getAmenityDetails(primary);
  const detailText = details
    .filter(d => d.category === category)
    .map(d => `${d.name} (${d.walkMinutes} min walk)`)
    .join(', ');

  return {
    stations,
    primaryRecommendation: primary,
    details: detailText || `${category} facilities available near ${primary}`,
  };
}

const placesInstruction = [
  'You are BMRCL nearby places specialist for destination exploration.',
  'Use placesTool and return category-wise suggestions.',
  'Always output strict JSON only:',
  '{"agentName":"places_agent","reasoning":"...","action":"...","severity":"LOW|MED|HIGH|CRIT","affectedStations":[],"recommendedAction":"...","result":{...}}',
  'Result should include station, time_of_day, and arrays for foodAndCafes, historicalAndCultural, shopping, parks.',
  'METRO STATION AMENITIES DATA:',
  'You have access to real categorised amenity data for Namma Metro stations. Use this data to answer questions about nearby facilities.',
  buildAmenityContext(),
  'When answering amenity questions:',
  '- Be specific about station names',
  '- Mention walking distance if available',
  '- Suggest the best station for the user\'s need',
  '- If multiple stations have the same amenity, rank by proximity to user\'s stated origin or destination',
  '- For parking queries: mention availability count (e.g. 62 car spots available), pricing (₹30/hr), and whether it is currently full or available.',
  '- Always confirm: "You can take the metro to [Station] and walk [X] minutes to reach [Place]"',
  'Example queries you can handle:',
  '- "Which station is nearest to a hospital?"',
  '- "Are there hotels near Whitefield station?"',
  '- "I need to visit IISc, which station should I use?"',
  '- "Is there a mall near my destination at MG Road?"',
  '- "Which stations have railway connectivity?"',
  '- "Which stations have bike parking?"',
  '- "Is there car parking at Whitefield station?"',
  '- "Can I park my bike at MG Road metro?"',
  '- "Which station has the most parking spaces?"',
  '- "Is parking full at Electronic City today?"',
  'No markdown and no code fences.',
].join(' ');

export const placesAgent = new LlmAgent({
  name: 'places_agent',
  model: 'gemini-2.5-flash',
  description: 'Suggests curated nearby places grouped by category around a metro stop.',
  instruction: placesInstruction,
  tools: [placesTool],
});
