import { NextResponse } from 'next/server';
import { calculateRoute, ALL_STATIONS } from '@/lib/metro-network';
import { runWithFallback } from '@/lib/adk/mock-runner';
import { parseJsonSafe } from '@/lib/adk/runner';
import type { AmenityCategory } from '@/lib/metro-network';
import { findNearestParkingStations, getStationAmenities, getStationParking } from '@/lib/metro-network';
import { queryAmenityByCategory } from '@/agents/placesAgent';
import { queryLostAndFoundAssistance } from '@/agents/lostAndFoundAgent';
import { detectAmenityCategoryFromMessage, shouldRouteToLostAndFound, shouldRouteToPlacesForAmenity } from '@/agents/orchestratorAgent';

interface HomeChatRequest {
  message?: string;
}

interface HomeChatResponse {
  answerType: 'ROUTE' | 'TRAIN_INFO' | 'GENERAL';
  title: string;
  summary: string;
  details: Array<{ label: string; value: string }>;
  quickFollowUps: string[];
}

interface AmenityChatResponse {
  answerType: 'AMENITY';
  category: AmenityCategory;
  stations: string[];
  primaryRecommendation: string;
  details: string;
  userQuery: string;
}

interface ParkingChatResponse {
  answerType: 'PARKING';
  stationName: string;
  parking: ReturnType<typeof getStationParking>;
  nearbyStations: string[];
  userQuery: string;
}

interface LostFoundChatResponse {
  answerType: 'LOST_FOUND';
  stationName: string;
  category: string;
  caseIdTemplate: string;
  deskLocation: string;
  contactNumber: string;
  operatingHours: string;
  escalationOffice: string;
  etaForCallbackHours: number;
  nextSteps: string[];
  userQuery: string;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function stationAliases(stationName: string): string[] {
  const n = normalize(stationName);
  const aliases = [n];

  if (n.includes('nadaprabhu kempegowda station majestic')) {
    aliases.push('majestic', 'kempegowda station majestic', 'kempegowda station');
  }
  if (n.includes('mahatma gandhi road')) aliases.push('mg road');
  if (n.includes('r.v. road')) aliases.push('rv road');
  if (n.includes('j.p. nagar')) aliases.push('jp nagar');
  if (n.includes('whitefield')) aliases.push('whitefield');
  if (n.includes('indiranagar')) aliases.push('indiranagar');
  if (n.includes('yeshwanthpur')) aliases.push('yeshwanthpur');
  if (n.includes('cubbon park')) aliases.push('cubbon park');

  return [...new Set(aliases)];
}

function extractStations(message: string): { fromName: string; toName: string } | null {
  const msg = normalize(message);
  const found = ALL_STATIONS
    .filter(station => stationAliases(station.name).some(alias => msg.includes(alias)))
    .map(station => station.name);

  const unique = [...new Set(found)];
  if (unique.length >= 2) {
    return { fromName: unique[0], toName: unique[1] };
  }
  return null;
}

function isHomeChatResponse(value: unknown): value is HomeChatResponse {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.answerType !== 'ROUTE' && v.answerType !== 'TRAIN_INFO' && v.answerType !== 'GENERAL') return false;
  if (typeof v.title !== 'string' || typeof v.summary !== 'string') return false;
  if (!Array.isArray(v.details) || !Array.isArray(v.quickFollowUps)) return false;
  return true;
}

function findStationIdByName(name: string): string | null {
  const needle = normalize(name);
  const station = ALL_STATIONS.find(s => normalize(s.name) === needle);
  return station?.id ?? null;
}

function extractStationMention(message: string): string | null {
  const msg = normalize(message);
  const found = ALL_STATIONS.find(station => stationAliases(station.name).some(alias => msg.includes(alias)));
  return found?.name ?? null;
}

function buildAmenityResponse(message: string): AmenityChatResponse | null {
  const detectedCategory = detectAmenityCategoryFromMessage(message);
  const nearStation = extractStationMention(message) ?? undefined;

  const category = detectedCategory ?? (() => {
    if (!nearStation) return null;
    const categories = getStationAmenities(nearStation);
    return categories.length > 0 ? categories[0] : null;
  })();

  if (!category) {
    return null;
  }

  const result = queryAmenityByCategory(category, nearStation);

  return {
    answerType: 'AMENITY',
    category,
    stations: result.stations,
    primaryRecommendation: result.primaryRecommendation,
    details: result.details,
    userQuery: message,
  };
}

function buildParkingResponse(message: string): ParkingChatResponse | null {
  const stationName = extractStationMention(message);
  if (!stationName) return null;

  return {
    answerType: 'PARKING',
    stationName,
    parking: getStationParking(stationName),
    nearbyStations: findNearestParkingStations(stationName, 4),
    userQuery: message,
  };
}

function buildLostFoundResponse(message: string): LostFoundChatResponse {
  return queryLostAndFoundAssistance({ userQuery: message });
}

