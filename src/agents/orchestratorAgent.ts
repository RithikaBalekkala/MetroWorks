import { LlmAgent } from '@google/adk';
import { chatAgent } from '@/agents/chatAgent';
import { crowdAgent } from '@/agents/crowdAgent';
import { frequencyAgent } from '@/agents/frequencyAgent';
import { placesAgent } from '@/agents/placesAgent';
import { refundAgent } from '@/agents/refundAgent';
import type { AmenityCategory } from '@/lib/metro-network';

export const AMENITY_KEYWORDS = [
  'hospital', 'doctor', 'medical', 'clinic', 'emergency',
  'hotel', 'stay', 'accommodation', 'lodge',
  'college', 'university', 'school', 'education',
  'mall', 'shopping', 'shop', 'market',
  'tourist', 'tourism', 'visit', 'landmark', 'park',
  'tech park', 'it park', 'office', 'company',
  'railway', 'train station', 'bus stand', 'ksrtc',
  'government', 'court', 'secretariat',
  'nearby', 'near', 'close to', 'around', 'walking distance',
  'what is near', 'what\'s near', 'facilities',
] as const;

export function detectAmenityCategoryFromMessage(message: string): AmenityCategory | null {
  const text = message.toLowerCase();

  if (/hospital|doctor|medical|clinic|emergency/.test(text)) return 'HOSPITALS';
  if (/college|university|school|education|iisc/.test(text)) return 'EDUCATION';
  if (/hotel|stay|accommodation|lodge/.test(text)) return 'HOTELS';
  if (/mall|shopping|shop|market/.test(text)) return 'MALLS';
  if (/tourist|tourism|visit|landmark|park/.test(text)) return 'TOURISM';
  if (/tech park|it park|office|company|itpl|electronic city/.test(text)) return 'TECH_PARKS';
  if (/railway|train station/.test(text)) return 'RAILWAY';
  if (/bus stand|ksrtc|bus terminal/.test(text)) return 'BUS_TERMINAL';
  if (/airport/.test(text)) return 'AIRPORT_CONNECT';
  if (/government|court|secretariat|vidhana/.test(text)) return 'GOVERNMENT';

  return null;
}

export function shouldRouteToPlacesForAmenity(message: string): boolean {
  const text = message.toLowerCase();
  return AMENITY_KEYWORDS.some(keyword => text.includes(keyword));
}

const orchestratorInstruction = [
  'You are BMRCL Orchestrator Agent for a Bengaluru Metro demo system.',
  'Choose the right specialist agent and return concise JSON-only outputs.',
  'Routing and metro guidance -> chatAgent.',
  'Refund email drafting -> refundAgent.',
  'Nearby recommendations around station -> placesAgent.',
  'Amenity and nearby facility queries (hospitals, hotels, malls, education, tourism, tech parks, railway, bus terminal, government) -> placesAgent.',
  `Amenity keyword hints: ${AMENITY_KEYWORDS.join(', ')}.`,
  'If an amenity category is detectable from user text, include it in your output intent payload.',
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
