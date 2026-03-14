import type {
  FoundItemReport,
  ItemCategory,
  ItemColor,
  LostItemReport,
  LostFoundMatch,
} from '@/lib/lost-found-types';

export const CATEGORY_CONFIG: Record<ItemCategory, {
  label: string;
  emoji: string;
  description: string;
  commonBrands?: string[];
}> = {
  ELECTRONICS: {
    label: 'Electronics',
    emoji: '🔌',
    description: 'General electronic devices',
    commonBrands: ['Sony', 'Samsung', 'Apple', 'Boat'],
  },
  MOBILE_PHONE: {
    label: 'Mobile Phone',
    emoji: '📱',
    description: 'Smartphones and basic phones',
    commonBrands: ['iPhone', 'Samsung', 'OnePlus', 'Redmi', 'Realme', 'Vivo', 'Oppo'],
  },
  LAPTOP_TABLET: {
    label: 'Laptop / Tablet',
    emoji: '💻',
    description: 'Laptops, tablets, iPads',
    commonBrands: ['Dell', 'HP', 'Lenovo', 'MacBook', 'ASUS', 'Acer', 'iPad', 'Surface'],
  },
  BAGS_LUGGAGE: {
    label: 'Bag / Luggage',
    emoji: '🎒',
    description: 'Backpacks, handbags, suitcases',
    commonBrands: ['Wildcraft', 'Skybags', 'American Tourister', 'Samsonite', 'VIP', 'Safari'],
  },
  WALLET_PURSE: {
    label: 'Wallet / Purse',
    emoji: '👛',
    description: 'Wallets, purses, clutches',
    commonBrands: [],
  },
  CLOTHING_ACCESSORIES: {
    label: 'Clothing / Accessories',
    emoji: '👕',
    description: 'Clothes, scarves, caps, belts',
    commonBrands: [],
  },
  JEWELLERY_WATCHES: {
    label: 'Jewellery / Watch',
    emoji: '⌚',
    description: 'Rings, chains, earrings, watches',
    commonBrands: ['Titan', 'Fastrack', 'Casio', 'Fossil'],
  },
  KEYS: {
    label: 'Keys',
    emoji: '🔑',
    description: 'House keys, vehicle keys, office keys',
    commonBrands: [],
  },
  DOCUMENTS_CARDS: {
    label: 'Documents / Cards',
    emoji: '📄',
    description: 'ID cards, passports, certificates, files',
    commonBrands: [],
  },
  UMBRELLA: {
    label: 'Umbrella',
    emoji: '☂️',
    description: 'Umbrellas and rain gear',
    commonBrands: [],
  },
  BOOKS_STATIONERY: {
    label: 'Books / Stationery',
    emoji: '📚',
    description: 'Books, notebooks, pens, stationery',
    commonBrands: [],
  },
  GLASSES_EYEWEAR: {
    label: 'Glasses / Eyewear',
    emoji: '👓',
    description: 'Spectacles, sunglasses, contact lens case',
    commonBrands: ['Lenskart', 'Ray-Ban', 'Titan Eye+'],
  },
  HEADPHONES_EARPHONES: {
    label: 'Headphones / Earphones',
    emoji: '🎧',
    description: 'Wired or wireless audio devices',
    commonBrands: ['AirPods', 'Sony', 'Boat', 'JBL', 'Sennheiser', 'OnePlus Buds'],
  },
  TOYS_GAMES: {
    label: 'Toys / Games',
    emoji: '🧸',
    description: 'Children toys, board games, gaming accessories',
    commonBrands: [],
  },
  MEDICAL_ITEMS: {
    label: 'Medical Items',
    emoji: '💊',
    description: 'Medicines, medical devices, first aid items',
    commonBrands: [],
  },
  SPORTS_EQUIPMENT: {
    label: 'Sports Equipment',
    emoji: '🏏',
    description: 'Sports gear, gym equipment',
    commonBrands: [],
  },
  FOOD_CONTAINERS: {
    label: 'Food Containers',
    emoji: '🍱',
    description: 'Lunch boxes, water bottles, flasks',
    commonBrands: ['Milton', 'Cello', 'Tupperware'],
  },
  OTHER: {
    label: 'Other Item',
    emoji: '📦',
    description: 'Any item not listed above',
    commonBrands: [],
  },
};

