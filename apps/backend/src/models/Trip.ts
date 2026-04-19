import { v4 as uuidv4 } from 'uuid';

// ─── Types ───────────────────────────────────────────────────

export type TripStatus =
  | 'CREATED'
  | 'FUNDED'
  | 'RESEARCHING'
  | 'OPTIONS_READY'
  | 'BOOKING'
  | 'CONFIRMED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'FAILED';

export interface SpendingLimits {
  maxFlight: number;
  maxHotel: number;
  maxActivities: number;
  maxFood: number;
  totalBudget: number;
}

export interface TripOption {
  id: string;
  type: 'flight' | 'hotel' | 'activity';
  name: string;
  description: string;
  price: number;
  rating: number;
  imageUrl?: string;
  provider: string;
  details: Record<string, any>;
}

export interface Booking {
  id: string;
  optionId: string;
  type: 'flight' | 'hotel' | 'activity';
  name: string;
  price: number;
  confirmationCode: string;
  txHash?: string;
  paymentMethod: 'laso_card' | 'pay_send' | 'checkout';
  bookedAt: string;
}

export interface ResearchOption {
  id: string;
  category: 'flight' | 'hotel' | 'activity' | 'restaurant';
  name: string;
  description: string;
  price: number;
  rating: number;
  url: string;
  provider: string;
  withinLimit: boolean;
  isBestPick: boolean;
  details: Record<string, any>;
}

export interface ResearchResults {
  summary: string;
  flights: ResearchOption[];
  hotels: ResearchOption[];
  activities: ResearchOption[];
  restaurants: ResearchOption[];
  bestPicks: {
    flight: string;   // id of best flight
    hotel: string;    // id of best hotel
    activity: string; // id of best activity
    restaurant: string; // id of best restaurant
  };
  totalEstimatedCost: number;
  weather?: Record<string, any>;
  [key: string]: any;
}

export interface Trip {
  id: string;
  userId: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  preferences: string;
  status: TripStatus;
  spendingLimits: SpendingLimits;
  totalBudget: number;
  totalSpent: number;
  subwalletAddress?: string;
  checkoutSessionId?: string;
  researchResults?: ResearchResults;
  options: TripOption[];
  selectedOptions: string[];
  bookings: Booking[];
  createdAt: string;
  updatedAt: string;
}

// ─── In-Memory Store (replace with Postgres addon later) ─────

const trips: Map<string, Trip> = new Map();

export function createTrip(data: {
  userId: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  preferences: string;
  totalBudget: number;
  spendingLimits: Partial<SpendingLimits>;
}): Trip {
  const trip: Trip = {
    id: uuidv4(),
    userId: data.userId,
    origin: data.origin || '',
    destination: data.destination,
    startDate: data.startDate,
    endDate: data.endDate,
    travelers: data.travelers,
    preferences: data.preferences,
    status: 'CREATED',
    totalBudget: data.totalBudget,
    totalSpent: 0,
    spendingLimits: {
      maxFlight: data.spendingLimits.maxFlight ?? data.totalBudget * 0.4,
      maxHotel: data.spendingLimits.maxHotel ?? data.totalBudget * 0.35,
      maxActivities: data.spendingLimits.maxActivities ?? data.totalBudget * 0.15,
      maxFood: data.spendingLimits.maxFood ?? data.totalBudget * 0.1,
      totalBudget: data.totalBudget,
    },
    options: [],
    selectedOptions: [],
    bookings: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  trips.set(trip.id, trip);
  return trip;
}

export function getTrip(id: string): Trip | undefined {
  return trips.get(id);
}

export function getAllTrips(): Trip[] {
  return Array.from(trips.values());
}

export function updateTrip(id: string, updates: Partial<Trip>): Trip | undefined {
  const trip = trips.get(id);
  if (!trip) return undefined;

  const updated = {
    ...trip,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  trips.set(id, updated);
  return updated;
}

export function updateTripStatus(id: string, status: TripStatus): Trip | undefined {
  return updateTrip(id, { status });
}
