import { runAgent } from '@/lib/adk/runner';

function getApiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

function isAdkEnabled(): boolean {
  const key = getApiKey();
  return typeof key === 'string' && key.length > 0;
}

export async function runWithFallback(
  agentKey: Parameters<typeof runAgent>[0],
  prompt: string,
  fallback: string
): Promise<string> {
  const key = getApiKey();
  if (!process.env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = key;
  if (!process.env.GOOGLE_API_KEY) process.env.GOOGLE_API_KEY = key;

  if (!isAdkEnabled()) return fallback;

  try {
    const result = await runAgent(agentKey, prompt);
    return result || fallback;
  } catch {
    return fallback;
  }
}
