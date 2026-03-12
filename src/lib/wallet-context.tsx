'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export type TransactionType = 'DEBIT' | 'CREDIT' | 'REFUND';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  balanceAfter: number;
  timestamp: string;
}

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  addMoney: (amount: number) => void;
  debit: (amount: number, description: string) => boolean;
  refund: (amount: number, description: string) => void;
  canAfford: (amount: number) => boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Storage Keys
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const WALLET_KEY = 'bmrcl_wallet';
const TRANSACTIONS_KEY = 'bmrcl_transactions';
const INITIAL_BALANCE = 200;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Context
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedBalance = localStorage.getItem(WALLET_KEY);
      const storedTransactions = localStorage.getItem(TRANSACTIONS_KEY);

      if (storedBalance !== null) {
        setBalance(parseFloat(storedBalance));
      } else {
        // Initialize with default balance
        localStorage.setItem(WALLET_KEY, INITIAL_BALANCE.toString());
      }

      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions) as Transaction[]);
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    }
  }, []);

  // Persist balance changes
  const updateBalance = useCallback((newBalance: number) => {
    setBalance(newBalance);
    localStorage.setItem(WALLET_KEY, newBalance.toString());
  }, []);

  // Persist transactions
  const addTransaction = useCallback((txn: Transaction) => {
    setTransactions(prev => {
      const updated = [txn, ...prev];
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addMoney = useCallback((amount: number) => {
    const newBalance = balance + amount;
    updateBalance(newBalance);

    addTransaction({
      id: generateTransactionId(),
      type: 'CREDIT',
      amount,
      description: 'Wallet Top-up',
      balanceAfter: newBalance,
      timestamp: new Date().toISOString(),
    });
  }, [balance, updateBalance, addTransaction]);

  const debit = useCallback((amount: number, description: string): boolean => {
    if (amount > balance) {
      return false; // Insufficient balance
    }

    const newBalance = balance - amount;
    updateBalance(newBalance);

    addTransaction({
      id: generateTransactionId(),
      type: 'DEBIT',
      amount,
      description,
      balanceAfter: newBalance,
      timestamp: new Date().toISOString(),
    });

    return true;
  }, [balance, updateBalance, addTransaction]);

  const refund = useCallback((amount: number, description: string) => {
    const newBalance = balance + amount;
    updateBalance(newBalance);

    addTransaction({
      id: generateTransactionId(),
      type: 'REFUND',
      amount,
      description,
      balanceAfter: newBalance,
      timestamp: new Date().toISOString(),
    });
  }, [balance, updateBalance, addTransaction]);

  const canAfford = useCallback((amount: number): boolean => {
    return balance >= amount;
  }, [balance]);

  return (
    <WalletContext.Provider value={{ balance, transactions, addMoney, debit, refund, canAfford }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
