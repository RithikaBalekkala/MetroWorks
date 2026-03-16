import { NextResponse } from 'next/server';
import { runWithFallback } from '@/lib/adk/mock-runner';
import { parseJsonSafe } from '@/lib/adk/runner';

interface VoiceAssistantRequest {
  transcript?: string;
}

interface VoiceAssistantResponse {
  ok: boolean;
  text: string;
  action?: {
    type: 'NAVIGATE' | 'NONE';
    href?: string;
  };
  error?: string;
}

interface AssistantPayload {
  text: string;
  action: {
    type: 'NAVIGATE' | 'NONE';
    href?: string;
  };
}

function bookingHintFromMessage(message: string): { type: 'NAVIGATE' | 'NONE'; href?: string } {
  const lower = message.toLowerCase();
  if (lower.includes('book') || lower.includes('ticket')) {
    return { type: 'NAVIGATE', href: '/auth?redirect=/booking' };
  }
  return { type: 'NONE' };
}

function fallbackPayload(message: string): AssistantPayload {
  const action = bookingHintFromMessage(message);
  return {
    text: action.type === 'NAVIGATE'
      ? 'I can help with booking. I will guide you to the booking flow now.'
      : 'I can help with Namma Metro routes, tickets, timings, and station guidance. Please ask a metro-specific question.',
    action,
  };
}

export async function POST(request: Request) {
  let body: VoiceAssistantRequest = {};

  try {
    body = (await request.json()) as VoiceAssistantRequest;
  } catch {
    body = {};
  }

  const transcript = (body.transcript ?? '').trim();
  if (!transcript) {
    return NextResponse.json<VoiceAssistantResponse>({
      ok: false,
      text: '',
      error: 'Transcript is required.',
    }, { status: 400 });
  }

  const fallback = fallbackPayload(transcript);

  const prompt = [
    'You are Namma Metro Voice Assistant for Bengaluru Metro only.',
    'Scope: route/path guidance, ticket booking guidance, timings, and basic passenger FAQs.',
    'If question is outside metro domain, politely redirect to metro scope.',
    'Return strict JSON only with schema:',
    '{"text":"...","action":{"type":"NAVIGATE|NONE","href":"optional"}}',
    `User transcript: ${transcript}`,
    'If user asks about booking/ticket purchase, action.type must be NAVIGATE and href must be /auth?redirect=/booking.',
    'For route requests, provide concise station-to-station guidance.',
    'No markdown, no extra keys.',
  ].join('\n');

  const raw = await runWithFallback('home-chat', prompt, JSON.stringify(fallback));
  const parsed = parseJsonSafe<AssistantPayload>(raw);

  if (!parsed.ok || typeof parsed.value?.text !== 'string' || !parsed.value?.action) {
    return NextResponse.json<VoiceAssistantResponse>({
      ok: true,
      text: fallback.text,
      action: fallback.action,
    });
  }

  return NextResponse.json<VoiceAssistantResponse>({
    ok: true,
    text: parsed.value.text,
    action: parsed.value.action,
  });
}
