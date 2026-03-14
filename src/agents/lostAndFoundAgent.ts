import { LlmAgent } from '@google/adk';
import {
  getLostFoundGuidance,
  inferLostItemCategory,
  type LostItemCategory,
} from '@/lib/lost-and-found';

export interface LostFoundAgentResponse {
  answerType: 'LOST_FOUND';
  stationName: string;
  category: LostItemCategory;
  caseIdTemplate: string;
  deskLocation: string;
  contactNumber: string;
  operatingHours: string;
  escalationOffice: string;
  etaForCallbackHours: number;
  nextSteps: string[];
  userQuery: string;
}

export function queryLostAndFoundAssistance(input: {
  userQuery: string;
  stationName?: string;
}): LostFoundAgentResponse {
  const category = inferLostItemCategory(input.userQuery);
  const guidance = getLostFoundGuidance({
    stationName: input.stationName,
    category,
    contextText: input.userQuery,
  });

  return {
    answerType: 'LOST_FOUND',
    stationName: guidance.stationName,
    category: guidance.category,
    caseIdTemplate: `${guidance.casePrefix}-${new Date().getFullYear()}-XXXX`,
    deskLocation: guidance.desk.deskLocation,
    contactNumber: guidance.desk.contactNumber,
    operatingHours: guidance.desk.operatingHours,
    escalationOffice: guidance.desk.escalationOffice,
    etaForCallbackHours: guidance.etaForCallbackHours,
    nextSteps: guidance.nextSteps,
    userQuery: input.userQuery,
  };
}

const lostAndFoundInstruction = [
  'You are BMRCL Lost and Found specialist.',
  'Help users report and recover items lost at stations or inside trains.',
  'Always return strict JSON only with this schema:',
  '{"agentName":"lost_and_found_agent","reasoning":"...","action":"...","severity":"LOW|MED|HIGH|CRIT","affectedStations":[],"recommendedAction":"...","result":{"answerType":"LOST_FOUND","stationName":"...","category":"BAG|MOBILE|WALLET|LAPTOP|DOCUMENTS|JEWELLERY|OTHER","caseIdTemplate":"...","deskLocation":"...","contactNumber":"...","operatingHours":"...","escalationOffice":"...","etaForCallbackHours":24,"nextSteps":["..."],"userQuery":"..."}}',
  'No markdown and no code fences.',
].join(' ');

export const lostAndFoundAgent = new LlmAgent({
  name: 'lost_and_found_agent',
  model: 'gemini-2.5-flash',
  description: 'Handles lost-item guidance and desk routing for metro passengers.',
  instruction: lostAndFoundInstruction,
});
