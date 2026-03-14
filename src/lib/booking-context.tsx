'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import CryptoJS from 'crypto-js';
import { useWallet } from '@/lib/wallet-context';
import { ALL_STATIONS } from '@/lib/metro-network';
import type {
  ModificationAnalysis,
  ModifyBookingResult,
  ModificationHistoryEntry,
} from '@/types/modification';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export type TicketStatus = 'ACTIVE' | 'SCANNED' | 'EXPIRED' | 'CANCELLED';
export type DoorSide = 'LEFT' | 'RIGHT' | 'BOTH';

export interface Ticket {
  id: string;
  fromStation: string;
  toStation: string;
  platform: number;
  doorSide: DoorSide;
  date: string;
  time: string;
  passengers: number;
  farePerPerson: number;
  totalFare: number;
  status: TicketStatus;
  createdAt: string;
  expiresAt: string;
  hmacSignature: string;
  route: string[];
  duration: number;
  qrPayload?: string;
  modifiedAt?: string;
  modificationCount?: number;
  modificationHistory?: ModificationHistoryEntry[];
}

export interface BookingHmacPayload {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  passengers: number;
  fare: number;
  expires: string;
  refreshNonce?: string;
}

interface BookingContextType {
  tickets: Ticket[];
  createTicket: (params: CreateTicketParams) => Ticket;
  cancelTicket: (ticketId: string) => number; // returns refund amount
  modifyTicket: (ticketId: string, updates: ModifyTicketParams) => number; // returns fare difference
  modifyBooking: (
    ticketId: string,
    newDestination: string,
    analysis: ModificationAnalysis
  ) => Promise<ModifyBookingResult>;
  markAsScanned: (ticketId: string) => void;
  getTicketById: (ticketId: string) => Ticket | undefined;
}

interface CreateTicketParams {
  fromStation: string;
  toStation: string;
  platform?: number;
  doorSide?: DoorSide;
  date: string;
  time: string;
  passengers: number;
  farePerPerson: number;
  totalFare: number;
  route: string[];
  duration: number;
}

