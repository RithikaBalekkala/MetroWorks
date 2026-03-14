export type JourneyLine = 'PURPLE' | 'GREEN' | 'INTERCHANGE';

export type ModificationType = 'EXTENSION' | 'SHORTENING' | 'INVALID';

export interface ModificationAnalysis {
  modificationType: ModificationType;
  originalFare: number;
  newFare: number;
  fareDifference: number;
  refundAmount: number;
  extraCharge: number;
  originalStops: number;
  newStops: number;
  newLine: JourneyLine;
  errorReason?: string;
}

export type ModifyBookingErrorCode =
  | 'INSUFFICIENT_FUNDS'
  | 'TICKET_NOT_FOUND'
  | 'ALREADY_SCANNED'
  | 'TICKET_EXPIRED'
  | 'INVALID_MODIFICATION'
  | 'WALLET_DEBIT_FAILED';

export interface ModificationHistoryEntry {
  changedAt: string;
  originalDestination: string;
  newDestination: string;
  fareAdjustment: number;
  type: Exclude<ModificationType, 'INVALID'>;
}

export interface Booking {
  id: string;
  fromStation: string;
  toStation: string;
  platform: number;
  doorSide: 'LEFT' | 'RIGHT' | 'BOTH';
  date: string;
  time: string;
  passengers: number;
  farePerPerson: number;
  totalFare: number;
  status: 'ACTIVE' | 'SCANNED' | 'EXPIRED' | 'CANCELLED';
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

export interface ModifyBookingResult {
  success: boolean;
  errorCode?: ModifyBookingErrorCode;
  errorMessage?: string;
  updatedBooking?: Booking;
  walletTransaction?: {
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    newBalance: number;
  };
}
