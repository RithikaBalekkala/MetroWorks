import type { AmenityCategory } from './metro-network';

export interface AmenityDisplayConfig {
  category: AmenityCategory;
  label: string;
  shortLabel: string;
  emoji: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
  description: string;
}

export const AMENITY_CONFIG: Record<AmenityCategory, AmenityDisplayConfig> = {
  HOSPITALS: {
    category: 'HOSPITALS',
    label: 'Hospitals Nearby',
    shortLabel: 'Hospital',
    emoji: '🏥',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    dotColor: 'bg-red-500',
    description: 'Medical facilities within walking distance',
  },
  EDUCATION: {
    category: 'EDUCATION',
    label: 'Educational Institutions',
    shortLabel: 'Education',
    emoji: '🎓',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500',
    description: 'Schools, colleges and universities nearby',
  },
  HOTELS: {
    category: 'HOTELS',
    label: 'Hotels & Stay',
    shortLabel: 'Hotels',
    emoji: '🏨',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    dotColor: 'bg-yellow-500',
    description: 'Hotels and accommodation nearby',
  },
  MALLS: {
    category: 'MALLS',
    label: 'Shopping Malls',
    shortLabel: 'Shopping',
    emoji: '🛍️',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
    dotColor: 'bg-pink-500',
    description: 'Malls and shopping centres nearby',
  },
  TOURISM: {
    category: 'TOURISM',
    label: 'Tourist Attractions',
    shortLabel: 'Tourism',
    emoji: '🏛️',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    dotColor: 'bg-orange-500',
    description: 'Landmarks and tourist spots nearby',
  },
  TECH_PARKS: {
    category: 'TECH_PARKS',
    label: 'Tech Parks',
    shortLabel: 'Tech Hub',
    emoji: '💻',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    dotColor: 'bg-purple-500',
    description: 'IT parks and tech companies nearby',
  },
  RAILWAY: {
    category: 'RAILWAY',
    label: 'Railway Station',
    shortLabel: 'Railway',
    emoji: '🚂',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    dotColor: 'bg-slate-500',
    description: 'Railway station connectivity',
  },
  BUS_TERMINAL: {
    category: 'BUS_TERMINAL',
    label: 'Bus Terminal',
    shortLabel: 'Bus Stand',
    emoji: '🚌',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    dotColor: 'bg-green-500',
    description: 'Bus stand and KSRTC terminal nearby',
  },
  AIRPORT_CONNECT: {
    category: 'AIRPORT_CONNECT',
    label: 'Airport Connectivity',
    shortLabel: 'Airport',
    emoji: '✈️',
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200',
    dotColor: 'bg-sky-500',
    description: 'Airport bus or shuttle connectivity',
  },
  GOVERNMENT: {
    category: 'GOVERNMENT',
    label: 'Government Offices',
    shortLabel: 'Govt',
    emoji: '🏛️',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    dotColor: 'bg-indigo-500',
    description: 'Government buildings and offices nearby',
  },
  BIKE_PARKING: {
    category: 'BIKE_PARKING',
    label: 'Bike Parking',
    shortLabel: 'Bike Park',
    emoji: '🏍️',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-200',
    dotColor: 'bg-cyan-500',
    description: 'Two-wheeler and bike parking available at this station',
  },
  CAR_PARKING: {
    category: 'CAR_PARKING',
    label: 'Car Parking',
    shortLabel: 'Car Park',
    emoji: '🚗',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
    dotColor: 'bg-teal-500',
    description: 'Four-wheeler car parking available at this station',
  },
};

export function getAmenityConfig(
  category: AmenityCategory
): AmenityDisplayConfig {
  return AMENITY_CONFIG[category];
}
