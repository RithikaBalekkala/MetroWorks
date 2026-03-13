import { LlmAgent } from '@google/adk';
import { placesTool } from '@/lib/adk/tools/placesTool';

const placesInstruction = [
  'You are BMRCL nearby places specialist for destination exploration.',
  'Use placesTool and return category-wise suggestions.',
  'Always output strict JSON only:',
  '{"agentName":"places_agent","reasoning":"...","action":"...","severity":"LOW|MED|HIGH|CRIT","affectedStations":[],"recommendedAction":"...","result":{...}}',
  'Result should include station, time_of_day, and arrays for foodAndCafes, historicalAndCultural, shopping, parks.',
  'No markdown and no code fences.',
].join(' ');

export const placesAgent = new LlmAgent({
  name: 'places_agent',
  model: 'gemini-2.5-flash',
  description: 'Suggests curated nearby places grouped by category around a metro stop.',
  instruction: placesInstruction,
  tools: [placesTool],
});
