import { FunctionTool } from '@google/adk';
import { Type, type Schema } from '@google/genai';
import {
  GREEN_LINE,
  INTERCHANGE_PENALTY_MIN,
  INTERCHANGE_STATION,
  PURPLE_LINE,
  computeStationStops,
  estimateFareByStops,
  estimateMinutes,
  resolveLineForStation,
  sliceLine,
} from '@/lib/adk/routing-matrix';
import type { RoutingSegment, RoutingToolResult } from '@/lib/adk/types';

const routingParameters: Schema = {
  type: Type.OBJECT,
  properties: {
    from: { type: Type.STRING, description: 'Source station name' },
    to: { type: Type.STRING, description: 'Destination station name' },
  },
  required: ['from', 'to'],
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getLinePlatform(line: 'Purple' | 'Green'): number {
  return line === 'Purple' ? 1 : 2;
}

function buildSameLineRoute(from: string, to: string, line: 'Purple' | 'Green'): RoutingToolResult {
  const lineList = line === 'Purple' ? PURPLE_LINE : GREEN_LINE;
  const stops = computeStationStops(lineList, from, to);
  const minutes = estimateMinutes(from, to, stops, false);
  const segment: RoutingSegment = {
    line,
    from,
    to,
    stops,
    minutes,
    platform: getLinePlatform(line),
  };

  const instructions = [
    `Board ${line} Line at Platform ${segment.platform} from ${from}.`,
    `Ride for ${segment.stops} stops passing ${sliceLine(lineList, from, to).slice(1, -1).join(', ') || 'direct corridor'}.`,
    `Alight at ${to}. Approximate travel time: ${segment.minutes} minutes.`,
  ];

  return {
    segments: [segment],
    interchange: { required: false, station: INTERCHANGE_STATION },
    totalMinutes: minutes,
    fare: estimateFareByStops(stops),
    instructions,
  };
}

function buildInterchangeRoute(from: string, to: string, fromLine: 'Purple' | 'Green', toLine: 'Purple' | 'Green'): RoutingToolResult {
  const startLineList = fromLine === 'Purple' ? PURPLE_LINE : GREEN_LINE;
  const endLineList = toLine === 'Purple' ? PURPLE_LINE : GREEN_LINE;

  const firstStops = computeStationStops(startLineList, from, INTERCHANGE_STATION);
  const secondStops = computeStationStops(endLineList, INTERCHANGE_STATION, to);

  const firstMinutes = estimateMinutes(from, INTERCHANGE_STATION, firstStops, false);
  const secondMinutes = estimateMinutes(INTERCHANGE_STATION, to, secondStops, false);
  const totalStops = firstStops + secondStops;
  const totalMinutes = estimateMinutes(from, to, totalStops, true);

  const segments: RoutingSegment[] = [
    {
      line: fromLine,
      from,
      to: INTERCHANGE_STATION,
      stops: firstStops,
      minutes: firstMinutes,
      platform: getLinePlatform(fromLine),
    },
    {
      line: toLine,
      from: INTERCHANGE_STATION,
      to,
      stops: secondStops,
      minutes: secondMinutes,
      platform: getLinePlatform(toLine),
    },
  ];

  const instructions = [
    `Start on ${fromLine} Line from ${from} at Platform ${getLinePlatform(fromLine)}.`,
    `Travel ${firstStops} stops to ${INTERCHANGE_STATION}.`,
    `Interchange at ${INTERCHANGE_STATION} (add ${INTERCHANGE_PENALTY_MIN} minutes walking time).`,
    `Switch to ${toLine} Line Platform ${getLinePlatform(toLine)} and travel ${secondStops} stops to ${to}.`,
    `Total estimated journey time is ${totalMinutes} minutes.`,
  ];

  return {
    segments,
    interchange: { required: true, station: INTERCHANGE_STATION },
    totalMinutes,
    fare: estimateFareByStops(totalStops),
    instructions,
  };
}

export async function runRoutingTool(input: unknown): Promise<RoutingToolResult | { error: string }> {
  const record = asRecord(input);
  const from = asString(record.from);
  const to = asString(record.to);

  if (!from || !to) return { error: 'Both from and to stations are required.' };

  const fromLine = resolveLineForStation(from);
  const toLine = resolveLineForStation(to);

  if (!fromLine || !toLine) {
    return { error: 'Station not found in BMRCL matrix.' };
  }

  if (fromLine === toLine) {
    return buildSameLineRoute(from, to, fromLine);
  }

  return buildInterchangeRoute(from, to, fromLine, toLine);
}

export const routingTool = new FunctionTool({
  name: 'routingTool',
  description: 'Calculate route, interchange, platforms and duration for Namma Metro journeys.',
  parameters: routingParameters,
  execute: runRoutingTool,
});
