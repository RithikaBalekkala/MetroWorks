/**
 * Cryptographic ticket operations — HMAC-SHA256 signing & verification.
 * Uses crypto-js for browser-compatible HMAC.
 */
import CryptoJS from 'crypto-js';

/** Shared secret (in production this would be in a hardware secure element) */
const HMAC_SECRET = 'BMRCL-EDGE-KEY-2026-HACKATHON';

export interface TicketPayload {
  ticketId: string;
  from: string;
  to: string;
  fare: number;
  issuedAt: number;     // unix ms
  expiresAt: number;    // unix ms
  deviceHash: string;   // mock privacy-compliant device fingerprint
  nonce: string;        // anti-replay nonce
}

export interface SignedTicket {
  payload: TicketPayload;
  signature: string;    // HMAC-SHA256 hex
}

/** Generate a random hex string */
function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

/** Create a mock device fingerprint hash */
function generateDeviceHash(): string {
  const raw = `${navigator?.userAgent || 'edge-device'}-${Date.now()}`;
  return CryptoJS.SHA256(raw).toString().slice(0, 16);
}

/** Sign a payload with HMAC-SHA256 */
function signPayload(payload: TicketPayload): string {
  const canonical = JSON.stringify(payload);
  return CryptoJS.HmacSHA256(canonical, HMAC_SECRET).toString();
}

/** Create a new signed ticket */
export function createSignedTicket(
  from: string,
  to: string,
  fare: number
): SignedTicket {
  const now = Date.now();
  const payload: TicketPayload = {
    ticketId: `TKT-${randomHex(8)}`,
    from,
    to,
    fare,
    issuedAt: now,
    expiresAt: now + 2 * 60 * 60 * 1000, // 2-hour validity
    deviceHash: generateDeviceHash(),
    nonce: randomHex(16),
  };
  return { payload, signature: signPayload(payload) };
}

/** Refresh the ticket (re-sign with new nonce + timestamp) — called every 30s */
export function refreshTicket(ticket: SignedTicket): SignedTicket {
  const now = Date.now();
  const newPayload: TicketPayload = {
    ...ticket.payload,
    issuedAt: now,
    nonce: randomHex(16),
  };
  return { payload: newPayload, signature: signPayload(newPayload) };
}

/** Verify a ticket's HMAC signature (used by offline edge gate) */
export function verifyTicketSignature(ticket: SignedTicket): boolean {
  const expected = signPayload(ticket.payload);
  return expected === ticket.signature;
}

/** Serialise a signed ticket to a compact JSON string (for QR embedding) */
export function serialiseTicket(ticket: SignedTicket): string {
  return JSON.stringify(ticket);
}

/** Deserialise a ticket from QR string */
export function deserialiseTicket(qrData: string): SignedTicket | null {
  try {
    const parsed = JSON.parse(qrData);
    if (parsed.payload && parsed.signature) return parsed as SignedTicket;
    return null;
  } catch {
    return null;
  }
}
