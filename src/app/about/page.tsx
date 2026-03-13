import React from 'react';
import InfoPage from '@/components/InfoPage';

export default function AboutPage() {
  return (
    <InfoPage
      title="About BMRCL Platform"
      description="This digital platform unifies commuter booking and operator intelligence for Namma Metro services."
      points={[
        'Commuter-first booking, ticketing, wallet, and notifications.',
        'Edge validation powered by secure ticket signatures and replay detection.',
        'Operational intelligence with time-travel event replay and XAI insights.',
      ]}
    />
  );
}
