import { NextResponse } from 'next/server';
import { runWithFallback } from '@/lib/adk/mock-runner';
import { parseJsonSafe } from '@/lib/adk/runner';
import { runRefundDraftTool } from '@/lib/adk/tools/refundDraftTool';
import type { AgentEnvelope, RefundDraftResult } from '@/lib/adk/types';

interface RefundRequest {
  ticketId?: string;
  userEmail?: string;
  station?: string;
  amount?: number;
  reason?: string;
  incidentDate?: string;
}

function fallbackJson(req: RefundRequest): string {
  return JSON.stringify({
    agentName: 'refund_agent',
    reasoning: 'Fallback draft created using deterministic template.',
    action: 'create_refund_draft',
    severity: 'LOW',
    affectedStations: [],
    recommendedAction: 'Share the drafted email with support for processing.',
    result: {
      ticketId: req.ticketId ?? 'UNKNOWN',
    },
  });
}

export async function POST(request: Request) {
  let body: RefundRequest = {};
  try {
    body = (await request.json()) as RefundRequest;
  } catch {
    body = {};
  }

  const toolResult = (await runRefundDraftTool(body)) as RefundDraftResult;

  const prompt = [
    'Generate BMRCL refund response envelope.',
    `ticketId=${body.ticketId ?? 'UNKNOWN'}`,
    `station=${body.station ?? 'UNKNOWN'}`,
    `amount=${body.amount ?? 0}`,
    `reason=${body.reason ?? 'Passenger initiated request'}`,
    `incidentDate=${body.incidentDate ?? new Date().toISOString().slice(0, 10)}`,
    'Include case_id, subject, body, refund_days.',
  ].join('\n');

  const adkRaw = await runWithFallback('refund', prompt, fallbackJson(body));
  const parsed = parseJsonSafe<AgentEnvelope<Record<string, unknown>>>(adkRaw);

  if (!parsed.ok) {
    return NextResponse.json({
      status: 'ok',
      data: {
        ...JSON.parse(fallbackJson(body)),
        result: {
          ...(JSON.parse(fallbackJson(body)).result ?? {}),
        caseId: toolResult.caseId,
        subject: toolResult.subject,
        body: toolResult.body,
        refundDays: toolResult.refundDays,
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
        caseId: toolResult.caseId,
        subject: toolResult.subject,
        body: toolResult.body,
        refundDays: toolResult.refundDays,
      },
    },
  });
}
