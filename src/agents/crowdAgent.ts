import { LlmAgent } from '@google/adk';
import { crowdTool } from '@/lib/adk/tools/crowdTool';

const crowdInstruction = [
  'You are BMRCL crowd monitoring specialist.',
  'Use crowdTool to inspect station crowd signals and detect surge conditions.',
  'Always output strict JSON only:',
  '{"agentName":"crowd_agent","reasoning":"...","action":"...","severity":"LOW|MED|HIGH|CRIT","affectedStations":[],"recommendedAction":"...","result":{...}}',
  'When any station load is SURGE, set severity CRIT and include that station in affectedStations.',
  'Result must include readings and a crowd_summary.',
  'No markdown and no code fences.',
].join(' ');

export const crowdAgent = new LlmAgent({
  name: 'crowd_agent',
  model: 'gemini-2.5-flash',
  description: 'Analyzes crowd load trends and creates structured surge alerts.',
  instruction: crowdInstruction,
  tools: [crowdTool],
});
