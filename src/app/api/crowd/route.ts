import { NextResponse } from 'next/server';
import { runWithFallback } from '@/lib/adk/mock-runner';
import { parseJsonSafe } from '@/lib/adk/runner';
import { runCrowdTool } from '@/lib/adk/tools/crowdTool';
import { runNotifyTool } from '@/lib/adk/tools/notifyTool';
import type { AgentEnvelope, CrowdToolResult, FrequencyUpdate, Severity } from '@/lib/adk/types';

interface CrowdRequest {
  station?: string;
  windowMinutes?: number;
}

function severityRank(level: Severity): number {
  if (level === 'CRIT') return 4;
  if (level === 'HIGH') return 3;
  if (level === 'MED') return 2;
  return 1;
}

function toSeverityFromReadings(data: CrowdToolResult): Severity {
  const hasSurge = data.readings.some(reading => reading.systemLoad === 'SURGE');
  if (hasSurge) return 'CRIT';
  const hasElevated = data.readings.some(reading => reading.systemLoad === 'ELEVATED');
  return hasElevated ? 'HIGH' : 'LOW';
}

function buildFrequencyUpdate(data: CrowdToolResult): FrequencyUpdate | undefined {
  const surge = data.readings.find(reading => reading.systemLoad === 'SURGE');
  if (!surge) return undefined;

  const line: 'Purple' | 'Green' = ['Nagasandra', 'Yeshwanthpur', 'Silk Institute'].includes(surge.station)
    ? 'Green'
    : 'Purple';

  return {
    line,
    oldFrequencyMin: 6,
    newFrequencyMin: 3,
    affectedStations: [surge.station, line === 'Purple' ? 'MG Road' : 'Majestic'],
    effectiveFrom: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    estimatedDuration: '45 minutes',
    message: `High demand near ${surge.station}. Trains on ${line} Line are being dispatched every 3-4 minutes.`,
    operatorNote: `Deploy platform marshals and keep one reserve rake ready near ${surge.station}.`,
  };
}

function fallbackJson(station?: string): string {
  return JSON.stringify({
    agentName: 'crowd_agent',
    reasoning: 'Fallback crowd reasoning generated from deterministic simulator.',
    action: 'monitor_crowd',
    severity: 'LOW',
    affectedStations: station ? [station] : [],
    recommendedAction: 'Continue crowd monitoring.',
    result: {
      crowd_summary: 'No immediate surge in fallback path.',
    },
  });
}

export async function POST(request: Request) {
  let body: CrowdRequest = {};
  try {
    body = (await request.json()) as CrowdRequest;
  } catch {
    body = {};
  }

  const payload = {
    station: body.station,
    windowMinutes: body.windowMinutes ?? 5,
  };

  const toolResult = (await runCrowdTool(payload)) as CrowdToolResult;

  const crowdPrompt = [
    'Analyze crowd condition from tap-in and occupancy.',
    `station=${body.station ?? 'all'}`,
    `windowMinutes=${payload.windowMinutes}`,
    'Return strict JSON envelope.',
  ].join('\n');

  const frequencyPrompt = [
    'Evaluate whether train frequency update is required for surge.',
    `station=${body.station ?? 'all'}`,
    'Return strict JSON with updated true/false and rationale.',
  ].join('\n');

  const crowdRaw = await runWithFallback('crowd', crowdPrompt, fallbackJson(body.station));
  const frequencyRaw = await runWithFallback('frequency', frequencyPrompt, fallbackJson(body.station));

  const crowdParsed = parseJsonSafe<AgentEnvelope<Record<string, unknown>>>(crowdRaw);
  const frequencyParsed = parseJsonSafe<AgentEnvelope<Record<string, unknown>>>(frequencyRaw);

  const derivedSeverity = toSeverityFromReadings(toolResult);
  const derivedUpdate = buildFrequencyUpdate(toolResult);

  const frequencyNotification = derivedUpdate
    ? await runNotifyTool({
        line: derivedUpdate.line,
        newFrequencyMin: derivedUpdate.newFrequencyMin,
        affectedStations: derivedUpdate.affectedStations,
        message: derivedUpdate.message,
        operatorNote: derivedUpdate.operatorNote,
      })
    : null;

  if (!crowdParsed.ok && !frequencyParsed.ok) {
    return NextResponse.json({
      status: 'ok',
      data: {
        type: 'SURGE_ALERT',
        severity: derivedSeverity,
        station: body.station ?? 'Majestic',
        currentTapRate: toolResult.readings[0]?.tapIns ?? 0,
        context: 'Derived from simulator readings.',
        recommendation: derivedUpdate ? 'Increase train frequency to manage crowd build-up.' : 'Continue regular monitoring.',
        xaiReasoning: 'Rule-based thresholding on tap-ins and load classes.',
        crowdReadings: toolResult.readings,
        frequencyUpdate: derivedUpdate,
        notification: frequencyNotification,
      },
    });
  }

  const combinedSeverity = (() => {
    const c = crowdParsed.ok ? crowdParsed.value.severity : 'LOW';
    const f = frequencyParsed.ok ? frequencyParsed.value.severity : 'LOW';
    const max = Math.max(severityRank(c), severityRank(f), severityRank(derivedSeverity));
    if (max >= 4) return 'CRIT';
    if (max >= 3) return 'HIGH';
    if (max >= 2) return 'MED';
    return 'LOW';
  })();

  const station = body.station ?? toolResult.readings[0]?.station ?? 'Majestic';
  const currentTapRate = toolResult.readings[0]?.tapIns ?? 0;

  return NextResponse.json({
    status: 'ok',
    data: {
      type: 'SURGE_ALERT',
      severity: combinedSeverity,
      station,
      currentTapRate,
      context: 'Crowd and frequency agents merged with deterministic tool telemetry.',
      recommendation: derivedUpdate ? 'Dispatch additional trains and regulate platform inflow.' : 'Maintain current frequency and keep monitoring.',
      xaiReasoning: 'Signals were inferred from real-time tap-in simulation, occupancy buckets, and surge thresholds.',
      crowdReadings: toolResult.readings,
      frequencyUpdate: derivedUpdate,
      notification: frequencyNotification,
      agentEnvelope: {
        crowd: crowdParsed.ok ? crowdParsed.value : null,
        frequency: frequencyParsed.ok ? frequencyParsed.value : null,
      },
    },
  });
}
