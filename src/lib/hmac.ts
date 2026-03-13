export interface TicketPayload {
  paltform: number;
  ticketId: string;
  deviceHash: string;
  route: string;
  fare: number;
  issuedAt: number;
  expiresAt: number;
  windowId: number;
}

interface SignedTicket extends TicketPayload {
  sig: string;
}

const DEMO_SECRET = 'BMRCL_DEMO_SECRET_2025';

function utf8(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

function toBase64Url(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function signRaw(data: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto subtle API is unavailable');
  }

  const key = await subtle.importKey(
    'raw',
    asArrayBuffer(utf8(DEMO_SECRET)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await subtle.sign('HMAC', key, asArrayBuffer(utf8(data)));
  return toBase64Url(new Uint8Array(signature));
}

export async function signTicket(payload: TicketPayload): Promise<string> {
  return signRaw(JSON.stringify(payload));
}

export async function verifyTicket(qrString: string): Promise<boolean> {
  let parsed: SignedTicket;
  try {
    parsed = JSON.parse(qrString) as SignedTicket;
  } catch {
    return false;
  }

  const { sig, ...unsigned } = parsed;
  if (!sig) return false;

  const expected = await signTicket(unsigned);
  return timingSafeEqual(sig, expected);
}
