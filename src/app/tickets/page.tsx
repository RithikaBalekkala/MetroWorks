'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import AppShell from '@/components/AppShell';
import { useTranslation } from '@/lib/i18n-context';
import { useAuth } from '@/lib/auth-context';
import { useWallet } from '@/lib/wallet-context';
import { useBooking, type Ticket, type TicketStatus } from '@/lib/booking-context';
import {
  Ticket as TicketIcon,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  X,
  Edit,
  Check,
  ChevronDown,
  ChevronUp,
  QrCode,
} from 'lucide-react';

function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}

function getStatusColor(status: TicketStatus): string {
  switch (status) {
    case 'ACTIVE': return 'bg-green-100 text-green-700';
    case 'SCANNED': return 'bg-blue-100 text-blue-700';
    case 'EXPIRED': return 'bg-gray-100 text-gray-700';
    case 'CANCELLED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

interface TicketCardProps {
  ticket: Ticket;
  onCancel: (id: string) => void;
  onModify: (id: string) => void;
  onMarkScanned: (id: string) => void;
}

function TicketCard({ ticket, onCancel, onModify, onMarkScanned }: TicketCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(ticket.status === 'ACTIVE');
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(ticket.expiresAt));

  // Update countdown every minute
  useEffect(() => {
    if (ticket.status !== 'ACTIVE') return;

    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(ticket.expiresAt));
    }, 60000);

    return () => clearInterval(interval);
  }, [ticket.status, ticket.expiresAt]);

  const isExpired = new Date(ticket.expiresAt) < new Date();
  const isActive = ticket.status === 'ACTIVE' && !isExpired;

  // QR code data
  const qrData = JSON.stringify({
    id: ticket.id,
    from: ticket.fromStation,
    to: ticket.toStation,
    platform: ticket.platform,
    date: ticket.date,
    time: ticket.time,
    passengers: ticket.passengers,
    fare: ticket.totalFare,
    hmac: ticket.hmacSignature,
  });

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden transition ${
      !isActive ? 'opacity-75' : ''
    }`}>
      {/* Header */}
      <div
        className={`p-4 cursor-pointer ${
          isActive ? 'bg-gradient-to-r from-[#7B2D8B] to-purple-700' : 'bg-gray-400'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <TicketIcon className="w-5 h-5" />
            <div>
              <p className="font-semibold">{ticket.fromStation} → {ticket.toStation}</p>
              <p className="text-sm text-white/80">{ticket.date} • {ticket.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
              {ticket.status}
            </span>
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* QR Code */}
            <div className={`flex-shrink-0 relative ${!isActive ? 'grayscale' : ''}`}>
              <div className="p-4 bg-white border-2 border-gray-200 rounded-xl inline-block">
                <QRCodeSVG
                  value={qrData}
                  size={160}
                  level="H"
                  includeMargin
                  fgColor={isActive ? '#7B2D8B' : '#9CA3AF'}
                />
              </div>
              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                  <span className="text-white font-bold text-xl transform -rotate-12">
                    {ticket.status === 'CANCELLED' ? 'CANCELLED' : ticket.status === 'SCANNED' ? 'SCANNED' : 'EXPIRED'}
                  </span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">{t('ticket.platform')}</p>
                  <p className="font-semibold text-lg">Platform {ticket.platform}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">{t('ticket.doorSide')}</p>
                  <p className="font-semibold text-lg">{ticket.doorSide}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">{t('ticket.passengers')}</p>
                  <p className="font-semibold text-lg">{ticket.passengers}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total Fare</p>
                  <p className="font-semibold text-lg text-[#7B2D8B]">₹{ticket.totalFare}</p>
                </div>
              </div>

              {/* Countdown */}
              {isActive && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg mb-4">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {t('ticket.validFor')}: {timeRemaining}
                  </span>
                </div>
              )}

              {/* Route */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase mb-2">Route ({ticket.duration} mins)</p>
                <div className="flex flex-wrap gap-1">
                  {ticket.route.slice(0, 5).map((station, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {station}
                    </span>
                  ))}
                  {ticket.route.length > 5 && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      +{ticket.route.length - 5} more
                    </span>
                  )}
                </div>
              </div>

              {/* Actions (only for active unscanned tickets) */}
              {isActive && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => onModify(ticket.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    {t('ticket.modify')}
                  </button>
                  <button
                    onClick={() => onCancel(ticket.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    {t('ticket.cancel')}
                  </button>
                  {/* Demo: Mark as scanned */}
                  <button
                    onClick={() => onMarkScanned(ticket.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                  >
                    <Check className="w-4 h-4" />
                    Mark Scanned (Demo)
                  </button>
                </div>
              )}

              {/* Ticket ID */}
              <p className="mt-4 text-xs text-gray-400 font-mono">
                ID: {ticket.id}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TicketsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const { refund } = useWallet();
  const { tickets, cancelTicket, markAsScanned } = useBooking();

  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [showModifyModal, setShowModifyModal] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  const handleCancel = (ticketId: string) => {
    const refundAmount = cancelTicket(ticketId);
    if (refundAmount > 0) {
      const ticket = tickets.find(t => t.id === ticketId);
      refund(refundAmount, `Ticket Cancellation: ${ticket?.fromStation} → ${ticket?.toStation}`);
    }
    setShowCancelModal(null);
  };

  const handleModify = (ticketId: string) => {
    // For demo, just show a message. Full implementation would open a modal
    // with pre-filled journey planner
    alert('Modify functionality: In production, this would open a modal to change date/time/passengers');
    setShowModifyModal(null);
  };

  const handleMarkScanned = (ticketId: string) => {
    markAsScanned(ticketId);
  };

  const ticketToCancel = tickets.find(t => t.id === showCancelModal);

  if (authLoading || !user) {
    return (
      <AppShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#7B2D8B] border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  const activeTickets = tickets.filter(t => t.status === 'ACTIVE');
  const pastTickets = tickets.filter(t => t.status !== 'ACTIVE');

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <QrCode className="w-8 h-8 text-[#7B2D8B]" />
            {t('ticket.title')}
          </h1>
          <p className="text-gray-500 mt-2">View and manage your metro tickets</p>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <TicketIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No tickets yet</h2>
            <p className="text-gray-500 mb-6">Book your first journey to see your tickets here</p>
            <button
              onClick={() => router.push('/booking')}
              className="px-6 py-3 bg-[#7B2D8B] text-white font-semibold rounded-xl hover:bg-[#6a2679] transition"
            >
              Book a Trip
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Tickets */}
            {activeTickets.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Active Tickets ({activeTickets.length})
                </h2>
                <div className="space-y-4">
                  {activeTickets.map(ticket => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onCancel={() => setShowCancelModal(ticket.id)}
                      onModify={() => setShowModifyModal(ticket.id)}
                      onMarkScanned={handleMarkScanned}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Tickets */}
            {pastTickets.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Past Tickets ({pastTickets.length})
                </h2>
                <div className="space-y-4">
                  {pastTickets.map(ticket => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onCancel={() => {}}
                      onModify={() => {}}
                      onMarkScanned={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && ticketToCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('ticket.cancelConfirm')}</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <p className="font-medium">{ticketToCancel.fromStation} → {ticketToCancel.toStation}</p>
              <p className="text-sm text-gray-500">{ticketToCancel.date} • {ticketToCancel.passengers} passenger(s)</p>
              
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('ticket.refund')} Amount:</span>
                <span className="font-bold text-green-600">
                  ₹{(() => {
                    const travelTime = new Date(`${ticketToCancel.date}T${ticketToCancel.time}`);
                    const now = new Date();
                    const hoursUntilTravel = (travelTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                    const refundPercent = hoursUntilTravel > 2 ? 1.0 : 0.5;
                    return Math.round(ticketToCancel.totalFare * refundPercent);
                  })()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {(() => {
                  const travelTime = new Date(`${ticketToCancel.date}T${ticketToCancel.time}`);
                  const now = new Date();
                  const hoursUntilTravel = (travelTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                  return hoursUntilTravel > 2 
                    ? '100% refund (more than 2 hours before travel)' 
                    : '50% refund (less than 2 hours before travel)';
                })()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
              >
                Keep Ticket
              </button>
              <button
                onClick={() => handleCancel(showCancelModal)}
                className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition"
              >
                Cancel & Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
