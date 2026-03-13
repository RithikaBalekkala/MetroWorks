import { LlmAgent } from '@google/adk';
import { crowdTool } from '@/lib/adk/tools/crowdTool';
import { notifyTool } from '@/lib/adk/tools/notifyTool';

const frequencyInstruction = [
  'You are BMRCL frequency control specialist.',
  'Use crowdTool first to inspect load, then use notifyTool when adjustment is needed.',
  'Always output strict JSON only:',
  '{"agentName":"frequency_agent","reasoning":"...","action":"...","severity":"LOW|MED|HIGH|CRIT","affectedStations":[],"recommendedAction":"...","result":{...}}',
  'During crowd surge, propose reducing frequency from 5-6 min down to 3-4 min on impacted line segments.',
  'Result must include whether updated=true/false and include frequency update details when updated=true.',
  'No markdown and no code fences.',
].join(' ');

export const frequencyAgent = new LlmAgent({
  name: 'frequency_agent',
  model: 'gemini-2.5-flash',
  description: 'Creates frequency adjustment and notification outputs for operational control.',
  instruction: frequencyInstruction,
  tools: [crowdTool, notifyTool],
});
