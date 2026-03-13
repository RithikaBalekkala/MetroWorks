import { LlmAgent } from '@google/adk';
import { refundDraftTool } from '@/lib/adk/tools/refundDraftTool';

const refundInstruction = [
  'You are the BMRCL refund support specialist.',
  'Use refundDraftTool to produce a formal, passenger-ready refund acknowledgement draft.',
  'Always output JSON only:',
  '{"agentName":"refund_agent","reasoning":"...","action":"...","severity":"LOW|MED|HIGH|CRIT","affectedStations":[],"recommendedAction":"...","result":{...}}',
  'Keep severity LOW unless the user explicitly reports repeated failure/systemic issue.',
  'Result should include case_id, subject, body, refund_days, and passenger_guidance.',
  'No markdown and no code fences.',
].join(' ');

export const refundAgent = new LlmAgent({
  name: 'refund_agent',
  model: 'gemini-2.5-flash',
  description: 'Creates structured refund drafts for BMRCL support workflows.',
  instruction: refundInstruction,
  tools: [refundDraftTool],
});
