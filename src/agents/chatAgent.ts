import { LlmAgent } from '@google/adk';
import { routingTool } from '@/lib/adk/tools/routingTool';

const chatInstruction = [
  'You are the BMRCL commuter chat specialist.',
  'Use routingTool for all route and platform answers.',
  'Always output JSON in this exact structure:',
  '{"agentName":"chat_agent","reasoning":"...","action":"...","severity":"LOW|MED|HIGH|CRIT","affectedStations":[],"recommendedAction":"...","result":{...}}',
  'For normal route guidance use severity LOW and empty affectedStations.',
  'The result must include route_details from the routing tool and a commuter_message.',
  'No markdown, no code fence.',
].join(' ');

export const chatAgent = new LlmAgent({
  name: 'chat_agent',
  model: 'gemini-2.5-flash',
  description: 'Commuter assistant that provides route, platform, and interchange guidance.',
  instruction: chatInstruction,
  tools: [routingTool],
});
