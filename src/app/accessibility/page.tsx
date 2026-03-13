import React from 'react';
import InfoPage from '@/components/InfoPage';

export default function AccessibilityPage() {
  return (
    <InfoPage
      title="Accessibility"
      description="The platform is designed for inclusive use with readable contrast, keyboard support, and mobile responsiveness."
      points={[
        'High-contrast text on light backgrounds for readability.',
        'Keyboard-navigable controls for forms and menus.',
        'Responsive layouts optimized for phone and desktop screens.',
      ]}
    />
  );
}
