'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useTranslation } from '@/lib/i18n-context';
import { useAuth } from '@/lib/auth-context';
import { useWallet, type Transaction } from '@/lib/wallet-context';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  X,
  CreditCard,
  IndianRupee,
  Clock,
  Check,
} from 'lucide-react';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TransactionBadge({ type }: { type: Transaction['type'] }) {
  const config = {
    CREDIT: { bg: 'bg-green-100', text: 'text-green-700', icon: ArrowDownLeft, label: 'Credit' },
    DEBIT: { bg: 'bg-red-100', text: 'text-red-700', icon: ArrowUpRight, label: 'Debit' },
    REFUND: { bg: 'bg-blue-100', text: 'text-blue-700', icon: RotateCcw, label: 'Refund' },
  }[type];

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

const QUICK_AMOUNTS = [100, 200, 500, 1000];

export default function WalletPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const { balance, transactions, addMoney } = useWallet();

  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  const handleAddMoney = async () => {
    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    addMoney(numAmount);
    setProcessing(false);
    setSuccess(true);
    
    setTimeout(() => {
      setSuccess(false);
      setShowAddModal(false);
      setAmount('');
    }, 1500);
  };

  if (authLoading || !user) {
    return (
      <AppShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#7B2D8B] border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-[#7B2D8B]" />
            {t('wallet.title')}
          </h1>
          <p className="text-gray-500 mt-2">Manage your BMRCL wallet balance</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-[#7B2D8B] via-purple-700 to-[#00A550] rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-white/80 text-sm uppercase tracking-wider mb-1">{t('wallet.balance')}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-bold">₹{balance.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-white/60 text-sm mt-2">
                {user.name} • BMRCL Metro Card
              </p>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#7B2D8B] font-semibold rounded-xl hover:bg-white/90 transition shadow-lg"
            >
              <Plus className="w-5 h-5" />
              {t('wallet.addMoney')}
            </button>
          </div>

          {/* Card Design Element */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-white/80" />
                <span className="text-white/80 font-mono text-sm">•••• •••• •••• {user.phone?.slice(-4) || '0000'}</span>
              </div>
              <span className="text-white/60 text-xs">BMRCL E-Wallet</span>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{t('wallet.history')}</h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-1">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map(txn => (
                <div key={txn.id} className="p-4 sm:p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <TransactionBadge type={txn.type} />
                      </div>
                      <p className="font-medium text-gray-900 truncate">{txn.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(txn.timestamp)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        txn.type === 'DEBIT' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {txn.type === 'DEBIT' ? '-' : '+'}₹{txn.amount}
                      </p>
                      <p className="text-xs text-gray-400">Bal: ₹{txn.balanceAfter}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-xl p-4 shadow">
            <p className="text-xs text-gray-500 uppercase">Total Added</p>
            <p className="text-lg font-bold text-green-600">
              ₹{transactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <p className="text-xs text-gray-500 uppercase">Total Spent</p>
            <p className="text-lg font-bold text-red-600">
              ₹{transactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <p className="text-xs text-gray-500 uppercase">Refunded</p>
            <p className="text-lg font-bold text-blue-600">
              ₹{transactions.filter(t => t.type === 'REFUND').reduce((sum, t) => sum + t.amount, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Money Added!</h3>
                <p className="text-gray-500">₹{amount} has been added to your wallet</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">{t('wallet.addMoney')}</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Amount Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">₹</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full pl-12 pr-4 py-4 text-3xl font-bold text-center border-2 border-gray-200 rounded-xl focus:border-[#7B2D8B] focus:ring-2 focus:ring-[#7B2D8B]/20 outline-none"
                    />
                  </div>
                </div>

                {/* Quick Amounts */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {QUICK_AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setAmount(amt.toString())}
                      className={`py-3 rounded-lg font-semibold transition ${
                        amount === amt.toString()
                          ? 'bg-[#7B2D8B] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {/* Payment Method (simulated) */}
                <div className="p-4 bg-gray-50 rounded-xl mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow">
                      <IndianRupee className="w-5 h-5 text-[#00A550]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">UPI Payment</p>
                      <p className="text-sm text-gray-500">Pay via any UPI app</p>
                    </div>
                  </div>
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAddMoney}
                  disabled={!amount || parseInt(amount) <= 0 || processing}
                  className="w-full py-4 bg-[#7B2D8B] text-white font-semibold rounded-xl hover:bg-[#6a2679] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Add ₹{amount || '0'} to Wallet
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
