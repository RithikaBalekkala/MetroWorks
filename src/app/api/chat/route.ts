import { NextResponse } from 'next/server';
import { runWithFallback } from '@/lib/adk/mock-runner';
import { parseJsonSafe } from '@/lib/adk/runner';
import { runRoutingTool } from '@/lib/adk/tools/routingTool';
import type { AgentEnvelope } from '@/lib/adk/types';

interface ChatRequest {
  message?: string;
  from?: string;
  to?: string;
}

function fallbackJson(req: ChatRequest): string {
  const from = req.from ?? 'Whitefield';
  const to = req.to ?? 'Majestic';
  return JSON.stringify({
    agentName: 'chat_agent',
    reasoning: 'Fallback route planner generated a deterministic answer.',
    action: 'route_lookup',
    severity: 'LOW',
    affectedStations: [],
    recommendedAction: 'Follow route instructions and board from specified platform.',
    result: {
      commuter_message: `Route guidance from ${from} to ${to}.`,
      route_details: null,
    },
  });
}

export async function POST(request: Request) {
  let body: ChatRequest = {};
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    body = {};
  }

  const from = body.from ?? 'Whitefield';
  const to = body.to ?? 'Majestic';
  const message = body.message?.trim() || `Help me travel from ${from} to ${to}`;

  const prompt = [
    'User request:',
    message,
    `from=${from}`,
    `to=${to}`,
    'Use routingTool and produce strict JSON envelope.',
  ].join('\n');

  const adkRaw = await runWithFallback('chat', prompt, fallbackJson(body));
  const parsed = parseJsonSafe<AgentEnvelope<{ commuter_message?: string; route_details?: unknown }>>(adkRaw);

  const routeData = await runRoutingTool({ from, to });

  if (!parsed.ok) {
    return NextResponse.json({
      status: 'ok',
      data: {
        ...JSON.parse(fallbackJson(body)),
        result: {
          ...(JSON.parse(fallbackJson(body)).result ?? {}),
          route_details: routeData,
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
        route_details: routeData,
      },
    },
  });
}
