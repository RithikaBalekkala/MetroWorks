'use client';

import React from 'react';
import AppShell from '@/components/AppShell';
import { AppProvider } from '@/lib/state-provider';
import CommuterView from '@/components/CommuterView';

export default function CommuterPage() {
  return (
    <AppShell showFooter={false}>
      <AppProvider>
        <CommuterView />
      </AppProvider>
    </AppShell>
  );
}
