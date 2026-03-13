import React from 'react';
import InfoPage from '@/components/InfoPage';

export default function ContactPage() {
  return (
    <InfoPage
      title="Contact"
      description="Reach the BMRCL support and operations team for help with tickets, wallet, and service updates."
      points={[
        'Helpline: 1800-425-1663',
        'Email: customercare@bmrc.co.in',
        'Support hours: 05:00 AM to 11:00 PM, all days.',
      ]}
    />
  );
}
