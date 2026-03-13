import { FunctionTool } from '@google/adk';
import { Type, type Schema } from '@google/genai';
import type { RefundDraftResult } from '@/lib/adk/types';

const refundParameters: Schema = {
  type: Type.OBJECT,
  properties: {
    ticketId: { type: Type.STRING },
    userEmail: { type: Type.STRING },
    station: { type: Type.STRING },
    amount: { type: Type.NUMBER },
    reason: { type: Type.STRING },
    incidentDate: { type: Type.STRING },
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function randomCaseId(): string {
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `BMRCL-${suffix}`;
}

export async function runRefundDraftTool(input: unknown): Promise<RefundDraftResult> {
  const payload = asRecord(input);
  const ticketId = asString(payload.ticketId, 'TICKET-UNAVAILABLE');
  const userEmail = asString(payload.userEmail, 'passenger@unknown.mail');
  const station = asString(payload.station, 'Unknown Station');
  const amount = asNumber(payload.amount, 0);
  const reason = asString(payload.reason, 'Passenger reported payment or gate issue.');
  const incidentDate = asString(payload.incidentDate, new Date().toISOString().slice(0, 10));

  const caseId = randomCaseId();
  const subject = `Refund Request Acknowledgement - ${caseId} - Ticket ${ticketId}`;
  const body = [
    'Dear Passenger,',
    '',
    'Greetings from BMRCL Customer Care.',
    `We acknowledge your refund request under case reference ${caseId}.`,
    '',
    `Ticket ID: ${ticketId}`,
    `Registered Email: ${userEmail}`,
    `Station: ${station}`,
    `Incident Date: ${incidentDate}`,
    `Reported Reason: ${reason}`,
    `Estimated Refund Amount: INR ${amount.toFixed(2)}`,
    '',
    'Our team has initiated verification and the refund will be processed within 3 to 5 business days.',
    'If additional details are required, our support team will reach out to you.',
    '',
    'For urgent assistance, contact BMRCL Customer Care at 1800-425-1663.',
    '',
    'Regards,',
    'BMRCL Customer Care',
  ].join('\n');

  return {
    caseId,
    subject,
    body,
    refundDays: 3,
  };
}

export const refundDraftTool = new FunctionTool({
  name: 'refundDraftTool',
  description: 'Generates formal BMRCL refund email draft and case reference.',
  parameters: refundParameters,
  execute: runRefundDraftTool,
});
