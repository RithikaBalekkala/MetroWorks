'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import AppShell from '@/components/AppShell';
import { useTranslation } from '@/lib/i18n-context';
import { useAuth } from '@/lib/auth-context';
import { useWallet } from '@/lib/wallet-context';
import { GREEN_LINE, PURPLE_LINE, analyseModification } from '@/lib/metro-network';
import {
  useBooking,
  type Ticket,
  type TicketStatus,
  buildBookingHmacPayload,
  signBookingPayload,
} from '@/lib/booking-context';
import type { ModificationAnalysis } from '@/types/modification';
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
  ArrowRight,
  Train,
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

type LineType = 'purple' | 'green' | 'interchange';
type DoorDisplaySide = 'LEFT' | 'RIGHT';

const purpleByName = new Map(PURPLE_LINE.map(st => [st.name.toLowerCase(), st]));
const greenByName = new Map(GREEN_LINE.map(st => [st.name.toLowerCase(), st]));

function normalizeStationName(name: string): string {
  return name.trim().toLowerCase();
}

function detectLineType(ticket: Ticket): LineType {
  const routeNames = ticket.route.map(normalizeStationName);
  const hasPurple = routeNames.some(name => purpleByName.has(name));
  const hasGreen = routeNames.some(name => greenByName.has(name));

  if (hasPurple && hasGreen) return 'interchange';
  return hasGreen ? 'green' : 'purple';
}

function getIndexOnLine(name: string, line: 'purple' | 'green'): number | null {
  const key = normalizeStationName(name);
  const station = line === 'purple' ? purpleByName.get(key) : greenByName.get(key);
  return typeof station?.index === 'number' ? station.index : null;
}

function getPrimaryLineForDirection(ticket: Ticket, lineType: LineType): 'purple' | 'green' {
  if (lineType !== 'interchange') return lineType;

  const fromKey = normalizeStationName(ticket.fromStation);
  const toKey = normalizeStationName(ticket.toStation);
  const fromInPurple = purpleByName.has(fromKey);
  const fromInGreen = greenByName.has(fromKey);
  const toInPurple = purpleByName.has(toKey);
  const toInGreen = greenByName.has(toKey);

  if (fromInPurple && !fromInGreen) return 'purple';
  if (fromInGreen && !fromInPurple) return 'green';
  if (toInPurple && !toInGreen) return 'purple';
  return 'green';
}

function getDirectionLabel(ticket: Ticket, line: 'purple' | 'green'): string {
  const fromIdx = getIndexOnLine(ticket.fromStation, line);
  const toIdx = getIndexOnLine(ticket.toStation, line);

  if (fromIdx !== null && toIdx !== null) {
    if (line === 'purple') {
      return toIdx >= fromIdx ? 'Eastbound' : 'Westbound';
    }
    return toIdx < fromIdx ? 'Northbound' : 'Southbound';
  }

  if (line === 'purple') return 'Eastbound';
  return 'Southbound';
}

function deriveDoorSide(ticket: Ticket, line: 'purple' | 'green', direction: string): DoorDisplaySide {
  const destinationIdx = getIndexOnLine(ticket.toStation, line);
  if (destinationIdx !== null) {
    return destinationIdx % 2 === 0 ? 'LEFT' : 'RIGHT';
  }

  if (line === 'purple') {
    return direction === 'Eastbound' ? 'RIGHT' : 'LEFT';
  }
  return direction === 'Northbound' ? 'LEFT' : 'RIGHT';
}

function getStopsCount(route: string[]): number {
  if (!route.length) return 0;
  return Math.max(route.length - 1, 0);
}

function isInterchangeDestination(stationName: string): boolean {
  const normalized = normalizeStationName(stationName);
  return normalized.includes('majestic') || normalized.includes('krishnarajapura');
}

