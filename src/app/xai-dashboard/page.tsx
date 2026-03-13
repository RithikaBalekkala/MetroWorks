'use client';

import React from 'react';
import AppShell from '@/components/AppShell';
import { AppProvider } from '@/lib/state-provider';
import OperatorDashboard from '@/components/OperatorDashboard';

export default function XaiDashboardPage() {
  return (
    <AppShell showFooter={false}>
      <AppProvider>
        <OperatorDashboard />
      </AppProvider>
    </AppShell>
  );
}
