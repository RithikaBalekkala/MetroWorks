'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useTranslation } from '@/lib/i18n-context';
import { useAuth } from '@/lib/auth-context';
import { useWallet } from '@/lib/wallet-context';
import { useBooking } from '@/lib/booking-context';
import { useNotifications } from '@/lib/notification-service';
import {
  User,
  CreditCard,
  Ticket,
  History,
  Wallet,
  Bell,
  ChevronRight,
  Train,
  X,
  Check,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const { balance } = useWallet();
  const { tickets } = useBooking();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <AppShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#7B2D8B] border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  const activeTickets = tickets.filter(t => t.status === 'ACTIVE').length;

  const quickActions = [
    {
      key: 'bookTrip',
      icon: Train,
      label: t('dashboard.bookTrip'),
      href: '/booking',
      color: 'bg-[#7B2D8B]',
    },
    {
      key: 'myTickets',
      icon: Ticket,
      label: t('dashboard.myTickets'),
      href: '/tickets',
      color: 'bg-[#00A550]',
      badge: activeTickets > 0 ? activeTickets : undefined,
    },
    {
      key: 'eWallet',
      icon: Wallet,
      label: t('dashboard.eWallet'),
      href: '/wallet',
      color: 'bg-blue-600',
    },
    {
      key: 'tripHistory',
      icon: History,
      label: t('dashboard.tripHistory'),
      href: '/tickets',
      color: 'bg-orange-500',
    },
  ];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with notification bell */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t('dashboard.welcome')}, {user.name.split(' ')[0]}!
            </h1>
            <p className="text-gray-500 mt-1">Manage your metro journeys</p>
          </div>
          
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition"
            >
              <Bell className="w-6 h-6 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 max-h-96 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">{t('notifications.title')}</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-[#7B2D8B] hover:underline"
                      >
                        {t('notifications.markAllRead')}
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto max-h-72">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      {t('notifications.empty')}
                    </div>
                  ) : (
                    notifications.slice(0, 10).map(notif => (
                      <button
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition ${
                          !notif.read ? 'bg-purple-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            !notif.read ? 'bg-[#7B2D8B]' : 'bg-gray-300'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900">{notif.title}</p>
                            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notif.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#7B2D8B] to-[#00A550] rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-500">{user.email}</p>
                <p className="text-gray-500">{user.phone}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 text-sm">
                <CreditCard className="w-5 h-5 text-[#7B2D8B]" />
                <span className="text-gray-600">{t('dashboard.metroCard')}</span>
                <span className="font-mono font-bold text-gray-900">{user.metroCardNumber}</span>
              </div>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-gradient-to-br from-[#7B2D8B] to-purple-900 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Wallet className="w-6 h-6" />
              <span className="text-white/80">{t('dashboard.walletBalance')}</span>
            </div>
            <p className="text-4xl font-black">₹{balance.toFixed(2)}</p>
            <Link
              href="/wallet"
              className="mt-4 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition"
            >
              Add money <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map(action => (
              <Link
                key={action.key}
                href={action.href}
                className="relative bg-white rounded-xl shadow-lg hover:shadow-xl p-6 transition group"
              >
                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-gray-900">{action.label}</p>
                {action.badge && (
                  <span className="absolute top-4 right-4 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {action.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Tickets */}
        {tickets.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
              <Link href="/tickets" className="text-sm text-[#7B2D8B] hover:underline">
                View all
              </Link>
            </div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {tickets.slice(0, 3).map(ticket => (
                <Link
                  key={ticket.id}
                  href="/tickets"
                  className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      ticket.status === 'ACTIVE' ? 'bg-green-100 text-green-600' :
                      ticket.status === 'SCANNED' ? 'bg-blue-100 text-blue-600' :
                      ticket.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {ticket.status === 'SCANNED' ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Ticket className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {ticket.fromStation} → {ticket.toStation}
                      </p>
                      <p className="text-sm text-gray-500">
                        {ticket.date} • {ticket.passengers} passenger{ticket.passengers > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{ticket.totalFare}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      ticket.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      ticket.status === 'SCANNED' ? 'bg-blue-100 text-blue-700' :
                      ticket.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
