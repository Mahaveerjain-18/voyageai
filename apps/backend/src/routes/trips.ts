import { Router } from 'express';
import { createTrip, getTrip, getAllTrips, updateTrip, updateTripStatus } from '../models/Trip';
import { AuditLogger } from '../services/auditLogger';
import { createSubwallet, reclaimSubwallet } from '../services/walletService';

export const tripRouter = Router();
const audit = AuditLogger.getInstance();

// ─── Create a new trip ───────────────────────────────────────
tripRouter.post('/', (req, res) => {
  try {
    const { origin, destination, startDate, endDate, travelers, preferences, totalBudget, spendingLimits } = req.body;

    if (!destination || !totalBudget) {
      return res.status(400).json({ error: 'destination and totalBudget are required' });
    }

    const trip = createTrip({
      userId: req.body.userId || 'demo-user',
      origin: origin || '',
      destination,
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      travelers: travelers || 1,
      preferences: preferences || '',
      totalBudget,
      spendingLimits: spendingLimits || {},
    });

    audit.log({
      tripId: trip.id,
      agentName: 'System',
      action: `Trip created: ${destination}`,
      reasoning: `Budget: $${totalBudget} | Travelers: ${trip.travelers} | Dates: ${trip.startDate} to ${trip.endDate}`,
      severity: 'success',
    });

    res.status(201).json(trip);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Get all trips ───────────────────────────────────────────
tripRouter.get('/', (_req, res) => {
  res.json(getAllTrips());
});

// ─── Get a single trip ───────────────────────────────────────
tripRouter.get('/:id', (req, res) => {
  const trip = getTrip(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});

// ─── Update spending limits ──────────────────────────────────
tripRouter.patch('/:id/limits', (req, res) => {
  const trip = getTrip(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const updated = updateTrip(trip.id, {
    spendingLimits: { ...trip.spendingLimits, ...req.body },
  });

  audit.log({
    tripId: trip.id,
    agentName: 'CFO',
    action: 'Spending limits updated',
    reasoning: `New limits: ${JSON.stringify(req.body)}`,
    severity: 'info',
  });

  res.json(updated);
});

// ─── Cancel a trip ───────────────────────────────────────────
tripRouter.post('/:id/cancel', async (req, res) => {
  const trip = getTrip(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  // Reclaim subwallet if it exists
  if (trip.subwalletAddress) {
    await reclaimSubwallet(trip.subwalletAddress, trip.id);
  }

  const updated = updateTripStatus(trip.id, 'CANCELLED');

  audit.log({
    tripId: trip.id,
    agentName: 'System',
    action: 'Trip cancelled',
    reasoning: 'User requested trip cancellation. Funds reclaimed from subwallet.',
    severity: 'warning',
  });

  res.json(updated);
});

// ─── Approve selected options ────────────────────────────────
tripRouter.post('/:id/approve', (req, res) => {
  const trip = getTrip(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const { selectedOptionIds } = req.body;

  const updated = updateTrip(trip.id, {
    selectedOptions: selectedOptionIds,
    status: 'BOOKING',
  });

  audit.log({
    tripId: trip.id,
    agentName: 'System',
    action: 'User approved travel options — proceeding to booking',
    reasoning: `Approved ${selectedOptionIds.length} options. Transitioning to BOOKING state.`,
    severity: 'success',
  });

  res.json(updated);
});

// ─── Swap an AI option with a user option ───────────────────
tripRouter.post('/:id/swap', (req, res) => {
  try {
    const trip = getTrip(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const { category, newItem } = req.body;
    if (!trip.researchResults) {
      return res.status(400).json({ error: 'No research results yet' });
    }

    const results = trip.researchResults as any;

    // Auto-build finalizedPlan from bestPicks if it doesn't exist
    if (!results.finalizedPlan) {
      const bestFlight = results.flights?.find((f: any) => f.isBestPick) || results.flights?.[0];
      const bestHotel = results.hotels?.find((h: any) => h.isBestPick) || results.hotels?.[0];
      const bestActivities = results.activities?.filter((a: any) => a.isBestPick) || [];
      const bestRestaurants = results.restaurants?.filter((r: any) => r.isBestPick) || [];
      results.finalizedPlan = {
        flight: bestFlight || null,
        hotel: bestHotel || null,
        activities: bestActivities,
        restaurants: bestRestaurants,
      };
    }

    const plan = results.finalizedPlan;
    if (!plan.activities) plan.activities = [];
    if (!plan.restaurants) plan.restaurants = [];

    if (category === 'flight') {
      plan.flight = newItem;
    } else if (category === 'hotel') {
      plan.hotel = newItem;
    } else if (category === 'activity') {
      if (plan.activities.length > 0) {
        plan.activities[0] = newItem;
      } else {
        plan.activities.push(newItem);
      }
    } else if (category === 'restaurant') {
      if (plan.restaurants.length > 0) {
        plan.restaurants[0] = newItem;
      } else {
        plan.restaurants.push(newItem);
      }
    }

    // Recalculate total estimated cost
    const flightPrice = plan.flight?.price || 0;
    const hotelPrice = plan.hotel?.price || 0;
    const actPrice = (plan.activities || []).reduce((s: number, a: any) => s + (a.price || 0), 0);
    const foodPrice = (plan.restaurants || []).reduce((s: number, f: any) => s + (f.price || 0), 0);
    results.totalEstimatedCost = flightPrice + hotelPrice + actPrice + foodPrice;

    // Update best pick markers in all category lists
    const listKey = category === 'restaurant' ? 'restaurants' : category === 'activity' ? 'activities' : `${category}s`;
    if (results[listKey]) {
      results[listKey].forEach((i: any) => i.isBestPick = false);
      const updatedItem = results[listKey].find((i: any) => i.id === newItem.id);
      if (updatedItem) updatedItem.isBestPick = true;
    }

    const updated = updateTrip(trip.id, { researchResults: results });

    audit.log({
      tripId: trip.id,
      agentName: 'System',
      action: `Swapped AI choice for ${category}`,
      reasoning: `User explicitly selected: ${newItem.name}`,
      severity: 'info',
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Swap error:', error);
    res.status(500).json({ error: error.message || 'Failed to swap option' });
  }
});

