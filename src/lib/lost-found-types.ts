export type ItemCategory =
  | 'ELECTRONICS'
  | 'MOBILE_PHONE'
  | 'LAPTOP_TABLET'
  | 'BAGS_LUGGAGE'
  | 'WALLET_PURSE'
  | 'CLOTHING_ACCESSORIES'
  | 'JEWELLERY_WATCHES'
  | 'KEYS'
  | 'DOCUMENTS_CARDS'
  | 'UMBRELLA'
  | 'BOOKS_STATIONERY'
  | 'GLASSES_EYEWEAR'
  | 'HEADPHONES_EARPHONES'
  | 'TOYS_GAMES'
  | 'MEDICAL_ITEMS'
  | 'SPORTS_EQUIPMENT'
  | 'FOOD_CONTAINERS'
  | 'OTHER';

export type ReportStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'MATCHED'
  | 'READY_FOR_COLLECTION'
  | 'COLLECTED'
  | 'CLOSED'
  | 'EXPIRED';

export type ItemColor =
  | 'BLACK'
  | 'WHITE'
  | 'GREY'
  | 'BROWN'
  | 'RED'
  | 'ORANGE'
  | 'YELLOW'
  | 'GREEN'
  | 'BLUE'
  | 'PURPLE'
  | 'PINK'
  | 'GOLD'
  | 'SILVER'
  | 'MULTICOLOR'
  | 'OTHER';

export type TrainDirection =
  | 'TOWARDS_WHITEFIELD'
  | 'TOWARDS_CHALLAGHATTA'
  | 'TOWARDS_NAGASANDRA'
  | 'TOWARDS_SILK_INSTITUTE'
  | 'UNKNOWN';

export type CoachPosition =
  | 'COACH_1'
  | 'COACH_2'
  | 'COACH_3'
  | 'COACH_4'
  | 'COACH_5'
  | 'COACH_6'
  | 'DONT_KNOW';

export type LostLocation =
  | 'INSIDE_TRAIN'
  | 'ON_PLATFORM'
  | 'AT_STATION_ENTRANCE'
  | 'AT_TICKET_COUNTER'
  | 'IN_LIFT_ESCALATOR'
  | 'AT_PARKING_AREA'
  | 'DONT_KNOW';

export interface LostItemReport {
  id: string;

  itemCategory: ItemCategory;
  itemCategoryLabel: string;
  itemDescription: string;
  itemBrand?: string;
  itemModel?: string;
  primaryColor: ItemColor;
  secondaryColor?: ItemColor;
  estimatedValue?: number;
  hasDistinguishingFeatures: boolean;
  distinguishingFeatures?: string;

  dateOfLoss: string;
  approximateTimeOfLoss: string;
  boardingStation: string;
  destinationStation: string;
  lostAtStation?: string;
  lostLocation: LostLocation;
  trainDirection?: TrainDirection;
  coachPosition?: CoachPosition;
  trainNumber?: string;

  reporterName: string;
  reporterPhone: string;
  reporterEmail?: string;
  userId?: string;

  status: ReportStatus;
  submittedAt: string;
  referenceNumber: string;
  lastUpdatedAt: string;
  matchedFoundItemId?: string;
  collectionDeadline?: string;
  staffNotes?: string;
}

export interface FoundItemReport {
  id: string;
  itemCategory: ItemCategory;
  itemDescription: string;
  primaryColor: ItemColor;
  foundAtStation: string;
  foundLocation: LostLocation;
  foundDate: string;
  foundTime: string;
  coachNumber?: number;
  currentStorageLocation: string;
  storageContactNumber: string;
  foundByType: 'PASSENGER' | 'STAFF' | 'CCTV_DETECTED';
  status: 'UNCLAIMED' | 'MATCHED' | 'CLAIMED' | 'DISPOSED';
  submittedAt: string;
  claimDeadline: string;
}

export interface LostFoundMatch {
  lostReportId: string;
  foundReportId: string;
  matchScore: number;
  matchConfidence: 'LOW' | 'MEDIUM' | 'HIGH';
  matchReasons: string[];
  suggestedAction: string;
  contactInfo: string;
  matchedAt: string;
}

export interface FormStep {
  stepNumber: number;
  stepTitle: string;
  stepDescription: string;
  isCompleted: boolean;
}