function routeFacts(fromName: string, toName: string): Record<string, string> {
  const fromId = findStationIdByName(fromName);
  const toId = findStationIdByName(toName);

  if (!fromId || !toId) {
    return {};
  }

  const route = calculateRoute(fromId, toId);
  if (!route) {
    return {};
  }

  const segmentSummary = route.segments
    .map(seg => `${seg.from.name} -> ${seg.to.name} (${seg.stationCount} stops, ${seg.durationMins} min, ${seg.line.toUpperCase()} line)`)
    .join(' | ');

  return {
    from: fromName,
    to: toName,
    totalFare: `INR ${route.fare}`,
    estimatedDuration: `${route.totalDurationMins} minutes`,
    totalStops: `${route.totalStations}`,
    interchange: route.interchanges.length ? route.interchanges.join(', ') : 'No interchange required',
    routeSegments: segmentSummary,
  };
}

function fallbackGeneralAnswer(): HomeChatResponse {
  return {
    answerType: 'GENERAL',
    title: 'Metro Assistant',
    summary: 'Please ask your metro question again. I can answer fare, route, and train timing details.',
    details: [
      { label: 'Try', value: 'Fare from Whitefield to Majestic' },
      { label: 'Try', value: 'Route from Indiranagar to Jayanagar' },
      { label: 'Try', value: 'What are train timings and frequency?' },
    ],
    quickFollowUps: [
      'Fare from Whitefield to Majestic',
      'Route from Cubbon Park to Yeshwanthpur',
      'Train details for Namma Metro',
    ],
  };
}

function fallbackRouteAnswer(message: string): HomeChatResponse {
  const extracted = extractStations(message);
  if (!extracted) return fallbackGeneralAnswer();

  const facts = routeFacts(extracted.fromName, extracted.toName);
  if (!facts.totalFare) return fallbackGeneralAnswer();

  return {
    answerType: 'ROUTE',
    title: `Route and Fare: ${facts.from} -> ${facts.to}`,
    summary: `Exact computed fare is ${facts.totalFare} with estimated duration ${facts.estimatedDuration}.`,
    details: [
      { label: 'Source', value: facts.from },
      { label: 'Destination', value: facts.to },
      { label: 'Fare', value: facts.totalFare },
      { label: 'Duration', value: facts.estimatedDuration },
      { label: 'Stops', value: facts.totalStops },
      { label: 'Interchange', value: facts.interchange },
      { label: 'Route Segments', value: facts.routeSegments },
    ],
    quickFollowUps: [
      `Fare from ${facts.to} to ${facts.from}`,
      'What are train timings and frequency?',
      'Show more route options',
    ],
  };
}

export async function POST(request: Request) {
  let body: HomeChatRequest = {};
  try {
    body = (await request.json()) as HomeChatRequest;
  } catch {
    body = {};
  }

  const message = (body.message ?? '').trim();
  if (!message) {
    return NextResponse.json({ status: 'ok', data: fallbackGeneralAnswer() });
  }

  if (shouldRouteToLostAndFound(message)) {
    return NextResponse.json({ status: 'ok', data: buildLostFoundResponse(message) });
  }

  if (/parking|park and ride|car park|bike park|vehicle parking/.test(message.toLowerCase())) {
    const parkingResponse = buildParkingResponse(message);
    if (parkingResponse) {
      return NextResponse.json({ status: 'ok', data: parkingResponse });
    }
  }

  if (shouldRouteToPlacesForAmenity(message)) {
    const amenityResponse = buildAmenityResponse(message);
    if (amenityResponse) {
      return NextResponse.json({ status: 'ok', data: amenityResponse });
    }
  }

  const extracted = extractStations(message);
  const facts = extracted ? routeFacts(extracted.fromName, extracted.toName) : {};

  const prompt = [
    'You are Namma Metro assistant. Answer passenger Q&A in strict JSON.',
    'Output schema: {"answerType":"ROUTE|TRAIN_INFO|GENERAL","title":"...","summary":"...","details":[{"label":"...","value":"..."}],"quickFollowUps":["...","...","..."]}',
    `User question: ${message}`,
    'System facts:',
    '- Operating Hours: 05:00 to 23:00',
    '- Peak Frequency: every 5-6 minutes',
    '- Lines: Purple and Green',
    '- Interchange: Nadaprabhu Kempegowda Station Majestic',
    `- Source station (if resolved): ${extracted?.fromName ?? 'not-resolved'}`,
    `- Destination station (if resolved): ${extracted?.toName ?? 'not-resolved'}`,
    `- Route facts JSON: ${JSON.stringify(facts)}`,
    'If station aliases are present (example: Whitefield, Majestic), use the resolved stations and provide exact fare and route details.',
    'Do not ask for station-name clarification when source and destination are available in route facts JSON.',
    'Return concise, exact commuter answer.',
    'No markdown, only JSON.',
  ].join('\n');

  const raw = await runWithFallback('home-chat', prompt, JSON.stringify(fallbackRouteAnswer(message)));
  const parsed = parseJsonSafe<HomeChatResponse>(raw);

  if (!parsed.ok || !isHomeChatResponse(parsed.value)) {
    return NextResponse.json({ status: 'ok', data: fallbackRouteAnswer(message) });
  }

  return NextResponse.json({ status: 'ok', data: parsed.value });
}