function getCoachRecommendation(ticket: Ticket, direction: string): { coach: number; note: string } {
  const stops = getStopsCount(ticket.route);
  const directionForward = direction === 'Eastbound' || direction === 'Southbound';

  if (isInterchangeDestination(ticket.toStation)) {
    const coach = directionForward ? 6 : 1;
    return {
      coach,
      note: `Board from Coach ${coach} for fastest exit at your destination`,
    };
  }

  if (stops <= 5) {
    const coach = directionForward ? 6 : 1;
    return {
      coach,
      note: `Board from Coach ${coach} for fastest exit at your destination`,
    };
  }

  if (stops <= 12) {
    const coach = directionForward ? 4 : 3;
    return {
      coach,
      note: `Board from Coach ${coach} for fastest exit at your destination`,
    };
  }

  const coach = directionForward ? 5 : 2;
  return {
    coach,
    note: `Board from Coach ${coach} for fastest exit at your destination`,
  };
}

function getHeaderStripClasses(lineType: LineType): string {
  if (lineType === 'green') return 'bg-gradient-to-r from-[#00A550] to-[#006B34]';
  if (lineType === 'interchange') return 'bg-gradient-to-r from-[#7B2D8B] via-[#57509A] to-[#00A550]';
  return 'bg-gradient-to-r from-[#7B2D8B] to-[#4A1A6E]';
}

interface TicketCardProps {
  ticket: Ticket;
  onCancel: (id: string) => void;
  onModify: (id: string) => void;
  onMarkScanned: (id: string) => void;
  onDraftRefund: (ticket: Ticket) => void;
}

