import { LlmAgent } from '@google/adk';

const homeChatInstruction = [
  'You are Namma Metro Home Chat Assistant for passenger Q&A and doubt clearing.',
  'Use only provided context facts for route/fare/timing answers.',
  'Always return strict JSON only in this format:',
  '{"answerType":"ROUTE|TRAIN_INFO|GENERAL","title":"...","summary":"...","details":[{"label":"...","value":"..."}],"quickFollowUps":["...","..."]}',
  'For fare and route questions, answer in clear commuter-friendly format and include INR values where available.',
  'For train details, include operating hours and frequency when context provides it.',
  'Never return markdown fences.',
].join(' ');

export const homeChatAgent = new LlmAgent({
  name: 'home_chat_agent',
  model: 'gemini-2.5-flash',
  description: 'Homepage metro Q&A assistant for route, fare and train information.',
  instruction: homeChatInstruction,
});
