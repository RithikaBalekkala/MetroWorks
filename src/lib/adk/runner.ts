import { InMemorySessionService, Runner, type Event, type Session, isFinalResponse } from '@google/adk';
import { chatAgent } from '@/agents/chatAgent';
import { crowdAgent } from '@/agents/crowdAgent';
import { frequencyAgent } from '@/agents/frequencyAgent';
import { homeChatAgent } from '@/agents/homeChatAgent';
import { orchestratorAgent } from '@/agents/orchestratorAgent';
import { placesAgent } from '@/agents/placesAgent';
import { refundAgent } from '@/agents/refundAgent';

type AgentKey = 'orchestrator' | 'home-chat' | 'chat' | 'refund' | 'places' | 'crowd' | 'frequency';

const APP_NAME = 'bmrcl-platform';
const USER_ID = 'local-user';

const sessionService = new InMemorySessionService();
const runnerCache = new Map<AgentKey, Runner>();
const sessionCache = new Map<AgentKey, Session>();

function getAgent(agentKey: AgentKey) {
  switch (agentKey) {
    case 'orchestrator':
      return orchestratorAgent;
    case 'home-chat':
      return homeChatAgent;
    case 'chat':
      return chatAgent;
    case 'refund':
      return refundAgent;
    case 'places':
      return placesAgent;
    case 'crowd':
      return crowdAgent;
    case 'frequency':
      return frequencyAgent;
    default:
      return chatAgent;
  }
}

function getRunner(agentKey: AgentKey): Runner {
  const found = runnerCache.get(agentKey);
  if (found) return found;

  const runner = new Runner({
    appName: APP_NAME,
    agent: getAgent(agentKey),
    sessionService,
  });
  runnerCache.set(agentKey, runner);
  return runner;
}

async function getSession(agentKey: AgentKey): Promise<Session> {
  const found = sessionCache.get(agentKey);
  if (found) return found;

  const session = await sessionService.createSession({
    appName: APP_NAME,
    userId: USER_ID,
  });
  sessionCache.set(agentKey, session);
  return session;
}

function collectText(event: Event): string {
  const textParts = event.content?.parts?.map(part => part.text ?? '').filter(Boolean) ?? [];
  return textParts.join('\n').trim();
}

export async function runAgent(agentKey: AgentKey, prompt: string): Promise<string> {
  const runner = getRunner(agentKey);
  const session = await getSession(agentKey);

  const events = await runner.runAsync({
    userId: USER_ID,
    sessionId: session.id,
    newMessage: {
      role: 'user',
      parts: [{ text: prompt }],
    },
  });

  let finalText = '';
  for await (const event of events) {
    if (isFinalResponse(event)) {
      const txt = collectText(event);
      if (txt) finalText = txt;
    }
  }

  return finalText;
}

function normalizeText(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
    return trimmed.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  }
  return trimmed;
}

export function parseJsonSafe<T>(raw: string): { ok: true; value: T } | { ok: false; error: string } {
  try {
    const value = JSON.parse(normalizeText(raw)) as T;
    return { ok: true, value };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to parse JSON output';
    return { ok: false, error: message };
  }
}

export type { AgentKey };