function formatINR(amount?: number | null): string {
  const safeAmount = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  return safeAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

function TicketCard({ ticket, onCancel, onModify, onMarkScanned, onDraftRefund }: TicketCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(ticket.status === 'ACTIVE');
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(ticket.expiresAt));
  const [qrRefreshNonce, setQrRefreshNonce] = useState(() => Date.now());
  const [qrRefreshCountdown, setQrRefreshCountdown] = useState(30);

  // Update countdown every minute
  useEffect(() => {
    if (ticket.status !== 'ACTIVE') return;

    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(ticket.expiresAt));
    }, 60000);

    return () => clearInterval(interval);
  }, [ticket.status, ticket.expiresAt]);

  // Keep QR visual payload rotating every 30 seconds for active tickets
  useEffect(() => {
    if (ticket.status !== 'ACTIVE') return;

    const refreshInterval = setInterval(() => {
      setQrRefreshNonce(Date.now());
      setQrRefreshCountdown(30);
    }, 30000);

    const countdownInterval = setInterval(() => {
      setQrRefreshCountdown(prev => (prev <= 1 ? 30 : prev - 1));
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [ticket.status]);

  const isExpired = new Date(ticket.expiresAt) < new Date();
  const isActive = ticket.status === 'ACTIVE' && !isExpired;
  const lineType = detectLineType(ticket);
  const primaryLine = getPrimaryLineForDirection(ticket, lineType);
  const directionLabel = getDirectionLabel(ticket, primaryLine);
  const doorDisplay = deriveDoorSide(ticket, primaryLine, directionLabel);
  const stopsCount = getStopsCount(ticket.route);
  const coachRecommendation = getCoachRecommendation(ticket, directionLabel);
  const [showHistory, setShowHistory] = useState(false);
  const maxModificationsReached = (ticket.modificationCount ?? 0) >= 3;

  // QR code data
  const qrPayload = buildBookingHmacPayload({
    id: ticket.id,
    from: ticket.fromStation,
    to: ticket.toStation,
    date: ticket.date,
    time: ticket.time,
    passengers: ticket.passengers,
    fare: ticket.totalFare,
    expires: ticket.expiresAt,
    refreshNonce: isActive ? String(qrRefreshNonce) : undefined,
  });

  const qrSignature = signBookingPayload(qrPayload);

  const qrData = JSON.stringify({
    id: ticket.id,
    from: ticket.fromStation,
    to: ticket.toStation,
    platform: ticket.platform,
    date: ticket.date,
    time: ticket.time,
    passengers: ticket.passengers,
    fare: ticket.totalFare,
    expires: ticket.expiresAt,
    hmac: qrSignature,
    refreshNonce: isActive ? String(qrRefreshNonce) : undefined,
  });

  return (
    <div className={`max-w-md md:max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden transition ${!isActive ? 'opacity-75' : ''}`}>
      <div className="h-1 w-full bg-gradient-to-r from-[#7B2D8B] to-[#00A550]" />

      <div
        className={`cursor-pointer px-4 py-3 ${getHeaderStripClasses(lineType)}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2">
            <Image
              src="/namma-metro-logo.png"
              alt="Namma Metro logo"
              width={16}
              height={16}
              className="h-4 w-4 object-contain"
            />
            <span className="font-bold text-sm">Namma Metro</span>
          </div>

          <div className="flex items-center gap-2">
            {lineType === 'interchange' ? (
              <div className="flex flex-col gap-1">
                <span className="px-2 py-0.5 rounded-full bg-purple-700 text-white text-[10px] font-semibold">● Purple Line</span>
                <span className="px-2 py-0.5 rounded-full bg-green-700 text-white text-[10px] font-semibold">● Green Line</span>
              </div>
            ) : (
              <span className={`px-2 py-1 rounded-full text-white text-[10px] font-semibold ${lineType === 'purple' ? 'bg-purple-700' : 'bg-green-700'}`}>
                ● {lineType === 'purple' ? 'Purple Line' : 'Green Line'}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
              {ticket.status}
            </span>
            {(ticket.modificationCount ?? 0) > 0 && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                ✏️ Modified
              </span>
            )}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_220px] gap-4 md:gap-6 items-stretch">
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 px-4 py-4 bg-white">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">From</p>
                    <p className="text-xl font-bold text-gray-900 leading-tight">{ticket.fromStation}</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="w-8 border-t border-dotted border-gray-400" />
                    <ArrowRight className="w-4 h-4" />
                    <span className="w-8 border-t border-dotted border-gray-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">To</p>
                    <p className="text-xl font-bold text-gray-900 leading-tight">{ticket.toStation}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-500">~{ticket.duration} mins • {stopsCount} stops</p>
              </div>

              <div className="rounded-xl border-2 border-[#F6AD55] bg-[#FFF8E7] p-4">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                  <div className="text-center sm:text-left">
                    <p className="text-2xl">🚉</p>
                    <p className="text-xs text-gray-500 uppercase mt-1">Platform</p>
                    <p className="text-5xl leading-none font-extrabold text-[#7B2D8B] mt-1">{ticket.platform}</p>
                    <p className="text-xs text-gray-600 mt-2">Platform {ticket.platform} — {directionLabel}</p>
                  </div>

                  <div className="hidden sm:block h-28 border-l-2 border-dashed border-[#E2A35A]" />

                  <div className="text-center sm:text-left">
                    <div className="mx-auto sm:mx-0 h-9 w-20 rounded-lg border border-gray-300 bg-white relative overflow-hidden">
                      <div className={`absolute top-0 bottom-0 w-2 ${doorDisplay === 'LEFT' ? 'left-0 bg-[#00A550]' : 'left-0 bg-gray-300'}`} />
                      <div className={`absolute top-0 bottom-0 w-2 ${doorDisplay === 'RIGHT' ? 'right-0 bg-[#00A550]' : 'right-0 bg-gray-300'}`} />
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        <Train className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 uppercase mt-2">Doors Open</p>
                    <p className="text-[22px] leading-tight font-extrabold text-[#00A550] mt-1">
                      {doorDisplay === 'LEFT' ? '← LEFT SIDE' : 'RIGHT SIDE →'}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      Stand on the {doorDisplay === 'LEFT' ? 'left' : 'right'} side of the platform
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#90CDF4] bg-[#EBF8FF] p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-base">🚃</span>
                  <span className="font-semibold text-gray-700 uppercase tracking-wide text-xs">Recommended Coach</span>
                  <span className="ml-auto font-bold text-[#2B6CB0]">Coach {coachRecommendation.coach} of 6</span>
                </div>
                <p className="text-xs text-[#2C5282] mt-1">{coachRecommendation.note}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase">{t('ticket.passengers')}</p>
                  <p className="font-semibold text-lg text-gray-900">{ticket.passengers}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase">Total Fare</p>
                  <p className="font-semibold text-lg text-[#7B2D8B]">₹{ticket.totalFare}</p>
                </div>
              </div>

              {isActive && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {t('ticket.validFor')}: {timeRemaining}
                  </span>
                </div>
              )}
            </div>

            <div className="hidden md:block border-l-2 border-dashed border-gray-300" />

            <div className={`flex flex-col items-center justify-start relative ${!isActive ? 'grayscale' : ''}`}>
              <div className="p-3 bg-white border-2 border-gray-200 rounded-xl">
                <QRCodeSVG
                  value={qrData}
                  size={170}
                  level="H"
                  includeMargin
                  fgColor={isActive ? '#7B2D8B' : '#9CA3AF'}
                />
              </div>
              {isActive && (
                <p className="mt-2 text-[11px] font-medium text-[#7B2D8B] text-center">
                  QR refresh in {qrRefreshCountdown}s
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500">{ticket.date} • {ticket.time}</p>
              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                  <span className="text-white font-bold text-xl transform -rotate-12">
                    {ticket.status === 'CANCELLED' ? 'CANCELLED' : ticket.status === 'SCANNED' ? 'SCANNED' : 'EXPIRED'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {isActive && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => onDraftRefund(ticket)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition text-sm font-medium"
              >
                <AlertTriangle className="w-4 h-4" />
                Draft Refund Email
              </button>
              <button
                onClick={() => onModify(ticket.id)}
                disabled={maxModificationsReached}
                title={maxModificationsReached ? 'Maximum 3 modifications allowed per ticket.' : undefined}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Edit className="w-4 h-4" />
                ✏️ Modify Journey
              </button>
              <button
                onClick={() => onCancel(ticket.id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
              >
                <X className="w-4 h-4" />
                {t('ticket.cancel')}
              </button>
              <button
                onClick={() => onMarkScanned(ticket.id)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
              >
                <Check className="w-4 h-4" />
                Mark Scanned (Demo)
              </button>
            </div>
          )}

          {(ticket.modificationCount ?? 0) > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setShowHistory(prev => !prev)}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                ✏️ Modified {ticket.modificationCount} time(s) — View history {showHistory ? '▴' : '▾'}
              </button>
              {showHistory && (
                <div className="mt-2 space-y-1 text-xs text-gray-500">
                  {(ticket.modificationHistory ?? []).map((entry, idx) => (
                    <p key={`${entry.changedAt}-${idx}`}>
                      [{new Date(entry.changedAt).toLocaleString()}] {entry.originalDestination} → {entry.newDestination}{' '}
                      [{entry.type} {entry.type === 'EXTENSION' ? '+' : '-'}{formatINR(Math.abs(entry.fareAdjustment))}]
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="mt-4 text-xs text-gray-400 font-mono">ID: {ticket.id}</p>
        </div>
      )}
    </div>
  );
}

export default function TicketsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const { refund, balance } = useWallet();
  const { tickets, cancelTicket, markAsScanned, modifyBooking } = useBooking();

  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [showModifyModal, setShowModifyModal] = useState<string | null>(null);
  const [refundDraft, setRefundDraft] = useState<{
    caseId: string;
    subject: string;
    body: string;
    refundDays: number;
  } | null>(null);
  const [refundDraftFor, setRefundDraftFor] = useState<string>('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [modificationAnalysis, setModificationAnalysis] = useState<ModificationAnalysis | null>(null);
  const [modificationLoading, setModificationLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const modifyModalRef = useRef<HTMLDivElement | null>(null);
  const ticketCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Redirect if not logged in — use localStorage and replace to avoid back-loop
  useEffect(() => {
    const u = localStorage.getItem('bmrcl_user');
    if (!u) {
      router.replace('/auth?redirect=/tickets');
      return;
    }
    setSessionChecked(true);
  }, [router]);

  const handleCancel = (ticketId: string) => {
    const refundAmount = cancelTicket(ticketId);
    if (refundAmount > 0) {
      const ticket = tickets.find(t => t.id === ticketId);
      refund(refundAmount, `Ticket Cancellation: ${ticket?.fromStation} → ${ticket?.toStation}`);
    }
    setShowCancelModal(null);
  };

  const handleModify = (ticketId: string) => {
    setSelectedDestination('');
    setModificationAnalysis(null);
    setShowModifyModal(ticketId);
  };

  const handleMarkScanned = (ticketId: string) => {
    markAsScanned(ticketId);
  };

  const handleDraftRefund = async (ticket: Ticket) => {
    setRefundLoading(true);
    setRefundDraftFor(ticket.id);
    try {
      const response = await fetch('/api/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          userEmail: user?.email ?? 'passenger@bmrcl.demo',
          station: ticket.fromStation,
          amount: ticket.totalFare,
          reason: 'Ticket cancellation/refund requested from tickets page.',
          incidentDate: ticket.date,
        }),
      });
      const json = await response.json();
      const result = json?.data?.result ?? json?.data;
      if (result?.caseId && result?.subject && result?.body) {
        setRefundDraft({
          caseId: result.caseId,
          subject: result.subject,
          body: result.body,
          refundDays: result.refundDays ?? 3,
        });
      } else {
        setRefundDraft({
          caseId: 'BMRCL-FALLBACK',
          subject: 'Refund request drafted',
          body: 'Unable to load AI draft details at the moment. Please retry.',
          refundDays: 3,
        });
      }
    } catch {
      setRefundDraft({
        caseId: 'BMRCL-FALLBACK',
        subject: 'Refund request drafted',
        body: 'Network issue while generating refund draft. Please retry.',
        refundDays: 3,
      });
    } finally {
      setRefundLoading(false);
    }
  };

  const ticketToCancel = tickets.find(t => t.id === showCancelModal);
  const ticketToModify = tickets.find(t => t.id === showModifyModal);

  const groupedStations = useMemo(() => {
    if (!ticketToModify) return { before: [] as string[], after: [] as string[] };

    const from = ticketToModify.fromStation.trim().toLowerCase();
    const current = ticketToModify.toStation.trim().toLowerCase();
    const allStations = [...PURPLE_LINE, ...GREEN_LINE]
      .map(st => st.name)
      .filter(name => {
        const normalized = name.trim().toLowerCase();
        return normalized !== from && normalized !== current;
      });

    const before: string[] = [];
    const after: string[] = [];

    allStations.forEach(stationName => {
      const analysis = analyseModification(ticketToModify.fromStation, ticketToModify.toStation, stationName);

      if (analysis.modificationType === 'SHORTENING') {
        before.push(stationName);
      } else if (analysis.modificationType === 'EXTENSION') {
        after.push(stationName);
      }
    });

    return { before, after };
  }, [ticketToModify]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!showModifyModal) return;
    const container = modifyModalRef.current;
    if (!container) return;

    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    );
    focusable[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModifyModal(null);
        return;
      }

      if (event.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModifyModal]);

  const handleDestinationSelect = (destination: string) => {
    if (!ticketToModify) return;
    setSelectedDestination(destination);
    const analysis = analyseModification(
      ticketToModify.fromStation,
      ticketToModify.toStation,
      destination,
    );
    setModificationAnalysis(analysis);
  };

  const handleConfirmModification = async () => {
    if (!ticketToModify || !modificationAnalysis || !selectedDestination) return;

    if (
      modificationAnalysis.modificationType === 'EXTENSION' &&
      balance < (modificationAnalysis.extraCharge ?? 0)
    ) {
      setToastType('error');
      setToastMessage('Insufficient wallet balance. Please top up and try again.');
      return;
    }

    setModificationLoading(true);
    const result = await modifyBooking(ticketToModify.id, selectedDestination, modificationAnalysis);
    setModificationLoading(false);

    if (!result.success) {
      setToastType('error');
      setToastMessage(result.errorMessage ?? 'Unable to save changes. Please try again.');
      return;
    }

    setShowModifyModal(null);
    setSelectedDestination('');
    setModificationAnalysis(null);

    if (modificationAnalysis.modificationType === 'EXTENSION') {
      setToastType('success');
      setToastMessage(`Journey extended! ${formatINR(modificationAnalysis.extraCharge ?? 0)} deducted.`);
    } else {
      setToastType('success');
      setToastMessage(`Journey shortened! ${formatINR(modificationAnalysis.refundAmount ?? 0)} refunded.`);
    }

    const node = ticketCardRefs.current[ticketToModify.id];
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  if (!sessionChecked) {
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

        {(refundLoading || refundDraft) && (
          <div className="mb-6 bg-violet-50 border border-violet-200 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-violet-900">Refund Email Draft</h3>
              {refundLoading && <span className="text-xs text-violet-700">Generating...</span>}
            </div>
            {refundDraft && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-violet-700">Ticket: {refundDraftFor}</p>
                <p className="text-xs text-violet-700">Case ID: {refundDraft.caseId}</p>
                <p className="text-sm font-medium text-violet-900">{refundDraft.subject}</p>
                <pre className="whitespace-pre-wrap text-xs text-violet-900 bg-white border border-violet-100 rounded-lg p-3">
                  {refundDraft.body}
                </pre>
                <button
                  onClick={() => navigator.clipboard.writeText(refundDraft.body)}
                  className="text-xs px-3 py-1.5 bg-violet-700 text-white rounded-md hover:bg-violet-800 transition"
                >
                  Copy Draft Body
                </button>
              </div>
            )}
          </div>
        )}

        {tickets.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <TicketIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No tickets yet</h2>
            <p className="text-gray-500 mb-6">Book your first journey to see your tickets here</p>
            <Link
              href="/booking"
              className="px-6 py-3 bg-[#7B2D8B] text-white font-semibold rounded-xl hover:bg-[#6a2679] transition"
            >
              Book a Trip
            </Link>
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
                    <div key={ticket.id} ref={node => { ticketCardRefs.current[ticket.id] = node; }}>
                      <TicketCard
                        ticket={ticket}
                        onCancel={() => setShowCancelModal(ticket.id)}
                        onModify={handleModify}
                        onMarkScanned={handleMarkScanned}
                        onDraftRefund={handleDraftRefund}
                      />
                    </div>
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
                    <div key={ticket.id} ref={node => { ticketCardRefs.current[ticket.id] = node; }}>
                      <TicketCard
                        ticket={ticket}
                        onCancel={() => {}}
                        onModify={() => {}}
                        onMarkScanned={() => {}}
                        onDraftRefund={() => {}}
                      />
                    </div>
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

      {showModifyModal && ticketToModify && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ease-in-out">
          <div
            ref={modifyModalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Modify Journey"
            className="w-full h-full sm:h-auto sm:max-w-lg bg-white sm:rounded-2xl shadow-2xl p-5 sm:p-6 overflow-y-auto transform transition-all duration-300 ease-in-out opacity-100 translate-y-0"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Modify Journey</h3>
                <p className="text-sm text-gray-500">Change your destination station</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModifyModal(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close modify journey modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm">
              <p className="font-medium text-gray-800">{ticketToModify.fromStation} → {ticketToModify.toStation}</p>
              <p className="text-gray-500">{formatINR(ticketToModify.totalFare)} • {ticketToModify.passengers} passenger(s)</p>
            </div>

            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select New Destination</label>
              <select
                value={selectedDestination}
                onChange={e => handleDestinationSelect(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7B2D8B]"
                aria-label="Select new destination station"
              >
                <option value="">Choose station</option>
                <optgroup label="Before Current Destination (Refund)">
                  {groupedStations.before.length > 0 ? groupedStations.before.map(st => (
                    <option key={`before-${st}`} value={st}>{st} • Refund available</option>
                  )) : (
                    <option disabled>No shortening options</option>
                  )}
                </optgroup>
                <optgroup label="After Current Destination (Extra Fare)">
                  {groupedStations.after.length > 0 ? groupedStations.after.map(st => (
                    <option key={`after-${st}`} value={st}>{st} • Extra fare applies</option>
                  )) : (
                    <option disabled>No extension options</option>
                  )}
                </optgroup>
              </select>
            </div>

            {modificationAnalysis && (
              <div className="mt-4 transition-all duration-300 ease-in-out">
                {modificationAnalysis.modificationType === 'INVALID' ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    ⚠ {modificationAnalysis.errorReason}
                  </div>
                ) : modificationAnalysis.modificationType === 'EXTENSION' ? (
                  <div className="rounded-lg border border-purple-200 bg-white p-4">
                    <div className="flex items-center justify-between text-sm"><span>New Destination</span><span className="font-semibold">{selectedDestination}</span></div>
                    <div className="flex items-center justify-between text-sm mt-1"><span>Original Destination</span><span className="line-through text-gray-500">{ticketToModify.toStation}</span></div>
                    <div className="flex items-center justify-between text-sm mt-1"><span>Journey Extended By</span><span>{Math.max(modificationAnalysis.newStops - modificationAnalysis.originalStops, 0)} stops</span></div>
                    <hr className="my-3" />
                    <div className="flex items-center justify-between text-sm"><span>Original Fare</span><span>{formatINR(modificationAnalysis.originalFare)}</span></div>
                    <div className="flex items-center justify-between text-sm"><span>Additional Fare</span><span className="text-green-600">+ {formatINR(modificationAnalysis.extraCharge ?? 0)}</span></div>
                    <div className="flex items-center justify-between text-sm font-semibold"><span>New Total Fare</span><span>{formatINR(modificationAnalysis.newFare)}</span></div>
                    <hr className="my-3" />
                    <div className="text-sm">
                      <p>Current Wallet Balance: {formatINR(balance ?? 0)}</p>
                      {balance >= (modificationAnalysis.extraCharge ?? 0) ? (
                        <p className="text-green-600">✓ Sufficient balance</p>
                      ) : (
                        <div>
                          <p className="text-amber-700">⚠ Insufficient balance. Need {formatINR((modificationAnalysis.extraCharge ?? 0) - (balance ?? 0))} more.</p>
                          <button
                            type="button"
                            onClick={() => router.push('/wallet')}
                            className="mt-1 text-sm text-[#7B2D8B] hover:underline"
                            aria-label="Top up wallet"
                          >
                            Top Up Wallet →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center justify-between text-sm"><span>New Destination</span><span className="font-semibold">{selectedDestination}</span></div>
                    <div className="flex items-center justify-between text-sm mt-1"><span>Original Destination</span><span className="line-through text-gray-500">{ticketToModify.toStation}</span></div>
                    <div className="flex items-center justify-between text-sm mt-1"><span>Journey Shortened By</span><span>{Math.max(modificationAnalysis.originalStops - modificationAnalysis.newStops, 0)} stops</span></div>
                    <hr className="my-3" />
                    <div className="flex items-center justify-between text-sm"><span>Original Fare</span><span>{formatINR(modificationAnalysis.originalFare)}</span></div>
                    <div className="flex items-center justify-between text-sm"><span>Refund Amount</span><span className="text-amber-700">- {formatINR(modificationAnalysis.refundAmount)}</span></div>
                    <div className="flex items-center justify-between text-sm font-semibold"><span>New Total Fare</span><span>{formatINR(modificationAnalysis.newFare)}</span></div>
                    <hr className="my-3" />
                    <p className="text-green-700 text-sm">✓ {formatINR(modificationAnalysis.refundAmount)} will be credited to your E-Wallet</p>
                    <p className="text-xs text-gray-500">Refund processed instantly on confirmation</p>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirmModification}
              disabled={
                !selectedDestination ||
                !modificationAnalysis ||
                modificationAnalysis.modificationType === 'INVALID' ||
                modificationLoading ||
                (modificationAnalysis.modificationType === 'EXTENSION' && balance < (modificationAnalysis.extraCharge ?? 0))
              }
              className={`mt-5 w-full py-3 rounded-xl text-white font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${
                modificationAnalysis?.modificationType === 'SHORTENING'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-[#7B2D8B] hover:bg-[#6a2679]'
              }`}
              aria-label="Confirm journey modification"
            >
              {modificationLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : !selectedDestination || !modificationAnalysis ? (
                'Select a Valid Destination'
              ) : modificationAnalysis.modificationType === 'INVALID' ? (
                'Select a Valid Destination'
              ) : modificationAnalysis.modificationType === 'EXTENSION' ? (
                balance < (modificationAnalysis.extraCharge ?? 0)
                  ? 'Insufficient Wallet Balance'
                  : `Confirm & Pay ${formatINR(modificationAnalysis.extraCharge ?? 0)}`
              ) : (
                `Confirm & Get ${formatINR(modificationAnalysis.refundAmount ?? 0)} Refund`
              )}
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <div
          className={`fixed bottom-4 right-4 z-[60] px-4 py-3 rounded-xl shadow-xl text-white ${toastType === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}
    </AppShell>
  );
}
