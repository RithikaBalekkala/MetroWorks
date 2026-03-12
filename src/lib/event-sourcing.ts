/**
 * Event Sourcing Engine — Time-Travel Replay for XAI Dashboard
 * =============================================================
 * Every state mutation is logged as an immutable event.
 * The "replay" slider seeks to any point in the event timeline
 * and deterministically reconstructs the dashboard state.
 */

export type EventType =
  | 'TAP_IN'
  | 'TAP_OUT'
  | 'CROWD_SURGE'
  | 'ANOMALY_DETECTED'
  | 'AI_REROUTE'
  | 'GATE_OFFLINE'
  | 'GATE_ONLINE'
  | 'BLOOM_FILTER_ALERT'
  | 'TRAIN_DELAY'
  | 'CAPACITY_SCALE';

export interface SystemEvent {
  id: string;
  timestamp: number;       // unix ms
  type: EventType;
  station: string;
  line: 'purple' | 'green';
  data: Record<string, unknown>;
  /** XAI reasoning string — natural-language explanation of the AI decision */
  xaiReasoning?: string;
}

export interface DashboardState {
  tapIns: number;
  tapOuts: number;
  activeGates: number;
  totalGates: number;
  crowdLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  alerts: SystemEvent[];
  telemetryHistory: { time: string; tapIns: number; tapOuts: number; crowd: number }[];
  bloomFilterFill: number;
  aiActions: SystemEvent[];
}

const INITIAL_STATE: DashboardState = {
  tapIns: 0,
  tapOuts: 0,
  activeGates: 24,
  totalGates: 24,
  crowdLevel: 'LOW',
  alerts: [],
  telemetryHistory: [],
  bloomFilterFill: 0,
  aiActions: [],
};

