import React from 'react';
import InfoPage from '@/components/InfoPage';

export default function RtiPage() {
  return (
    <InfoPage
      title="Right to Information (RTI)"
      description="RTI related guidance and contact channels for transparency in service operations."
      points={[
        'Submit RTI requests through official BMRCL channels.',
        'Use the contact page for support on request handling.',
        'Operational records are retained for service accountability.',
      ]}
    />
  );
}