export const COLOR_OPTIONS: { value: ItemColor; label: string; hex: string }[] = [
  { value: 'BLACK', label: 'Black', hex: '#1a1a1a' },
  { value: 'WHITE', label: 'White', hex: '#ffffff' },
  { value: 'GREY', label: 'Grey', hex: '#9ca3af' },
  { value: 'BROWN', label: 'Brown', hex: '#92400e' },
  { value: 'RED', label: 'Red', hex: '#dc2626' },
  { value: 'ORANGE', label: 'Orange', hex: '#ea580c' },
  { value: 'YELLOW', label: 'Yellow', hex: '#ca8a04' },
  { value: 'GREEN', label: 'Green', hex: '#16a34a' },
  { value: 'BLUE', label: 'Blue', hex: '#2563eb' },
  { value: 'PURPLE', label: 'Purple', hex: '#7c3aed' },
  { value: 'PINK', label: 'Pink', hex: '#db2777' },
  { value: 'GOLD', label: 'Gold', hex: '#d97706' },
  { value: 'SILVER', label: 'Silver', hex: '#6b7280' },
  { value: 'MULTICOLOR', label: 'Multicolor', hex: '#8b5cf6' },
  { value: 'OTHER', label: 'Other', hex: '#374151' },
];

export const MOCK_FOUND_ITEMS: FoundItemReport[] = [
  {
    id: 'FR-1741800001',
    itemCategory: 'MOBILE_PHONE',
    itemDescription: 'Black Samsung Galaxy S23 with cracked screen protector, red case cover. Phone is locked.',
    primaryColor: 'BLACK',
    foundAtStation: 'MG Road',
    foundLocation: 'INSIDE_TRAIN',
    foundDate: '2025-03-13',
    foundTime: '18:45',
    coachNumber: 3,
    currentStorageLocation: 'MG Road Station — Lost & Found Office, Ground Floor',
    storageContactNumber: '080-22977991',
    foundByType: 'PASSENGER',
    status: 'UNCLAIMED',
    submittedAt: '2025-03-13T19:00:00Z',
    claimDeadline: '2025-04-12',
  },
  {
    id: 'FR-1741800002',
    itemCategory: 'BAGS_LUGGAGE',
    itemDescription: 'Blue Wildcraft backpack with laptop compartment. Has a yellow keychain attached. Partially open when found.',
    primaryColor: 'BLUE',
    foundAtStation: 'Majestic',
    foundLocation: 'ON_PLATFORM',
    foundDate: '2025-03-12',
    foundTime: '09:15',
    currentStorageLocation: 'Majestic Station — Central Lost & Found, Level 2',
    storageContactNumber: '080-22977992',
    foundByType: 'STAFF',
    status: 'UNCLAIMED',
    submittedAt: '2025-03-12T09:30:00Z',
    claimDeadline: '2025-04-11',
  },
  {
    id: 'FR-1741800003',
    itemCategory: 'DOCUMENTS_CARDS',
    itemDescription: 'Brown leather wallet containing Aadhaar card, PAN card, debit card and approximately ₹500 cash. Name on Aadhaar: Rajesh Kumar.',
    primaryColor: 'BROWN',
    foundAtStation: 'Indiranagar',
    foundLocation: 'AT_STATION_ENTRANCE',
    foundDate: '2025-03-14',
    foundTime: '08:30',
    currentStorageLocation: 'Indiranagar Station Office',
    storageContactNumber: '080-22977993',
    foundByType: 'STAFF',
    status: 'UNCLAIMED',
    submittedAt: '2025-03-14T08:45:00Z',
    claimDeadline: '2025-04-13',
  },
  {
    id: 'FR-1741800004',
    itemCategory: 'HEADPHONES_EARPHONES',
    itemDescription: 'White Apple AirPods Pro (2nd gen) in white charging case. Case has small scratch on lid.',
    primaryColor: 'WHITE',
    foundAtStation: 'Whitefield',
    foundLocation: 'INSIDE_TRAIN',
    foundDate: '2025-03-13',
    foundTime: '20:10',
    coachNumber: 5,
    currentStorageLocation: 'Whitefield Station — Station Master Office',
    storageContactNumber: '080-22977994',
    foundByType: 'PASSENGER',
    status: 'UNCLAIMED',
    submittedAt: '2025-03-13T20:30:00Z',
    claimDeadline: '2025-04-12',
  },
  {
    id: 'FR-1741800005',
    itemCategory: 'KEYS',
    itemDescription: 'Honda Activa key with 3 keys on silver ring. Has a small Ganesha idol keychain and a supermarket loyalty card attached.',
    primaryColor: 'SILVER',
    foundAtStation: 'Electronic City',
    foundLocation: 'ON_PLATFORM',
    foundDate: '2025-03-11',
    foundTime: '17:55',
    currentStorageLocation: 'Electronic City Station Office',
    storageContactNumber: '080-22977995',
    foundByType: 'STAFF',
    status: 'UNCLAIMED',
    submittedAt: '2025-03-11T18:10:00Z',
    claimDeadline: '2025-04-10',
  },
  {
    id: 'FR-1741800006',
    itemCategory: 'LAPTOP_TABLET',
    itemDescription: 'Dell Inspiron 15 laptop in grey soft-sleeve case. No charger. Has a Wipro sticker on the bottom.',
    primaryColor: 'GREY',
    foundAtStation: 'Baiyappanahalli',
    foundLocation: 'INSIDE_TRAIN',
    foundDate: '2025-03-10',
    foundTime: '10:20',
    coachNumber: 2,
    currentStorageLocation: 'Baiyappanahalli Station — Lost & Found',
    storageContactNumber: '080-22977996',
    foundByType: 'PASSENGER',
    status: 'UNCLAIMED',
    submittedAt: '2025-03-10T10:45:00Z',
    claimDeadline: '2025-04-09',
  },
  {
    id: 'FR-1741800007',
    itemCategory: 'JEWELLERY_WATCHES',
    itemDescription: 'Gold-coloured bangle with floral engraving. Appears to be gold-plated. Found near the exit turnstile.',
    primaryColor: 'GOLD',
    foundAtStation: 'Cubbon Park',
    foundLocation: 'AT_STATION_ENTRANCE',
    foundDate: '2025-03-09',
    foundTime: '13:40',
    currentStorageLocation: 'Cubbon Park Station Office',
    storageContactNumber: '080-22977997',
    foundByType: 'STAFF',
    status: 'UNCLAIMED',
    submittedAt: '2025-03-09T14:00:00Z',
    claimDeadline: '2025-04-08',
  },
  {
    id: 'FR-1741800008',
    itemCategory: 'UMBRELLA',
    itemDescription: 'Black telescopic umbrella with automatic open/close. Wooden handle with slight wear. No brand markings visible.',
    primaryColor: 'BLACK',
    foundAtStation: 'Yeshwanthpur',
    foundLocation: 'ON_PLATFORM',
    foundDate: '2025-03-14',
    foundTime: '07:50',
    currentStorageLocation: 'Yeshwanthpur Station Office',
    storageContactNumber: '080-22977998',
    foundByType: 'STAFF',
    status: 'UNCLAIMED',
    submittedAt: '2025-03-14T08:05:00Z',
    claimDeadline: '2025-04-13',
  },
];

