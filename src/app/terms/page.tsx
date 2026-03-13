import React from 'react';
import InfoPage from '@/components/InfoPage';

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms and Conditions"
      description="These terms govern booking, cancellations, wallet usage, and digital ticket validation on the platform."
      points={[
        'Digital tickets are valid as per route and configured validity window.',
        'Wallet transactions are recorded with timestamps and audit traces.',
        'Cancellation and refund policies apply according to booking rules.',
      ]}
    />
  );
}
