import { FunctionTool } from '@google/adk';
import { Type, type Schema } from '@google/genai';
import type { NotifyToolResult } from '@/lib/adk/types';

const notifyParameters: Schema = {
  type: Type.OBJECT,
  properties: {
    line: { type: Type.STRING },
    newFrequencyMin: { type: Type.NUMBER },
    affectedStations: { type: Type.ARRAY, items: { type: Type.STRING } },
    message: { type: Type.STRING },
    operatorNote: { type: Type.STRING },
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

export async function runNotifyTool(input: unknown): Promise<NotifyToolResult> {
  const payload = asRecord(input);
  const lineRaw = asString(payload.line, 'Purple').toLowerCase();
  const line: 'Purple' | 'Green' = lineRaw.includes('green') ? 'Green' : 'Purple';

  return {
    notificationId: globalThis.crypto?.randomUUID?.() ?? `notif-${Date.now()}`,
    sentAt: new Date().toISOString(),
    channelsNotified: ['CommuterApp', 'OperatorDashboard', 'DisplayBoards'],
    line,
    newFrequencyMin: asNumber(payload.newFrequencyMin, 6),
    affectedStations: asStringArray(payload.affectedStations),
    message: asString(payload.message, 'Service update available.'),
    operatorNote: asString(payload.operatorNote, 'No operator note provided.'),
  };
}

export const notifyTool = new FunctionTool({
  name: 'notifyTool',
  description: 'Broadcasts frequency update notifications to commuter and operator channels.',
  parameters: notifyParameters,
  execute: runNotifyTool,
});
