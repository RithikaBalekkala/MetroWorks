import { LlmAgent } from '@google/adk';
import { chatAgent } from '@/agents/chatAgent';
import { crowdAgent } from '@/agents/crowdAgent';
import { frequencyAgent } from '@/agents/frequencyAgent';
import { placesAgent } from '@/agents/placesAgent';
import { refundAgent } from '@/agents/refundAgent';

const orchestratorInstruction = [
  'You are BMRCL Orchestrator Agent for a Bengaluru Metro demo system.',
  'Choose the right specialist agent and return concise JSON-only outputs.',
  'Routing and metro guidance -> chatAgent.',
  'Refund email drafting -> refundAgent.',
  'Nearby recommendations around station -> placesAgent.',
  'Crowd prediction and surge monitoring -> crowdAgent.',
  'Frequency change + commuter notification -> frequencyAgent.',
  'Never include markdown fences.',
].join(' ');

export const orchestratorAgent = new LlmAgent({
  name: 'orchestrator_agent',
  model: 'gemini-2.5-flash',
  description: 'Routes intents to specialist metro agents for chat, refund, places, and crowd operations.',
  instruction: orchestratorInstruction,
  subAgents: [chatAgent, refundAgent, placesAgent, crowdAgent, frequencyAgent],
});
