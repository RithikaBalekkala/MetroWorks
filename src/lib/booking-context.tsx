'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import CryptoJS from 'crypto-js';

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
}

interface BookingContextType {
  tickets: Ticket[];
  createTicket: (params: CreateTicketParams) => Ticket;
  cancelTicket: (ticketId: string) => number; // returns refund amount
  modifyTicket: (ticketId: string, updates: ModifyTicketParams) => number; // returns fare difference
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
const HMAC_SECRET = 'BMRCL_NAMMA_METRO_2026_SECRET_KEY';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function generateTicketId(): string {
  return `TKT${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function generateHmacSignature(ticket: Omit<Ticket, 'hmacSignature'>): string {
  const payload = JSON.stringify({
    id: ticket.id,
    from: ticket.fromStation,
    to: ticket.toStation,
    date: ticket.date,
    time: ticket.time,
    passengers: ticket.passengers,
    fare: ticket.totalFare,
    expires: ticket.expiresAt,
  });
  return CryptoJS.HmacSHA256(payload, HMAC_SECRET).toString();
}

function getRandomPlatform(): number {
  return Math.random() > 0.5 ? 1 : 2;
}

function getRandomDoorSide(): DoorSide {
  const sides: DoorSide[] = ['LEFT', 'RIGHT', 'BOTH'];
  return sides[Math.floor(Math.random() * sides.length)];
}

function getExpiryTime(dateStr: string, timeStr: string): string {
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
      expiresAt: getExpiryTime(params.date, params.time),
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
      expiresAt: getExpiryTime(updates.date ?? ticket.date, updates.time ?? ticket.time),
    };

    const updatedTicket: Ticket = {
      ...updatedTicketBase,
      hmacSignature: generateHmacSignature(updatedTicketBase),
    };

    const updated = tickets.map(t => t.id === ticketId ? updatedTicket : t);
    saveTickets(updated);

    return fareDifference; // Positive = debit more, Negative = refund
  }, [tickets, saveTickets]);

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
