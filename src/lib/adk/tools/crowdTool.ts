import { FunctionTool } from '@google/adk';
import { Type, type Schema } from '@google/genai';
import type { CrowdReading, CrowdToolResult } from '@/lib/adk/types';

const crowdParameters: Schema = {
  type: Type.OBJECT,
  properties: {
    station: { type: Type.STRING },
    windowMinutes: { type: Type.NUMBER },
  },
};

const HOT_STATIONS = ['Majestic', 'MG Road', 'Whitefield', 'Indiranagar', 'Yeshwanthpur'] as const;
const ALL_MONITORED_STATIONS = ['Majestic', 'MG Road', 'Whitefield', 'Indiranagar', 'Yeshwanthpur', 'Nagasandra', 'Silk Institute'];

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isWeekday(now: Date): boolean {
  const day = now.getDay();
  return day >= 1 && day <= 5;
}

function isPeakHour(now: Date): boolean {
  const hour = now.getHours();
  const morningPeak = hour >= 8 && hour < 10;
  const eveningPeak = hour >= 17 && hour < 20;
  return morningPeak || eveningPeak;
}

function variance(value: number): number {
  const swing = 0.8 + Math.random() * 0.4;
  return Math.round(value * swing);
}

function toLoad(tapIns: number, peak: boolean): 'NORMAL' | 'ELEVATED' | 'SURGE' {
  const surgeThreshold = peak ? 180 : 120;
  const elevatedThreshold = peak ? 140 : 90;
  if (tapIns >= surgeThreshold) return 'SURGE';
  if (tapIns >= elevatedThreshold) return 'ELEVATED';
  return 'NORMAL';
}

export async function runCrowdTool(input: unknown): Promise<CrowdToolResult> {
  const payload = asRecord(input);
  const now = new Date();
  const peak = isWeekday(now) && isPeakHour(now);
  const focusStation = asString(payload.station);
  const windowMinutes = Math.max(1, asNumber(payload.windowMinutes, 5));

  const stationList = focusStation ? [focusStation] : ALL_MONITORED_STATIONS;

  const readings: CrowdReading[] = stationList.map(station => {
    const hot = HOT_STATIONS.some(s => s.toLowerCase() === station.toLowerCase());
    const baseline = peak ? (hot ? 190 : 135) : (hot ? 130 : 85);
    const tapIns = variance(baseline);
    const tapOuts = variance(Math.max(40, baseline - 25));
    const platformOccupancy = Math.max(10, Math.min(100, Math.round((tapIns / (peak ? 2.2 : 1.8)))));

    return {
      station,
      tapIns,
      tapOuts,
      timestamp: new Date(now.getTime() - windowMinutes * 60 * 1000).toISOString(),
      platformOccupancy,
      systemLoad: toLoad(tapIns, peak),
    };
  });

  return { readings };
}

export const crowdTool = new FunctionTool({
  name: 'crowdTool',
  description: 'Simulates station tap-in and tap-out readings with peak-hour sensitivity for Bengaluru Metro.',
  parameters: crowdParameters,
  execute: runCrowdTool,
});
