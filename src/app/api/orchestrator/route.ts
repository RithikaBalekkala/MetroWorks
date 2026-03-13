import { NextResponse } from 'next/server';
import { runWithFallback } from '@/lib/adk/mock-runner';
import { parseJsonSafe } from '@/lib/adk/runner';

interface OrchestratorRequest {
  intent?: string;
  message?: string;
  from?: string;
  to?: string;
  station?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
}

function fallbackEnvelope(body: OrchestratorRequest) {
  const intent = body.intent ?? 'chat';
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

  const prompt = [
    'You are orchestrator agent. Choose one specialist route among: chat, refund, places, crowd, frequency.',
    `intent=${body.intent ?? 'chat'}`,
    `message=${body.message ?? 'No message provided'}`,
    `from=${body.from ?? ''}`,
    `to=${body.to ?? ''}`,
    `station=${body.station ?? ''}`,
    `timeOfDay=${body.timeOfDay ?? 'afternoon'}`,
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
