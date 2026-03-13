import { FunctionTool } from '@google/adk';
import { Type, type Schema } from '@google/genai';
import type { PlaceSuggestion, PlacesToolResult } from '@/lib/adk/types';

const placesParameters: Schema = {
  type: Type.OBJECT,
  properties: {
    station: { type: Type.STRING },
    timeOfDay: { type: Type.STRING, enum: ['morning', 'afternoon', 'evening'] },
  },
  required: ['station'],
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

type StationKey =
  | 'MG Road'
  | 'Indiranagar'
  | 'Whitefield'
  | 'Majestic'
  | 'Silk Institute'
  | 'Cubbon Park'
  | 'Yeshwanthpur'
  | 'Koramangala';

interface PlaceDbEntry {
  foodAndCafes: PlaceSuggestion[];
  historicalAndCultural: PlaceSuggestion[];
  shopping: PlaceSuggestion[];
  parks: PlaceSuggestion[];
}

const PLACES_DB: Record<StationKey, PlaceDbEntry> = {
  'MG Road': {
    foodAndCafes: [
      { name: "Koshy's", category: 'Food and Cafes', walkingMinutes: 8, description: 'Classic Bengaluru cafe for old-school breakfast and coffee.', vibeTag: 'heritage cafe' },
      { name: 'Church Street Social', category: 'Food and Cafes', walkingMinutes: 10, description: 'Lively cafe bar with fusion comfort food.', vibeTag: 'tourist favourite' },
      { name: 'India Coffee House', category: 'Food and Cafes', walkingMinutes: 11, description: 'Budget-friendly filter coffee and quick bites.', vibeTag: 'local gem' },
      { name: 'Matteo Coffea', category: 'Food and Cafes', walkingMinutes: 9, description: 'Bright coffeehouse for work-friendly brunches.', vibeTag: 'cozy stop' },
      { name: 'Airlines Hotel', category: 'Food and Cafes', walkingMinutes: 14, description: 'Open-air South Indian tiffin spot.', vibeTag: 'heritage eatery' },
      { name: 'Smoke House Deli', category: 'Food and Cafes', walkingMinutes: 15, description: 'Modern continental dining with polished ambience.', vibeTag: 'date night' },
    ],
    historicalAndCultural: [
      { name: 'Vidhana Soudha Viewpoint', category: 'Historical and Cultural', walkingMinutes: 17, description: 'Iconic government building facade and photo stop.', vibeTag: 'must-see landmark', freeEntry: true },
      { name: 'St. Mark\'s Cathedral', category: 'Historical and Cultural', walkingMinutes: 12, description: 'Colonial-era cathedral with serene grounds.', vibeTag: 'quiet heritage', freeEntry: true },
      { name: 'Bangalore Palace Road View', category: 'Historical and Cultural', walkingMinutes: 24, description: 'Historic palace precinct from the outer grounds.', vibeTag: 'royal nostalgia', freeEntry: false },
      { name: 'Rangoli Metro Art Center', category: 'Historical and Cultural', walkingMinutes: 6, description: 'Public metro art gallery under MG Road station.', vibeTag: 'creative local', freeEntry: true },
      { name: 'Visvesvaraya Museum', category: 'Historical and Cultural', walkingMinutes: 20, description: 'Science and innovation exhibits for all ages.', vibeTag: 'educational pick', freeEntry: false },
      { name: 'Mayo Hall', category: 'Historical and Cultural', walkingMinutes: 9, description: 'Colonial civic building near the boulevard.', vibeTag: 'architectural stop', freeEntry: true },
    ],
    shopping: [
      { name: 'Brigade Road', category: 'Shopping', walkingMinutes: 7, description: 'Main high-street strip for fashion and gadgets.', vibeTag: 'street buzz', freeEntry: true },
      { name: 'Commercial Street', category: 'Shopping', walkingMinutes: 16, description: 'Dense market lanes with bargains and textiles.', vibeTag: 'bargain hunt', freeEntry: true },
      { name: 'UB City', category: 'Shopping', walkingMinutes: 13, description: 'Luxury mall with premium brands and dining.', vibeTag: 'upscale luxury', freeEntry: true },
      { name: 'Blossom Book House', category: 'Shopping', walkingMinutes: 11, description: 'Beloved bookstore with used and rare finds.', vibeTag: 'book lover\'s haven', freeEntry: true },
      { name: 'Garuda Mall', category: 'Shopping', walkingMinutes: 8, description: 'Compact mall for quick retail runs.', vibeTag: 'easy shopping', freeEntry: true },
      { name: 'Church Street Boutiques', category: 'Shopping', walkingMinutes: 10, description: 'Independent labels and local crafts.', vibeTag: 'indie picks', freeEntry: true },
    ],
    parks: [
      { name: 'Cubbon Park', category: 'Parks', walkingMinutes: 14, description: 'Large heritage park with tree-lined trails.', vibeTag: 'morning calm', freeEntry: true },
      { name: 'Lalbagh Botanical Garden', category: 'Parks', walkingMinutes: 28, description: 'Historic botanical garden with glass house.', vibeTag: 'weekend favorite', freeEntry: false },
      { name: 'Mahatma Gandhi Park', category: 'Parks', walkingMinutes: 9, description: 'Small central green space for short breaks.', vibeTag: 'quick breather', freeEntry: true },
      { name: 'Cariappa Memorial Park', category: 'Parks', walkingMinutes: 18, description: 'Quiet lawns and shaded seating.', vibeTag: 'family stroll', freeEntry: true },
      { name: 'Ulsoor Lake Promenade', category: 'Parks', walkingMinutes: 20, description: 'Lakeside walking route with city views.', vibeTag: 'sunset walk', freeEntry: true },
      { name: 'Freedom Park', category: 'Parks', walkingMinutes: 22, description: 'Open civic park with event space.', vibeTag: 'urban park', freeEntry: true },
    ],
  },
  Indiranagar: {
    foodAndCafes: [
      { name: 'Toit Brewery', category: 'Food and Cafes', walkingMinutes: 12, description: 'Flagship craft brewery with hearty menu.', vibeTag: 'tourist favourite' },
      { name: 'The Fatty Bao', category: 'Food and Cafes', walkingMinutes: 9, description: 'Pan-Asian small plates in a lively setting.', vibeTag: 'foodie spot' },
      { name: 'Cafe Max', category: 'Food and Cafes', walkingMinutes: 7, description: 'Casual diner for sandwiches and desserts.', vibeTag: 'comfort bites' },
      { name: 'Third Wave Coffee', category: 'Food and Cafes', walkingMinutes: 6, description: 'Specialty coffee and work-friendly seats.', vibeTag: 'remote work' },
      { name: 'Sly Granny', category: 'Food and Cafes', walkingMinutes: 11, description: 'Creative menu with upscale interiors.', vibeTag: 'trendy dining' },
      { name: 'Milano Ice Cream', category: 'Food and Cafes', walkingMinutes: 8, description: 'Popular gelato stop on 100 Feet Road.', vibeTag: 'sweet stop' },
    ],
    historicalAndCultural: [
      { name: 'Bangalore Literature Trails', category: 'Historical and Cultural', walkingMinutes: 13, description: 'Curated neighborhood storytelling walks.', vibeTag: 'culture walk', freeEntry: false },
      { name: 'Rangashankara', category: 'Historical and Cultural', walkingMinutes: 22, description: 'Leading theatre venue for Kannada and English plays.', vibeTag: 'performing arts', freeEntry: false },
      { name: 'HAL Heritage Centre (drive)', category: 'Historical and Cultural', walkingMinutes: 25, description: 'Aviation museum and outdoor aircraft displays.', vibeTag: 'museum stop', freeEntry: false },
      { name: 'Street Art Lanes', category: 'Historical and Cultural', walkingMinutes: 10, description: 'Colorful murals around Indiranagar bylanes.', vibeTag: 'instagrammable', freeEntry: true },
      { name: '100 Feet Road Heritage Residences', category: 'Historical and Cultural', walkingMinutes: 7, description: 'Old bungalow-style architecture pockets.', vibeTag: 'city nostalgia', freeEntry: true },
      { name: 'Domlur Choultry', category: 'Historical and Cultural', walkingMinutes: 20, description: 'Traditional architecture and local history node.', vibeTag: 'hidden heritage', freeEntry: true },
    ],
    shopping: [
      { name: '100 Feet Road Boutiques', category: 'Shopping', walkingMinutes: 5, description: 'Fashion, lifestyle and local designer outlets.', vibeTag: 'style district', freeEntry: true },
      { name: '12th Main Stores', category: 'Shopping', walkingMinutes: 9, description: 'Dense shopping strip with indie brands.', vibeTag: 'local labels', freeEntry: true },
      { name: 'Phoenix Marketcity', category: 'Shopping', walkingMinutes: 22, description: 'Large mall with major brand anchors.', vibeTag: 'mall day', freeEntry: true },
      { name: 'Indiranagar Market', category: 'Shopping', walkingMinutes: 7, description: 'Neighborhood market for essentials and flowers.', vibeTag: 'daily bustle', freeEntry: true },
      { name: 'Church Street (short ride)', category: 'Shopping', walkingMinutes: 23, description: 'Books, records, and cafes in one stretch.', vibeTag: 'explorer route', freeEntry: true },
      { name: 'Lifestyle Stores', category: 'Shopping', walkingMinutes: 10, description: 'Multi-brand fashion stop.', vibeTag: 'quick pick', freeEntry: true },
    ],
    parks: [
      { name: 'Indiranagar BBMP Park', category: 'Parks', walkingMinutes: 8, description: 'Small green lung for quick walks.', vibeTag: 'calm break', freeEntry: true },
      { name: 'Joggers Park', category: 'Parks', walkingMinutes: 12, description: 'Morning jog loop and shaded seating.', vibeTag: 'fitness pick', freeEntry: true },
      { name: 'Domlur Park', category: 'Parks', walkingMinutes: 16, description: 'Neighborhood park with children play area.', vibeTag: 'family friendly', freeEntry: true },
      { name: 'Cubbon Park', category: 'Parks', walkingMinutes: 24, description: 'Large central park accessible by metro hop.', vibeTag: 'nature pocket', freeEntry: true },
      { name: 'Ulsoor Lake', category: 'Parks', walkingMinutes: 18, description: 'Lakeside breezy promenade.', vibeTag: 'sunset walk', freeEntry: true },
      { name: 'CMH Green Strip', category: 'Parks', walkingMinutes: 7, description: 'Tree-lined median walk for short break.', vibeTag: 'micro green', freeEntry: true },
    ],
  },
  Whitefield: {
    foodAndCafes: [
      { name: '154 Breakfast Club', category: 'Food and Cafes', walkingMinutes: 11, description: 'Popular brunch venue with all-day breakfast.', vibeTag: 'breakfast favorite' },
      { name: 'The Fat Chef', category: 'Food and Cafes', walkingMinutes: 14, description: 'Comfort food and bakery options.', vibeTag: 'family dining' },
      { name: 'Cafe Noir', category: 'Food and Cafes', walkingMinutes: 16, description: 'European-style cafe near mall district.', vibeTag: 'continental cafe' },
      { name: 'A2B Whitefield', category: 'Food and Cafes', walkingMinutes: 9, description: 'Quick South Indian meals and sweets.', vibeTag: 'quick service' },
      { name: 'Smoor Dessert Lounge', category: 'Food and Cafes', walkingMinutes: 12, description: 'Desserts and coffee with premium pastries.', vibeTag: 'sweet luxury' },
      { name: 'Third Wave Coffee', category: 'Food and Cafes', walkingMinutes: 8, description: 'Specialty coffee and light meals.', vibeTag: 'remote work' },
    ],
    historicalAndCultural: [
      { name: 'Pattandur Agrahara Heritage Walk', category: 'Historical and Cultural', walkingMinutes: 18, description: 'Stories of old agrarian Whitefield.', vibeTag: 'local history', freeEntry: true },
      { name: 'Varthur Temple Trail', category: 'Historical and Cultural', walkingMinutes: 23, description: 'Traditional temple circuit in outer Whitefield.', vibeTag: 'spiritual stop', freeEntry: true },
      { name: 'Forum Art Installations', category: 'Historical and Cultural', walkingMinutes: 14, description: 'Rotating public art displays in mixed-use spaces.', vibeTag: 'modern art', freeEntry: true },
      { name: 'ITPL Heritage Campus View', category: 'Historical and Cultural', walkingMinutes: 10, description: 'Legacy tech district architecture.', vibeTag: 'tech landmark', freeEntry: true },
      { name: 'Kadugodi Community Hall', category: 'Historical and Cultural', walkingMinutes: 13, description: 'Cultural events and community gatherings.', vibeTag: 'community hub', freeEntry: true },
      { name: 'Sri Sathya Sai Campus', category: 'Historical and Cultural', walkingMinutes: 20, description: 'Notable institutional precinct.', vibeTag: 'quiet visit', freeEntry: true },
    ],
    shopping: [
      { name: 'Phoenix Marketcity', category: 'Shopping', walkingMinutes: 20, description: 'Large mall with cinemas and food court.', vibeTag: 'tourist favourite', freeEntry: true },
      { name: 'Forum Shantiniketan', category: 'Shopping', walkingMinutes: 11, description: 'Neighborhood mall for daily retail and dining.', vibeTag: 'easy stop', freeEntry: true },
      { name: 'VR Bengaluru', category: 'Shopping', walkingMinutes: 22, description: 'Lifestyle mall with rooftop spaces.', vibeTag: 'weekend plan', freeEntry: true },
      { name: 'Inorbit Mall', category: 'Shopping', walkingMinutes: 19, description: 'Family mall with broad brand mix.', vibeTag: 'mall day', freeEntry: true },
      { name: 'Brigade Street (metro hop)', category: 'Shopping', walkingMinutes: 26, description: 'City-center shopping corridor via metro ride.', vibeTag: 'city run', freeEntry: true },
      { name: 'Whitefield Main Market', category: 'Shopping', walkingMinutes: 8, description: 'Local produce and street-side stalls.', vibeTag: 'local bustle', freeEntry: true },
    ],
    parks: [
      { name: 'Kundalahalli Lake Park', category: 'Parks', walkingMinutes: 14, description: 'Lake loop with jogging paths.', vibeTag: 'morning calm', freeEntry: true },
      { name: 'Inner Circle Park', category: 'Parks', walkingMinutes: 10, description: 'Compact green area near residences.', vibeTag: 'quick break', freeEntry: true },
      { name: 'Forum Greens', category: 'Parks', walkingMinutes: 12, description: 'Open landscaped stretch in mixed-use zone.', vibeTag: 'urban green', freeEntry: true },
      { name: 'Varthur Lake Bund', category: 'Parks', walkingMinutes: 21, description: 'Lakeside promenade with broad sky views.', vibeTag: 'sunset point', freeEntry: true },
      { name: 'ITPL Greenway', category: 'Parks', walkingMinutes: 9, description: 'Tree-lined corporate district path.', vibeTag: 'office unwind', freeEntry: true },
      { name: 'Cubbon Park (metro hop)', category: 'Parks', walkingMinutes: 27, description: 'Central park reached directly by metro.', vibeTag: 'city classic', freeEntry: true },
    ],
  },
  Majestic: {
    foodAndCafes: [
      { name: 'Kamat Lokaruchi', category: 'Food and Cafes', walkingMinutes: 9, description: 'Traditional Karnataka meals and tiffin.', vibeTag: 'local gem' },
      { name: 'MTR Lalbagh (short metro hop)', category: 'Food and Cafes', walkingMinutes: 19, description: 'Iconic South Indian breakfast spot.', vibeTag: 'legendary breakfast' },
      { name: 'Hotel Janatha', category: 'Food and Cafes', walkingMinutes: 7, description: 'No-frills quick meals near transit hub.', vibeTag: 'budget stop' },
      { name: 'Empire Majestic', category: 'Food and Cafes', walkingMinutes: 8, description: 'Late-evening dining option around transit zone.', vibeTag: 'night bites' },
      { name: 'CTR (short hop)', category: 'Food and Cafes', walkingMinutes: 18, description: 'Famous benne dosa destination.', vibeTag: 'tourist favourite' },
      { name: 'A2B Majestic', category: 'Food and Cafes', walkingMinutes: 6, description: 'Reliable veg meals and sweets.', vibeTag: 'quick service' },
    ],
    historicalAndCultural: [
      { name: 'Kempegowda Bus Station Plaza', category: 'Historical and Cultural', walkingMinutes: 4, description: 'Historic intercity mobility nerve center.', vibeTag: 'city pulse', freeEntry: true },
      { name: 'Freedom Park', category: 'Historical and Cultural', walkingMinutes: 12, description: 'Converted central jail now civic park.', vibeTag: 'heritage civic', freeEntry: true },
      { name: 'City Railway Station Facade', category: 'Historical and Cultural', walkingMinutes: 7, description: 'Rail heritage architecture and transit history.', vibeTag: 'rail nostalgia', freeEntry: true },
      { name: 'KR Market Heritage Zone', category: 'Historical and Cultural', walkingMinutes: 16, description: 'Classic market district and old city texture.', vibeTag: 'old bengaluru', freeEntry: true },
      { name: 'Vidhana Soudha Viewpoint', category: 'Historical and Cultural', walkingMinutes: 18, description: 'State legislature icon visible from central corridor.', vibeTag: 'must-see landmark', freeEntry: true },
      { name: 'Tipu Summer Palace (metro hop)', category: 'Historical and Cultural', walkingMinutes: 20, description: 'Historic monument linked to Mysore era.', vibeTag: 'history walk', freeEntry: false },
    ],
    shopping: [
      { name: 'KR Market', category: 'Shopping', walkingMinutes: 15, description: 'Wholesale market for flowers and produce.', vibeTag: 'market chaos', freeEntry: true },
      { name: 'Chickpete Fabric Lanes', category: 'Shopping', walkingMinutes: 14, description: 'Textiles and wedding shopping district.', vibeTag: 'bargain hunt', freeEntry: true },
      { name: 'Majestic Book Stalls', category: 'Shopping', walkingMinutes: 6, description: 'Transit-side magazines and books.', vibeTag: 'quick browse', freeEntry: true },
      { name: 'Brigade Road (metro ride)', category: 'Shopping', walkingMinutes: 18, description: 'Popular high-street shopping by metro.', vibeTag: 'city shopping', freeEntry: true },
      { name: 'Commercial Street (metro ride)', category: 'Shopping', walkingMinutes: 20, description: 'Dense retail district with apparel and accessories.', vibeTag: 'local favourite', freeEntry: true },
      { name: 'GT World Mall', category: 'Shopping', walkingMinutes: 12, description: 'Local mall with cinema and food court.', vibeTag: 'family stop', freeEntry: true },
    ],
    parks: [
      { name: 'Freedom Park', category: 'Parks', walkingMinutes: 12, description: 'Large civic park with event lawns.', vibeTag: 'urban park', freeEntry: true },
      { name: 'Cubbon Park', category: 'Parks', walkingMinutes: 18, description: 'Major city park reachable directly by metro.', vibeTag: 'city classic', freeEntry: true },
      { name: 'Balekundri Circle Greens', category: 'Parks', walkingMinutes: 10, description: 'Pocket green for short transit breaks.', vibeTag: 'quick breather', freeEntry: true },
      { name: 'Railway Parade Green Strip', category: 'Parks', walkingMinutes: 9, description: 'Tree-lined pedestrian corridor near station.', vibeTag: 'shade walk', freeEntry: true },
      { name: 'Lalbagh (metro hop)', category: 'Parks', walkingMinutes: 17, description: 'Botanical heritage park with broad lawns.', vibeTag: 'tourist favourite', freeEntry: false },
      { name: 'Race Course Green Belt', category: 'Parks', walkingMinutes: 19, description: 'Open stretch with breezy evening walks.', vibeTag: 'sunset walk', freeEntry: true },
    ],
  },
  'Silk Institute': {
    foodAndCafes: [
      { name: 'A2B Kanakapura Road', category: 'Food and Cafes', walkingMinutes: 7, description: 'Reliable vegetarian quick meals.', vibeTag: 'commuter staple' },
      { name: 'RNR Biryani', category: 'Food and Cafes', walkingMinutes: 12, description: 'Popular local biryani stop.', vibeTag: 'local favourite' },
      { name: 'Taaza Thindi (short hop)', category: 'Food and Cafes', walkingMinutes: 18, description: 'Affordable and fast South Indian bites.', vibeTag: 'breakfast pick' },
      { name: 'Dyu Art Cafe (metro ride)', category: 'Food and Cafes', walkingMinutes: 22, description: 'Art-themed cafe in JP Nagar vicinity.', vibeTag: 'creative nook' },
      { name: 'Cafe Coffee Day Kanakapura', category: 'Food and Cafes', walkingMinutes: 9, description: 'Quick coffee stop near station.', vibeTag: 'quick caffeine' },
      { name: 'Udupi Upahar', category: 'Food and Cafes', walkingMinutes: 11, description: 'Classic dosa-idli place for family visits.', vibeTag: 'budget meal' },
    ],
    historicalAndCultural: [
      { name: 'Art of Living Campus (drive)', category: 'Historical and Cultural', walkingMinutes: 25, description: 'Large spiritual and cultural campus nearby.', vibeTag: 'serene visit', freeEntry: false },
      { name: 'JP Nagar Community Cultural Center', category: 'Historical and Cultural', walkingMinutes: 17, description: 'Local performances and workshops.', vibeTag: 'community culture', freeEntry: true },
      { name: 'Banashankari Temple Zone', category: 'Historical and Cultural', walkingMinutes: 20, description: 'Traditional temple and old neighborhood culture.', vibeTag: 'local heritage', freeEntry: true },
      { name: 'Ragi Gudda Trail', category: 'Historical and Cultural', walkingMinutes: 18, description: 'Neighborhood heritage trail and viewpoints.', vibeTag: 'hidden local', freeEntry: true },
      { name: 'Vidhana Soudha Viewpoint (metro ride)', category: 'Historical and Cultural', walkingMinutes: 28, description: 'Iconic city landmark accessible by direct line.', vibeTag: 'must-see landmark', freeEntry: true },
      { name: 'Lalbagh Glass House (metro hop)', category: 'Historical and Cultural', walkingMinutes: 23, description: 'Historic glasshouse and floral displays.', vibeTag: 'heritage garden', freeEntry: false },
    ],
    shopping: [
      { name: 'Gopalan Innovation Mall', category: 'Shopping', walkingMinutes: 15, description: 'Mall with multiplex and food options.', vibeTag: 'weekend stop', freeEntry: true },
      { name: 'JP Nagar 15th Cross Stores', category: 'Shopping', walkingMinutes: 13, description: 'Local shopping streets for daily needs.', vibeTag: 'local bustle', freeEntry: true },
      { name: 'Vega City Mall (metro ride)', category: 'Shopping', walkingMinutes: 24, description: 'Large mall destination with major brands.', vibeTag: 'tourist favourite', freeEntry: true },
      { name: 'Banashankari Market', category: 'Shopping', walkingMinutes: 18, description: 'Traditional market lanes and produce stores.', vibeTag: 'market run', freeEntry: true },
      { name: '100 Feet Road JP Nagar', category: 'Shopping', walkingMinutes: 16, description: 'Boutique retail and lifestyle shops.', vibeTag: 'indie finds', freeEntry: true },
      { name: 'Lalbagh Road Retail Strip', category: 'Shopping', walkingMinutes: 21, description: 'Mixed retail cluster reachable by metro.', vibeTag: 'city shopping', freeEntry: true },
    ],
    parks: [
      { name: 'JP Park South', category: 'Parks', walkingMinutes: 10, description: 'Neighborhood park with jogging tracks.', vibeTag: 'morning calm', freeEntry: true },
      { name: 'Lalbagh Botanical Garden', category: 'Parks', walkingMinutes: 23, description: 'Historic botanical destination.', vibeTag: 'tourist favourite', freeEntry: false },
      { name: 'Turahalli Forest Trail', category: 'Parks', walkingMinutes: 24, description: 'Rocky forest trail for early hikes.', vibeTag: 'adventure pick', freeEntry: true },
      { name: 'Banashankari Park', category: 'Parks', walkingMinutes: 14, description: 'Family-friendly local park and play zones.', vibeTag: 'family stroll', freeEntry: true },
      { name: 'Jayanagar 9th Block Park', category: 'Parks', walkingMinutes: 16, description: 'Tree-lined park and seating corners.', vibeTag: 'quiet reset', freeEntry: true },
      { name: 'NICE Road Green Belt', category: 'Parks', walkingMinutes: 12, description: 'Linear green stretch along corridor.', vibeTag: 'quick breather', freeEntry: true },
    ],
  },
  'Cubbon Park': {
    foodAndCafes: [
      { name: "Koshy's", category: 'Food and Cafes', walkingMinutes: 12, description: 'Timeless Bengaluru breakfast and coffee spot.', vibeTag: 'heritage cafe' },
      { name: 'Cafe Azzure', category: 'Food and Cafes', walkingMinutes: 10, description: 'Light meals near park edge.', vibeTag: 'parkside cafe' },
      { name: 'Church Street Social', category: 'Food and Cafes', walkingMinutes: 13, description: 'Lively cafe for evening plans.', vibeTag: 'tourist favourite' },
      { name: 'Airlines Hotel', category: 'Food and Cafes', walkingMinutes: 14, description: 'Open-air tiffin spot near central district.', vibeTag: 'local classic' },
      { name: 'MTR (metro ride)', category: 'Food and Cafes', walkingMinutes: 21, description: 'Legendary South Indian meals.', vibeTag: 'breakfast icon' },
      { name: 'Smoor', category: 'Food and Cafes', walkingMinutes: 11, description: 'Desserts and coffee in premium format.', vibeTag: 'sweet stop' },
    ],
    historicalAndCultural: [
      { name: 'Cubbon Park Library Precinct', category: 'Historical and Cultural', walkingMinutes: 5, description: 'Historic red building and tree canopies.', vibeTag: 'heritage photo spot', freeEntry: true },
      { name: 'Vidhana Soudha Viewpoint', category: 'Historical and Cultural', walkingMinutes: 11, description: 'Iconic civic architecture and skyline shots.', vibeTag: 'must-see landmark', freeEntry: true },
      { name: 'Visvesvaraya Museum', category: 'Historical and Cultural', walkingMinutes: 9, description: 'Science museum for all age groups.', vibeTag: 'educational pick', freeEntry: false },
      { name: 'State Central Library', category: 'Historical and Cultural', walkingMinutes: 6, description: 'Historic library building inside park grounds.', vibeTag: 'quiet heritage', freeEntry: true },
      { name: 'High Court Building View', category: 'Historical and Cultural', walkingMinutes: 10, description: 'Striking colonial-era architecture nearby.', vibeTag: 'architecture walk', freeEntry: true },
      { name: 'Rangoli Art Center', category: 'Historical and Cultural', walkingMinutes: 13, description: 'Metro art and local exhibits.', vibeTag: 'creative local', freeEntry: true },
    ],
    shopping: [
      { name: 'Brigade Road', category: 'Shopping', walkingMinutes: 14, description: 'Fashion and lifestyle high street.', vibeTag: 'city shopping', freeEntry: true },
      { name: 'Church Street', category: 'Shopping', walkingMinutes: 12, description: 'Books, records and indie stores.', vibeTag: 'indie finds', freeEntry: true },
      { name: 'Blossom Book House', category: 'Shopping', walkingMinutes: 13, description: 'Beloved used and rare book stop.', vibeTag: 'book lover\'s haven', freeEntry: true },
      { name: 'UB City', category: 'Shopping', walkingMinutes: 15, description: 'Luxury retail and dining.', vibeTag: 'upscale luxury', freeEntry: true },
      { name: 'Commercial Street', category: 'Shopping', walkingMinutes: 17, description: 'Dense market lanes with bargains.', vibeTag: 'bargain hunt', freeEntry: true },
      { name: 'Cauvery Emporium', category: 'Shopping', walkingMinutes: 10, description: 'Authentic Karnataka handicrafts and silk.', vibeTag: 'cultural shopping', freeEntry: true },
    ],
    parks: [
      { name: 'Cubbon Park Core', category: 'Parks', walkingMinutes: 2, description: 'Massive tree canopy and jogging trails.', vibeTag: 'morning calm', freeEntry: true },
      { name: 'Bal Bhavan', category: 'Parks', walkingMinutes: 7, description: 'Family-friendly play spaces and toy train zone.', vibeTag: 'family favourite', freeEntry: true },
      { name: 'Lalbagh', category: 'Parks', walkingMinutes: 21, description: 'Botanical icon with glass house.', vibeTag: 'tourist favourite', freeEntry: false },
      { name: 'Ulsoor Lake', category: 'Parks', walkingMinutes: 20, description: 'Lakeside walks and breezy evenings.', vibeTag: 'sunset walk', freeEntry: true },
      { name: 'Freedom Park', category: 'Parks', walkingMinutes: 16, description: 'Civic park and event lawns.', vibeTag: 'urban park', freeEntry: true },
      { name: 'Cariappa Park', category: 'Parks', walkingMinutes: 18, description: 'Shaded lawns and quiet pathways.', vibeTag: 'quiet reset', freeEntry: true },
    ],
  },
  Yeshwanthpur: {
    foodAndCafes: [
      { name: 'Veena Stores (short hop)', category: 'Food and Cafes', walkingMinutes: 15, description: 'Iconic breakfast destination nearby.', vibeTag: 'local gem' },
      { name: 'A2B Yeshwanthpur', category: 'Food and Cafes', walkingMinutes: 8, description: 'Quick South Indian meals and snacks.', vibeTag: 'quick service' },
      { name: 'New Krishna Bhavan', category: 'Food and Cafes', walkingMinutes: 9, description: 'Budget-friendly veg meals.', vibeTag: 'budget meal' },
      { name: 'Empire Yeshwanthpur', category: 'Food and Cafes', walkingMinutes: 10, description: 'Late-evening food option.', vibeTag: 'night bites' },
      { name: 'CCD Orion Mall', category: 'Food and Cafes', walkingMinutes: 16, description: 'Cafe stop inside mall zone.', vibeTag: 'mall break' },
      { name: 'Truffles Rajajinagar', category: 'Food and Cafes', walkingMinutes: 18, description: 'Popular burgers and shakes.', vibeTag: 'youth favourite' },
    ],
    historicalAndCultural: [
      { name: 'ISKCON Bangalore', category: 'Historical and Cultural', walkingMinutes: 17, description: 'Prominent temple complex with city views.', vibeTag: 'spiritual landmark', freeEntry: true },
      { name: 'Sandal Soap Factory Heritage Node', category: 'Historical and Cultural', walkingMinutes: 10, description: 'Industrial heritage around old factory zone.', vibeTag: 'city nostalgia', freeEntry: true },
      { name: 'Bangalore International Exhibition Area (hop)', category: 'Historical and Cultural', walkingMinutes: 24, description: 'Large public events and fairs venue.', vibeTag: 'event hub', freeEntry: false },
      { name: 'Yeshwanthpur Rail Heritage Walk', category: 'Historical and Cultural', walkingMinutes: 7, description: 'Historic rail district stories.', vibeTag: 'rail nostalgia', freeEntry: true },
      { name: 'Malleswaram Cultural Streets', category: 'Historical and Cultural', walkingMinutes: 15, description: 'Old Bengaluru neighborhoods and markets.', vibeTag: 'heritage walk', freeEntry: true },
      { name: 'Vidhana Soudha Viewpoint (metro hop)', category: 'Historical and Cultural', walkingMinutes: 22, description: 'Iconic city landmark access via direct line.', vibeTag: 'must-see landmark', freeEntry: true },
    ],
    shopping: [
      { name: 'Orion Mall', category: 'Shopping', walkingMinutes: 16, description: 'Large lifestyle mall with lakefront.', vibeTag: 'tourist favourite', freeEntry: true },
      { name: 'Malleswaram 8th Cross', category: 'Shopping', walkingMinutes: 18, description: 'Traditional shopping lane and saree stores.', vibeTag: 'local market', freeEntry: true },
      { name: 'Yeshwanthpur APMC Market', category: 'Shopping', walkingMinutes: 11, description: 'Wholesale produce market and daily bustle.', vibeTag: 'market chaos', freeEntry: true },
      { name: 'Brigade Road (metro ride)', category: 'Shopping', walkingMinutes: 26, description: 'Central high street accessible by metro.', vibeTag: 'city shopping', freeEntry: true },
      { name: 'Commercial Street (metro ride)', category: 'Shopping', walkingMinutes: 27, description: 'Dense bargain retail district.', vibeTag: 'bargain hunt', freeEntry: true },
      { name: 'Rajajinagar Retail Strip', category: 'Shopping', walkingMinutes: 14, description: 'Mixed shopping and daily essentials.', vibeTag: 'easy stop', freeEntry: true },
    ],
    parks: [
      { name: 'Sankey Tank', category: 'Parks', walkingMinutes: 18, description: 'Lakeside walk and jogging route.', vibeTag: 'sunset walk', freeEntry: true },
      { name: 'Orion Lakefront', category: 'Parks', walkingMinutes: 16, description: 'Urban lake edge with public seating.', vibeTag: 'urban green', freeEntry: true },
      { name: 'JP Park (north)', category: 'Parks', walkingMinutes: 20, description: 'Large landscaped park area.', vibeTag: 'family stroll', freeEntry: true },
      { name: 'Malleswaram Ground Green', category: 'Parks', walkingMinutes: 12, description: 'Compact public ground and tree shade.', vibeTag: 'quick breather', freeEntry: true },
      { name: 'Cubbon Park (metro hop)', category: 'Parks', walkingMinutes: 24, description: 'Historic central park accessible quickly.', vibeTag: 'city classic', freeEntry: true },
      { name: 'Palace Grounds Green Belt', category: 'Parks', walkingMinutes: 22, description: 'Open green expanse around event grounds.', vibeTag: 'open skies', freeEntry: true },
    ],
  },
  Koramangala: {
    foodAndCafes: [
      { name: 'Third Wave Koramangala', category: 'Food and Cafes', walkingMinutes: 8, description: 'Popular specialty coffee with work seating.', vibeTag: 'remote work' },
      { name: 'Truffles Koramangala', category: 'Food and Cafes', walkingMinutes: 9, description: 'Beloved burgers and comfort food.', vibeTag: 'youth favourite' },
      { name: 'Dyu Art Cafe', category: 'Food and Cafes', walkingMinutes: 11, description: 'Artful cafe with calm courtyard vibe.', vibeTag: 'creative nook' },
      { name: 'Fenny\'s Lounge', category: 'Food and Cafes', walkingMinutes: 13, description: 'Rooftop dining and evening atmosphere.', vibeTag: 'dinner pick' },
      { name: 'Hole in the Wall Cafe', category: 'Food and Cafes', walkingMinutes: 10, description: 'Popular breakfast and brunch spot.', vibeTag: 'breakfast favorite' },
      { name: 'A2B Koramangala', category: 'Food and Cafes', walkingMinutes: 7, description: 'Quick vegetarian meals.', vibeTag: 'quick service' },
    ],
    historicalAndCultural: [
      { name: 'St. John\'s Heritage Campus', category: 'Historical and Cultural', walkingMinutes: 17, description: 'Old campus architecture and city history.', vibeTag: 'heritage walk', freeEntry: true },
      { name: 'Koramangala Cultural Street Murals', category: 'Historical and Cultural', walkingMinutes: 9, description: 'Street art and community walls.', vibeTag: 'instagrammable', freeEntry: true },
      { name: 'Lalbagh (short metro+ride)', category: 'Historical and Cultural', walkingMinutes: 20, description: 'Historic botanical destination close by.', vibeTag: 'heritage garden', freeEntry: false },
      { name: 'Vidhana Soudha Viewpoint (metro ride)', category: 'Historical and Cultural', walkingMinutes: 28, description: 'Civic icon with broad avenue views.', vibeTag: 'must-see landmark', freeEntry: true },
      { name: 'Rangashankara', category: 'Historical and Cultural', walkingMinutes: 24, description: 'Top theatre venue for stage performances.', vibeTag: 'performing arts', freeEntry: false },
      { name: 'BTM Lake Story Walk', category: 'Historical and Cultural', walkingMinutes: 16, description: 'Guided local history around urban lakes.', vibeTag: 'local stories', freeEntry: true },
    ],
    shopping: [
      { name: 'Forum Mall Koramangala', category: 'Shopping', walkingMinutes: 8, description: 'Classic mall with multiplex and brands.', vibeTag: 'mall day', freeEntry: true },
      { name: 'Sony World Junction Stores', category: 'Shopping', walkingMinutes: 7, description: 'Dense shopping cluster for lifestyle buys.', vibeTag: 'easy shopping', freeEntry: true },
      { name: '100 Feet Road', category: 'Shopping', walkingMinutes: 10, description: 'Fashion, dining, and boutique retail strip.', vibeTag: 'street buzz', freeEntry: true },
      { name: 'Brigade Road (metro ride)', category: 'Shopping', walkingMinutes: 24, description: 'Major high-street corridor by metro.', vibeTag: 'city shopping', freeEntry: true },
      { name: 'Commercial Street (metro ride)', category: 'Shopping', walkingMinutes: 25, description: 'Bargain shopping destination.', vibeTag: 'bargain hunt', freeEntry: true },
      { name: 'Blossom Book House (metro ride)', category: 'Shopping', walkingMinutes: 23, description: 'Iconic bookstore stop in central district.', vibeTag: 'book lover\'s haven', freeEntry: true },
    ],
    parks: [
      { name: 'Agara Lake', category: 'Parks', walkingMinutes: 14, description: 'Lakeside track and birdwatching zone.', vibeTag: 'sunset walk', freeEntry: true },
      { name: 'Madiwala Lake', category: 'Parks', walkingMinutes: 15, description: 'Large urban lake with green edges.', vibeTag: 'city nature', freeEntry: true },
      { name: 'Koramangala BBMP Park', category: 'Parks', walkingMinutes: 7, description: 'Compact neighborhood park for short breaks.', vibeTag: 'quick breather', freeEntry: true },
      { name: 'Lalbagh', category: 'Parks', walkingMinutes: 20, description: 'Historic garden with broad walking loops.', vibeTag: 'tourist favourite', freeEntry: false },
      { name: 'Cubbon Park (metro ride)', category: 'Parks', walkingMinutes: 24, description: 'Central heritage park via metro access.', vibeTag: 'city classic', freeEntry: true },
      { name: 'HSR Lake Park', category: 'Parks', walkingMinutes: 18, description: 'Quiet residential greens nearby.', vibeTag: 'calm reset', freeEntry: true },
    ],
  },
};

function normalizeStation(station: string): StationKey {
  const lower = station.toLowerCase();
  if (lower.includes('mg road')) return 'MG Road';
  if (lower.includes('indiranagar')) return 'Indiranagar';
  if (lower.includes('whitefield')) return 'Whitefield';
  if (lower.includes('majestic') || lower.includes('kempegowda')) return 'Majestic';
  if (lower.includes('silk')) return 'Silk Institute';
  if (lower.includes('cubbon')) return 'Cubbon Park';
  if (lower.includes('yeshwanthpur')) return 'Yeshwanthpur';
  return 'Koramangala';
}

function filterByTime(items: PlaceSuggestion[], timeOfDay: 'morning' | 'afternoon' | 'evening'): PlaceSuggestion[] {
  if (timeOfDay === 'morning') {
    return [...items].sort((a, b) => {
      const aBreakfast = a.description.toLowerCase().includes('breakfast') ? -1 : 0;
      const bBreakfast = b.description.toLowerCase().includes('breakfast') ? -1 : 0;
      return aBreakfast - bBreakfast;
    });
  }
  if (timeOfDay === 'evening') {
    return [...items].sort((a, b) => {
      const aDinner = a.description.toLowerCase().includes('dinner') ? -1 : 0;
      const bDinner = b.description.toLowerCase().includes('dinner') ? -1 : 0;
      return aDinner - bDinner;
    });
  }
  return items;
}

export async function runPlacesTool(input: unknown): Promise<PlacesToolResult> {
  const payload = asRecord(input);
  const stationInput = asString(payload.station, 'MG Road');
  const todRaw = asString(payload.timeOfDay, 'afternoon');
  const timeOfDay: 'morning' | 'afternoon' | 'evening' =
    todRaw === 'morning' || todRaw === 'evening' ? todRaw : 'afternoon';

  const stationKey = normalizeStation(stationInput);
  const base = PLACES_DB[stationKey];

  return {
    station: stationKey,
    timeOfDay,
    foodAndCafes: filterByTime(base.foodAndCafes, timeOfDay),
    historicalAndCultural: base.historicalAndCultural,
    shopping: base.shopping,
    parks: base.parks,
  };
}

export const placesTool = new FunctionTool({
  name: 'placesTool',
  description: 'Suggest nearby Bengaluru places grouped by category for a destination station.',
  parameters: placesParameters,
  execute: runPlacesTool,
});
