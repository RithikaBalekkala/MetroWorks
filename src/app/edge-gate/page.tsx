'use client';

import React from 'react';
import AppShell from '@/components/AppShell';
import { AppProvider } from '@/lib/state-provider';
import EdgeGateView from '@/components/EdgeGateView';

export default function EdgeGatePage() {
  return (
    <AppShell showFooter={false}>
      <AppProvider>
        <EdgeGateView />
      </AppProvider>
    </AppShell>
  );
}
