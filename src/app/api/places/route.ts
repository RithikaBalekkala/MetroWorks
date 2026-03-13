import { NextResponse } from 'next/server';
import { runWithFallback } from '@/lib/adk/mock-runner';
import { parseJsonSafe } from '@/lib/adk/runner';
import { runPlacesTool } from '@/lib/adk/tools/placesTool';
import type { AgentEnvelope, PlacesToolResult } from '@/lib/adk/types';

interface PlacesRequest {
  station?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
}

function fallbackJson(station: string): string {
  return JSON.stringify({
    agentName: 'places_agent',
    reasoning: 'Fallback suggestion path used deterministic local catalog.',
    action: 'places_lookup',
    severity: 'LOW',
    affectedStations: [station],
    recommendedAction: 'Pick one category and add it to your trip plan.',
    result: {
      station,
      tips: 'Explore food, culture, shopping and parks nearby.',
    },
  });
}

export async function POST(request: Request) {
  let body: PlacesRequest = {};
  try {
    body = (await request.json()) as PlacesRequest;
  } catch {
    body = {};
  }

  const station = body.station ?? 'MG Road';
  const timeOfDay = body.timeOfDay ?? 'afternoon';

  const toolResult = (await runPlacesTool({ station, timeOfDay })) as PlacesToolResult;

  const prompt = [
    `Suggest places around ${station}.`,
    `timeOfDay=${timeOfDay}`,
    'Return strict JSON envelope with category-wise lists.',
  ].join('\n');

  const adkRaw = await runWithFallback('places', prompt, fallbackJson(station));
  const parsed = parseJsonSafe<AgentEnvelope<Record<string, unknown>>>(adkRaw);

  if (!parsed.ok) {
    return NextResponse.json({
      status: 'ok',
      data: {
        ...JSON.parse(fallbackJson(station)),
        result: {
          ...(JSON.parse(fallbackJson(station)).result ?? {}),
          station: toolResult.station,
          timeOfDay: toolResult.timeOfDay,
          foodAndCafes: toolResult.foodAndCafes,
          historicalAndCultural: toolResult.historicalAndCultural,
          shopping: toolResult.shopping,
          parks: toolResult.parks,
        },
      },
    });
  }

  return NextResponse.json({
    status: 'ok',
    data: {
      ...parsed.value,
      result: {
        ...(parsed.value.result ?? {}),
        station: toolResult.station,
        timeOfDay: toolResult.timeOfDay,
        foodAndCafes: toolResult.foodAndCafes,
        historicalAndCultural: toolResult.historicalAndCultural,
        shopping: toolResult.shopping,
        parks: toolResult.parks,
      },
    },
  });
}
