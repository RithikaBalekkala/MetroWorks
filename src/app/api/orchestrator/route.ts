import { NextResponse } from 'next/server';
import { runWithFallback } from '@/lib/adk/mock-runner';
import { parseJsonSafe } from '@/lib/adk/runner';
import {
  detectAmenityCategoryFromMessage,
  shouldRouteToPlacesForAmenity,
  shouldRouteToLostAndFound,
} from '@/agents/orchestratorAgent';
import { queryLostAndFoundAssistance } from '@/agents/lostAndFoundAgent';
import { findNearestParkingStations, getStationParking } from '@/lib/metro-network';

interface OrchestratorRequest {
  intent?: string;
  message?: string;
  from?: string;
  to?: string;
  station?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
}

function fallbackEnvelope(body: OrchestratorRequest) {
  const message = body.message ?? '';
  const amenityCategory = detectAmenityCategoryFromMessage(message);

  const inferredIntent = shouldRouteToLostAndFound(message)
    ? 'lost-and-found'
    : shouldRouteToPlacesForAmenity(message)
      ? 'places'
      : /parking|park and ride|car park|bike park|vehicle parking/.test(message.toLowerCase())
        ? 'parking'
        : 'chat';
  const intent = body.intent ?? inferredIntent;

  const lostAndFoundResult = intent === 'lost-and-found'
    ? queryLostAndFoundAssistance({
      userQuery: message,
      stationName: body.station,
    })
    : null;

  const parkingStation = body.station ?? body.to;
  const parkingResult = intent === 'parking' && parkingStation
    ? {
      answerType: 'PARKING',
      stationName: parkingStation,
      parking: getStationParking(parkingStation),
      nearbyStations: findNearestParkingStations(parkingStation, 4),
      userQuery: message,
    }
    : null;

  return {
    agentName: 'orchestrator_agent',
    reasoning: 'Deterministic fallback orchestrator path was used.',
    action: 'route_to_specialist',
    severity: 'LOW',
    affectedStations: body.station ? [body.station] : [],
    recommendedAction: 'Proceed with the generated response.',
    result: {
      intent,
      message: body.message ?? 'Request processed successfully.',
      routedTo: intent,
      from: body.from,
      to: body.to,
      station: body.station,
      timeOfDay: body.timeOfDay ?? 'afternoon',
      amenityCategory,
      ...(lostAndFoundResult ? lostAndFoundResult : {}),
      ...(parkingResult ? parkingResult : {}),
    },
  };
}

export async function POST(request: Request) {
  let body: OrchestratorRequest = {};
  try {
    body = (await request.json()) as OrchestratorRequest;
  } catch {
    body = {};
  }

  const message = body.message ?? '';
  const detectedAmenityCategory = detectAmenityCategoryFromMessage(message);
  const resolvedIntent = body.intent ?? (
    shouldRouteToLostAndFound(message)
      ? 'lost-and-found'
      : shouldRouteToPlacesForAmenity(message)
        ? 'places'
        : /parking|park and ride|car park|bike park|vehicle parking/.test(message.toLowerCase())
          ? 'parking'
          : 'chat'
  );

  const prompt = [
    'You are orchestrator agent. Choose one specialist route among: chat, refund, places, lost-and-found, parking, crowd, frequency.',
    `intent=${resolvedIntent}`,
    `message=${body.message ?? 'No message provided'}`,
    `from=${body.from ?? ''}`,
    `to=${body.to ?? ''}`,
    `station=${body.station ?? ''}`,
    `timeOfDay=${body.timeOfDay ?? 'afternoon'}`,
    `amenityCategory=${detectedAmenityCategory ?? 'none'}`,
    `lostAndFoundIntent=${shouldRouteToLostAndFound(message) ? 'yes' : 'no'}`,
    `parkingIntent=${/parking|park and ride|car park|bike park|vehicle parking/.test(message.toLowerCase()) ? 'yes' : 'no'}`,
    'Return strict JSON only.',
  ].join('\n');

  const fallback = fallbackEnvelope(body);
  const raw = await runWithFallback('orchestrator', prompt, JSON.stringify(fallback));
  const parsed = parseJsonSafe<Record<string, unknown>>(raw);

  if (!parsed.ok) {
    return NextResponse.json({
      status: 'ok',
      data: fallback,
    });
  }

  return NextResponse.json({
    status: 'ok',
    data: parsed.value,
  });
}