export function generateReferenceNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LF-${date}-${rand}`;
}

export function generateReportId(): string {
  return `LR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function saveLostReport(report: LostItemReport): void {
  try {
    const existing = getLostReports();
    existing.unshift(report);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('bmrcl_lost_reports', JSON.stringify(existing.slice(0, 100)));
    }
  } catch {
    return;
  }
}

export function getLostReports(): LostItemReport[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const data = localStorage.getItem('bmrcl_lost_reports');
    return data ? (JSON.parse(data) as LostItemReport[]) : [];
  } catch {
    return [];
  }
}

export function getLostReportsByUser(userId: string): LostItemReport[] {
  return getLostReports().filter(r => r.userId === userId);
}

export function searchFoundItems(query: {
  category?: ItemCategory;
  color?: ItemColor;
  station?: string;
  dateFrom?: string;
  keyword?: string;
}): FoundItemReport[] {
  return MOCK_FOUND_ITEMS.filter(item => {
    if (item.status === 'CLAIMED') return false;

    const normalise = (s: string): string => s.toLowerCase().trim();

    if (query.category && item.itemCategory !== query.category) return false;
    if (query.color && item.primaryColor !== query.color) return false;

    if (query.station && !normalise(item.foundAtStation).includes(normalise(query.station))) {
      return false;
    }

    if (query.dateFrom && item.foundDate < query.dateFrom) return false;

    if (query.keyword) {
      const kw = normalise(query.keyword);
      return normalise(item.itemDescription).includes(kw)
        || normalise(item.itemCategory).includes(kw);
    }

    return true;
  });
}