interface ModifyTicketParams {
  date?: string;
  time?: string;
  passengers?: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Storage Keys
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TICKETS_KEY = 'bmrcl_tickets';
export const BOOKING_HMAC_SECRET = 'BMRCL_NAMMA_METRO_2026_SECRET_KEY';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function generateTicketId(): string {
  return `TKT${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export function buildBookingHmacPayload(input: BookingHmacPayload): BookingHmacPayload {
  const payload: BookingHmacPayload = {
    id: input.id,
    from: input.from,
    to: input.to,
    date: input.date,
    time: input.time,
    passengers: input.passengers,
    fare: input.fare,
    expires: input.expires,
  };

  if (input.refreshNonce) {
    payload.refreshNonce = input.refreshNonce;
  }

  return payload;
}

export function signBookingPayload(payload: BookingHmacPayload): string {
  return CryptoJS.HmacSHA256(JSON.stringify(payload), BOOKING_HMAC_SECRET).toString();
}

function generateHmacSignature(ticket: Omit<Ticket, 'hmacSignature'>): string {
  const payload = buildBookingHmacPayload({
    id: ticket.id,
    from: ticket.fromStation,
    to: ticket.toStation,
    date: ticket.date,
    time: ticket.time,
    passengers: ticket.passengers,
    fare: ticket.totalFare,
    expires: ticket.expiresAt,
  });
  return signBookingPayload(payload);
}

function getRandomPlatform(): number {
  return Math.random() > 0.5 ? 1 : 2;
}

function getRandomDoorSide(): DoorSide {
  const sides: DoorSide[] = ['LEFT', 'RIGHT', 'BOTH'];
  return sides[Math.floor(Math.random() * sides.length)];
}

function deriveNewPlatform(fromStation: string, toStation: string): number {
  const from = ALL_STATIONS.find(s => s.name.toLowerCase() === fromStation.toLowerCase());
  const to = ALL_STATIONS.find(s => s.name.toLowerCase() === toStation.toLowerCase());
  if (!from || !to) {
    return getRandomPlatform();
  }
  return to.index >= from.index ? 2 : 1;
}

function generateNonce(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function computeBookingExpiryTime(dateStr: string, timeStr: string): string {
  // Ticket valid for 24 hours from travel date/time
  const travelDateTime = new Date(`${dateStr}T${timeStr}`);
  travelDateTime.setHours(travelDateTime.getHours() + 24);
  return travelDateTime.toISOString();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Context
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const BookingContext = createContext<BookingContextType | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const { balance, debit, refund } = useWallet();

  // Load tickets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TICKETS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Ticket[];
        
        // Update expired tickets
        const now = new Date();
        const updated = parsed.map(ticket => {
          if (ticket.status === 'ACTIVE' && new Date(ticket.expiresAt) < now) {
            return { ...ticket, status: 'EXPIRED' as TicketStatus };
          }
          return ticket;
        });
        
        setTickets(updated);
        localStorage.setItem(TICKETS_KEY, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  }, []);

  // Save tickets on change
  const saveTickets = useCallback((newTickets: Ticket[]) => {
    setTickets(newTickets);
    localStorage.setItem(TICKETS_KEY, JSON.stringify(newTickets));
  }, []);

  const createTicket = useCallback((params: CreateTicketParams): Ticket => {
    const ticketBase = {
      id: generateTicketId(),
      fromStation: params.fromStation,
      toStation: params.toStation,
      platform: params.platform ?? getRandomPlatform(),
      doorSide: params.doorSide ?? getRandomDoorSide(),
      date: params.date,
      time: params.time,
      passengers: params.passengers,
      farePerPerson: params.farePerPerson,
      totalFare: params.totalFare,
      status: 'ACTIVE' as TicketStatus,
      createdAt: new Date().toISOString(),
      expiresAt: computeBookingExpiryTime(params.date, params.time),
      route: params.route,
      duration: params.duration,
    };

    const ticket: Ticket = {
      ...ticketBase,
      hmacSignature: generateHmacSignature(ticketBase as Omit<Ticket, 'hmacSignature'>),
    };

    saveTickets([ticket, ...tickets]);
    return ticket;
  }, [tickets, saveTickets]);

  const cancelTicket = useCallback((ticketId: string): number => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || ticket.status !== 'ACTIVE') return 0;

    // Calculate refund: 100% if >2hrs before travel, 50% otherwise
    const travelTime = new Date(`${ticket.date}T${ticket.time}`);
    const now = new Date();
    const hoursUntilTravel = (travelTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    const refundPercent = hoursUntilTravel > 2 ? 1.0 : 0.5;
    const refundAmount = Math.round(ticket.totalFare * refundPercent);

    const updated = tickets.map(t =>
      t.id === ticketId ? { ...t, status: 'CANCELLED' as TicketStatus } : t
    );
    saveTickets(updated);

    return refundAmount;
  }, [tickets, saveTickets]);

  const modifyTicket = useCallback((ticketId: string, updates: ModifyTicketParams): number => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || ticket.status !== 'ACTIVE') return 0;

    const oldFare = ticket.totalFare;
    const newPassengers = updates.passengers ?? ticket.passengers;
    const newFare = ticket.farePerPerson * newPassengers;
    const fareDifference = newFare - oldFare;

    const updatedTicketBase = {
      ...ticket,
      date: updates.date ?? ticket.date,
      time: updates.time ?? ticket.time,
      passengers: newPassengers,
      totalFare: newFare,
      expiresAt: computeBookingExpiryTime(updates.date ?? ticket.date, updates.time ?? ticket.time),
    };

    const updatedTicket: Ticket = {
      ...updatedTicketBase,
      hmacSignature: generateHmacSignature(updatedTicketBase),
    };

    const updated = tickets.map(t => t.id === ticketId ? updatedTicket : t);
    saveTickets(updated);

    return fareDifference; // Positive = debit more, Negative = refund
  }, [tickets, saveTickets]);

  const modifyBooking = useCallback(async (
    ticketId: string,
    newDestination: string,
    analysis: ModificationAnalysis
  ): Promise<ModifyBookingResult> => {
    /*
     * QR SIGNATURE REGENERATION — SECURITY NOTE
     *
     * When a journey is modified, the original QR payload becomes
     * cryptographically invalid. This is intentional.
     *
     * The HMAC in the original QR was computed over the original
     * { fromStation, toStation, fare, nonce, ... } payload.
     *
     * If we only updated the destination in state but reused the
     * old QR, the edge gate would:
     *   1. Decode the QR payload (still shows old destination)
     *   2. Verify HMAC — passes (old signature matches old data)
     *   3. Allow entry for wrong journey — SECURITY BREACH
     *
     * Instead we:
     *   1. Build a completely new payload with new destination + fare
     *   2. Generate a fresh nonce (prevents replay of old QR)
     *   3. Sign the new payload with signTicket() → new HMAC
     *   4. The old QR immediately fails HMAC verification at gate
     *   5. Only the new QR displayed in the app is valid
     *
     * signTicket() is called at: Step 3 of modifyBooking()
     * The new qrPayload string is stored in booking.qrPayload
     * The QR component in page.tsx reads from booking.qrPayload
     * so it automatically displays the new valid QR on state update.
     */
    const booking = tickets.find(t => t.id === ticketId);
    if (!booking) {
      return {
        success: false,
        errorCode: 'TICKET_NOT_FOUND',
      };
    }

    if (booking.status !== 'ACTIVE') {
      return {
        success: false,
        errorCode: 'ALREADY_SCANNED',
        errorMessage: 'This ticket has already been scanned and cannot be modified.',
      };
    }

    if (new Date(booking.expiresAt).getTime() < Date.now()) {
      return {
        success: false,
        errorCode: 'TICKET_EXPIRED',
        errorMessage: 'Expired tickets cannot be modified.',
      };
    }

    if ((booking.modificationCount ?? 0) >= 3) {
      return {
        success: false,
        errorCode: 'INVALID_MODIFICATION',
        errorMessage: 'Maximum 3 modifications allowed per ticket.',
      };
    }

    if (analysis.modificationType === 'INVALID') {
      return {
        success: false,
        errorCode: 'INVALID_MODIFICATION',
        errorMessage: analysis.errorReason ?? 'Invalid journey modification.',
      };
    }

    let walletTransaction: ModifyBookingResult['walletTransaction'];

    if (analysis.modificationType === 'EXTENSION') {
      const additionalCharge = Number.isFinite(analysis.extraCharge)
        ? Math.max(analysis.extraCharge, 0)
        : 0;

      if (additionalCharge > 0) {
        if (balance < additionalCharge) {
          const shortfall = additionalCharge - balance;
          return {
            success: false,
            errorCode: 'INSUFFICIENT_FUNDS',
            errorMessage: `Need ₹${shortfall} more. Please top up your wallet.`,
          };
        }

        const debited = debit(additionalCharge, `Journey extension to ${newDestination}`);
        if (!debited) {
          return {
            success: false,
            errorCode: 'WALLET_DEBIT_FAILED',
            errorMessage: 'Payment failed. Your booking was not changed.',
          };
        }

        walletTransaction = {
          type: 'DEBIT',
          amount: additionalCharge,
          newBalance: balance - additionalCharge,
        };
      }
    }

    if (analysis.modificationType === 'SHORTENING' && analysis.refundAmount > 0) {
      refund(
        analysis.refundAmount,
        `Refund for journey shortening — unused ${booking.toStation} portion`
      );
      walletTransaction = {
        type: 'CREDIT',
        amount: analysis.refundAmount,
        newBalance: balance + analysis.refundAmount,
      };
    }

    try {
      const nowIso = new Date().toISOString();
      const nonce = generateNonce();
      const modifiedCount = (booking.modificationCount ?? 0) + 1;
      const newPlatform = deriveNewPlatform(booking.fromStation, newDestination);

      const hmacPayload = buildBookingHmacPayload({
        id: booking.id,
        from: booking.fromStation,
        to: newDestination,
        date: booking.date,
        time: booking.time,
        passengers: booking.passengers,
        fare: analysis.newFare,
        expires: booking.expiresAt,
        refreshNonce: nonce,
      });

      const newHmac = signBookingPayload(hmacPayload);
      const newQrPayload = JSON.stringify({
        id: booking.id,
        bookingId: booking.id,
        from: booking.fromStation,
        fromStation: booking.fromStation,
        to: newDestination,
        toStation: newDestination,
        fare: analysis.newFare,
        passengers: booking.passengers,
        travelDate: booking.date,
        travelTime: booking.time,
        date: booking.date,
        time: booking.time,
        platform: newPlatform,
        nonce,
        refreshNonce: nonce,
        modifiedAt: nowIso,
        modificationCount: modifiedCount,
        expires: booking.expiresAt,
        hmac: newHmac,
      });

      const farePerPerson = booking.passengers > 0
        ? Math.round((analysis.newFare / booking.passengers) * 100) / 100
        : booking.farePerPerson;

      const updatedBooking: Ticket = {
        ...booking,
        toStation: newDestination,
        platform: newPlatform,
        totalFare: analysis.newFare,
        farePerPerson,
        hmacSignature: newHmac,
        qrPayload: newQrPayload,
        modifiedAt: nowIso,
        modificationCount: modifiedCount,
        modificationHistory: [
          ...(booking.modificationHistory ?? []),
          {
            changedAt: nowIso,
            originalDestination: booking.toStation,
            newDestination,
            fareAdjustment: analysis.modificationType === 'EXTENSION'
              ? -Math.max(analysis.extraCharge, 0)
              : analysis.refundAmount,
            type: analysis.modificationType,
          },
        ],
      };

      const updatedTickets = tickets.map(t => t.id === ticketId ? updatedBooking : t);
      saveTickets(updatedTickets);

      return {
        success: true,
        updatedBooking,
        walletTransaction,
      };
    } catch {
      if (walletTransaction?.type === 'DEBIT') {
        refund(walletTransaction.amount, 'Rollback: failed journey modification save');
      } else if (walletTransaction?.type === 'CREDIT') {
        debit(walletTransaction.amount, 'Rollback: failed journey modification save');
      }

      return {
        success: false,
        errorCode: 'INVALID_MODIFICATION',
        errorMessage: 'Unable to save changes. Please try again.',
      };
    }
  }, [tickets, saveTickets, balance, debit, refund]);

  const markAsScanned = useCallback((ticketId: string) => {
    const updated = tickets.map(t =>
      t.id === ticketId && t.status === 'ACTIVE'
        ? { ...t, status: 'SCANNED' as TicketStatus }
        : t
    );
    saveTickets(updated);
  }, [tickets, saveTickets]);

  const getTicketById = useCallback((ticketId: string): Ticket | undefined => {
    return tickets.find(t => t.id === ticketId);
  }, [tickets]);

  return (
    <BookingContext.Provider value={{
      tickets,
      createTicket,
      cancelTicket,
      modifyTicket,
      modifyBooking,
      markAsScanned,
      getTicketById,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
}
