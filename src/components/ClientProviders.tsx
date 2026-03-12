'use client';

import React, { type ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n-context';
import { AuthProvider } from '@/lib/auth-context';
import { WalletProvider } from '@/lib/wallet-context';
import { BookingProvider } from '@/lib/booking-context';

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <I18nProvider>
      <AuthProvider>
        <WalletProvider>
          <BookingProvider>
            {children}
          </BookingProvider>
        </WalletProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