export function findMatches(report: LostItemReport): LostFoundMatch[] {
  const matches: LostFoundMatch[] = [];

  MOCK_FOUND_ITEMS.forEach(found => {
    if (found.status === 'CLAIMED') return;

    let score = 0;
    const reasons: string[] = [];

    if (found.itemCategory === report.itemCategory) {
      score += 35;
      reasons.push('Same item category');
    }

    if (found.primaryColor === report.primaryColor) {
      score += 20;
      reasons.push('Matching color');
    }

    if (found.foundDate === report.dateOfLoss) {
      score += 20;
      reasons.push('Found on same date');
    } else if (Math.abs(new Date(found.foundDate).getTime() - new Date(report.dateOfLoss).getTime()) <= 86400000) {
      score += 10;
      reasons.push('Found within 1 day');
    }

    const normalise = (s: string): string => s.toLowerCase();
    const foundDesc = normalise(found.itemDescription);
    const lostDesc = normalise(report.itemDescription);

    const keywords = lostDesc.split(' ').filter(w => w.length > 4);
    const matchedWords = keywords.filter(w => foundDesc.includes(w));

    if (matchedWords.length > 0) {
      score += Math.min(matchedWords.length * 8, 25);
      reasons.push(`Description keywords match: ${matchedWords.slice(0, 3).join(', ')}`);
    }

    if (found.foundAtStation === report.boardingStation || found.foundAtStation === report.destinationStation) {
      score += 15;
      reasons.push('Found at your journey station');
    }

    if (score >= 35) {
      matches.push({
        lostReportId: report.id,
        foundReportId: found.id,
        matchScore: Math.min(score, 100),
        matchConfidence: score >= 70 ? 'HIGH' : score >= 50 ? 'MEDIUM' : 'LOW',
        matchReasons: reasons,
        suggestedAction: `Visit ${found.currentStorageLocation} with your reference number and a valid photo ID.`,
        contactInfo: found.storageContactNumber,
        matchedAt: new Date().toISOString(),
      });
    }
  });

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

export function getCategoryLabel(category: ItemCategory): string {
  return CATEGORY_CONFIG[category]?.label ?? category;
}

export function getCategoryEmoji(category: ItemCategory): string {
  return CATEGORY_CONFIG[category]?.emoji ?? '📦';
}