/** Deterministic state reducer — pure function, no side-effects */
export function reduceEvent(state: DashboardState, event: SystemEvent): DashboardState {
  const next = { ...state, alerts: [...state.alerts], telemetryHistory: [...state.telemetryHistory], aiActions: [...state.aiActions] };

  switch (event.type) {
    case 'TAP_IN':
      next.tapIns += 1;
      break;
    case 'TAP_OUT':
      next.tapOuts += 1;
      break;
    case 'CROWD_SURGE':
      next.crowdLevel = (event.data.level as DashboardState['crowdLevel']) || 'HIGH';
      next.alerts.push(event);
      break;
    case 'ANOMALY_DETECTED':
      next.alerts.push(event);
      break;
    case 'AI_REROUTE':
      next.aiActions.push(event);
      next.alerts.push(event);
      break;
    case 'GATE_OFFLINE':
      next.activeGates = Math.max(0, next.activeGates - 1);
      next.alerts.push(event);
      break;
    case 'GATE_ONLINE':
      next.activeGates = Math.min(next.totalGates, next.activeGates + 1);
      break;
    case 'BLOOM_FILTER_ALERT':
      next.bloomFilterFill = (event.data.fillRatio as number) || next.bloomFilterFill;
      next.alerts.push(event);
      break;
    case 'TRAIN_DELAY':
      next.alerts.push(event);
      break;
    case 'CAPACITY_SCALE':
      next.totalGates = (event.data.newCapacity as number) || next.totalGates;
      next.activeGates = next.totalGates;
      next.aiActions.push(event);
      break;
  }

  // Append to telemetry history every tap
  if (event.type === 'TAP_IN' || event.type === 'TAP_OUT') {
    const crowd = next.crowdLevel === 'CRITICAL' ? 95 : next.crowdLevel === 'HIGH' ? 75 : next.crowdLevel === 'MODERATE' ? 50 : 25;
    const timeStr = new Date(event.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    next.telemetryHistory.push({
      time: timeStr,
      tapIns: next.tapIns,
      tapOuts: next.tapOuts,
      crowd,
    });
    // Keep last 60 data points for the chart
    if (next.telemetryHistory.length > 60) {
      next.telemetryHistory = next.telemetryHistory.slice(-60);
    }
  }

  return next;
}

/** Replay all events up to a given index and return the state at that point */
export function replayToIndex(events: SystemEvent[], index: number): DashboardState {
  let state: DashboardState = { ...INITIAL_STATE, alerts: [], telemetryHistory: [], aiActions: [] };
  const end = Math.min(index + 1, events.length);
  for (let i = 0; i < end; i++) {
    state = reduceEvent(state, events[i]);
  }
  return state;
}

/** Generate a realistic stream of events simulating a morning rush hour at Majestic */
export function generateEventStream(durationMins: number = 30): SystemEvent[] {
  const events: SystemEvent[] = [];
  const baseTime = Date.now() - durationMins * 60 * 1000;
  let id = 0;

  const stations = [
    'Majestic', 'Indiranagar', 'Whitefield', 'Yeshwanthpur', 'Jayanagar',
    'MG Road', 'Silk Institute', 'Nagasandra', 'Cubbon Park', 'Peenya'
  ];
  const lines: ('purple' | 'green')[] = ['purple', 'green'];

  for (let min = 0; min < durationMins; min++) {
    const t = baseTime + min * 60 * 1000;
    const station = stations[Math.floor(Math.random() * stations.length)];
    const line = lines[Math.floor(Math.random() * 2)];

    // 3-8 tap-ins per minute (simulating rush hour variance)
    const tapInsThisMinute = 3 + Math.floor(Math.random() * 6);
    for (let j = 0; j < tapInsThisMinute; j++) {
      events.push({
        id: `evt-${++id}`,
        timestamp: t + j * 5000,
        type: 'TAP_IN',
        station,
        line,
        data: { gate: `G${1 + Math.floor(Math.random() * 6)}` },
      });
    }

    // 2-6 tap-outs per minute
    const tapOutsThisMinute = 2 + Math.floor(Math.random() * 5);
    for (let j = 0; j < tapOutsThisMinute; j++) {
      events.push({
        id: `evt-${++id}`,
        timestamp: t + 30000 + j * 5000,
        type: 'TAP_OUT',
        station,
        line,
        data: { gate: `G${1 + Math.floor(Math.random() * 6)}` },
      });
    }

    // Crowd surge at ~10 min and ~22 min
    if (min === 10) {
      events.push({
        id: `evt-${++id}`,
        timestamp: t,
        type: 'CROWD_SURGE',
        station: 'Majestic',
        line: 'purple',
        data: { level: 'HIGH', paxCount: 340 },
        xaiReasoning: 'Anomaly Detection Model (XGBoost) identified a 3.2σ deviation in tap-in rate at Majestic. Purple line inbound volume exceeds 95th percentile for this time window. Root cause: IT corridor shift change coinciding with delayed 8:47 AM service.',
      });
    }
    if (min === 22) {
      events.push({
        id: `evt-${++id}`,
        timestamp: t,
        type: 'CROWD_SURGE',
        station: 'Majestic',
        line: 'green',
        data: { level: 'CRITICAL', paxCount: 580 },
        xaiReasoning: 'CRITICAL: Crowd density at Majestic Green Line platform exceeds safe threshold (580 pax vs 400 pax capacity). LSTM forecast predicts sustained inflow for next 12 minutes. Probability of platform overcrowding: 89.3%.',
      });
    }

    // AI reroute at min 12
    if (min === 12) {
      events.push({
        id: `evt-${++id}`,
        timestamp: t,
        type: 'AI_REROUTE',
        station: 'Majestic',
        line: 'purple',
        data: { action: 'OPEN_ADDITIONAL_GATES', gates: ['G7', 'G8'] },
        xaiReasoning: 'Reinforcement Learning agent (PPO policy) evaluated 14 action candidates. Selected "Open Emergency Gates G7-G8" with expected reward +0.87. Alternative "Divert to Chickpete" rejected: estimated delay +4.2 min, passenger dissatisfaction score 0.73.',
      });
    }

    // Capacity scale at min 15
    if (min === 15) {
      events.push({
        id: `evt-${++id}`,
        timestamp: t,
        type: 'CAPACITY_SCALE',
        station: 'Majestic',
        line: 'purple',
        data: { newCapacity: 32, reason: 'AI auto-scale' },
        xaiReasoning: 'Auto-scaling ticketing infrastructure: Provisioning 8 additional virtual gates (24→32). Decision based on queuing theory model (M/M/c): current λ=12.4 pax/min, μ=0.6 pax/min/gate. Target wait time <90s requires c≥31 gates.',
      });
    }

    // Anomaly at min 18
    if (min === 18) {
      events.push({
        id: `evt-${++id}`,
        timestamp: t,
        type: 'ANOMALY_DETECTED',
        station: 'Indiranagar',
        line: 'purple',
        data: { anomalyType: 'FARE_EVASION_CLUSTER', confidence: 0.94 },
        xaiReasoning: 'Isolation Forest model detected a cluster of 7 anomalous tap-out events at Indiranagar within 180s window. Pattern: valid tap-in at Whitefield, but tap-out timing inconsistent with minimum travel time (observed 8 min vs expected 42 min). Confidence: 94%. Flagged for review.',
      });
    }

    // Gate offline at min 20
    if (min === 20) {
      events.push({
        id: `evt-${++id}`,
        timestamp: t,
        type: 'GATE_OFFLINE',
        station: 'Yeshwanthpur',
        line: 'green',
        data: { gate: 'G3', reason: 'NFC reader malfunction' },
        xaiReasoning: 'Edge node G3 at Yeshwanthpur reported 12 consecutive NFC read failures. Predictive maintenance model (Random Forest) estimates hardware failure probability: 97.1%. Auto-routing passengers to gates G1, G2, G4.',
      });
    }

    // Train delay at min 25
    if (min === 25) {
      events.push({
        id: `evt-${++id}`,
        timestamp: t,
        type: 'TRAIN_DELAY',
        station: 'Whitefield',
        line: 'purple',
        data: { delayMins: 4, trainId: 'PL-047' },
        xaiReasoning: 'Train PL-047 delayed by 4 minutes at Whitefield. Causal analysis: door sensor fault at Mahadevapura caused 90s dwell time extension. Cascading delay propagation model estimates 2.1 min average delay across 3 downstream services.',
      });
    }

    // Bloom filter alert at min 26
    if (min === 26) {
      events.push({
        id: `evt-${++id}`,
        timestamp: t,
        type: 'BLOOM_FILTER_ALERT',
        station: 'MG Road',
        line: 'purple',
        data: { fillRatio: 0.42, ticketsProcessed: 1847 },
        xaiReasoning: 'Edge Bloom Filter at MG Road reaching 42% capacity (1,847 tickets processed). False positive rate estimated at 0.8%. Scheduled rotation at 50% fill to maintain <1% FP guarantee.',
      });
    }
  }

  // Sort chronologically
  events.sort((a, b) => a.timestamp - b.timestamp);
  return events;
}
