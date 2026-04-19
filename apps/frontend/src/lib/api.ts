const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
    flight: string;
    hotel: string;
    activity: string;
    restaurant: string;
  };
  totalEstimatedCost: number;
  weather?: Record<string, any>;
  finalizedPlan?: {
    flight: ResearchOption;
    hotel: ResearchOption;
    activities: ResearchOption[];
    restaurants: ResearchOption[];
  };
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
  status: string;
  totalBudget: number;
  totalSpent: number;
  spendingLimits: {
    maxFlight: number;
    maxHotel: number;
    maxActivities: number;
    maxFood: number;
    totalBudget: number;
  };
  subwalletAddress?: string;
  checkoutSessionId?: string;
  researchResults?: ResearchResults;
  options: TripOption[];
  selectedOptions: string[];
  bookings: Booking[];
  createdAt: string;
  updatedAt: string;
}

export interface TripOption {
  id: string;
  type: 'flight' | 'hotel' | 'activity';
  name: string;
  description: string;
  price: number;
  rating: number;
  provider: string;
  details: Record<string, any>;
}

export interface Booking {
  id: string;
  optionId: string;
  type: string;
  name: string;
  price: number;
  confirmationCode: string;
  txHash?: string;
  paymentMethod: string;
  bookedAt: string;
}

export interface AuditEntry {
  id: string;
  tripId: string;
  timestamp: string;
  agentName: string;
  action: string;
  reasoning: string;
  apiProvider?: string;
  apiCost?: number;
  txHash?: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

export interface WalletBalance {
  balanceUsdc: string;
  walletAddress: string;
  chain: string;
  promoCredits?: string;
}

// ─── API Functions ───────────────────────────────────────────

export async function createTrip(data: {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  preferences: string;
  totalBudget: number;
  spendingLimits?: Partial<Trip['spendingLimits']>;
}): Promise<Trip> {
  const res = await fetch(`${API_BASE}/api/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getTrip(id: string): Promise<Trip> {
  const res = await fetch(`${API_BASE}/api/trips/${id}`);
  return res.json();
}

export async function getAllTrips(): Promise<Trip[]> {
  const res = await fetch(`${API_BASE}/api/trips`);
  return res.json();
}

export async function createCheckoutSession(tripId: string, amount: string) {
  const res = await fetch(`${API_BASE}/api/checkout/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tripId, amount }),
  });
  return res.json();
}

export async function confirmCheckout(sessionId: string) {
  const res = await fetch(`${API_BASE}/api/checkout/sessions/${sessionId}/confirm`, {
    method: 'POST',
  });
  return res.json();
}

export async function triggerResearch(tripId: string) {
  const res = await fetch(`${API_BASE}/api/agent/research/${tripId}`, {
    method: 'POST',
  });
  return res.json();
}

export async function approveOptions(tripId: string, selectedOptionIds: string[]) {
  const res = await fetch(`${API_BASE}/api/trips/${tripId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectedOptionIds }),
  });
  return res.json();
}

export async function executeBookings(tripId: string) {
  const res = await fetch(`${API_BASE}/api/agent/book/${tripId}`, {
    method: 'POST',
  });
  return res.json();
}

export async function deliverConfirmations(tripId: string, email: string) {
  const res = await fetch(`${API_BASE}/api/agent/deliver/${tripId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function getAuditLog(tripId: string): Promise<{ count: number; logs: AuditEntry[] }> {
  const res = await fetch(`${API_BASE}/api/audit/trip/${tripId}`);
  return res.json();
}

export async function getWalletBalance(): Promise<WalletBalance> {
  const res = await fetch(`${API_BASE}/api/wallet/balance`);
  return res.json();
}

export async function cancelTrip(tripId: string) {
  const res = await fetch(`${API_BASE}/api/trips/${tripId}/cancel`, {
    method: 'POST',
  });
  return res.json();
}

export async function swapOption(tripId: string, category: string, newItem: any): Promise<Trip> {
  const res = await fetch(`${API_BASE}/api/trips/${tripId}/swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, newItem }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    console.error("Swap failed:", res.status, errBody);
    throw new Error(errBody.error || "Failed to swap option");
  }
  return res.json();
}
