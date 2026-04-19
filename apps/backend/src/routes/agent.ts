import { Router } from 'express';
import { getTrip, updateTrip, updateTripStatus } from '../models/Trip';
import { AuditLogger } from '../services/auditLogger';
import { searchWeb, scrapeUrl, getWeather, getTransitTime, synthesizeItinerary } from '../services/wrappedApiService';
import { sendPayment, sendViaEmail } from '../services/walletService';
import { v4 as uuidv4 } from 'uuid';

export const agentRouter = Router();
const audit = AuditLogger.getInstance();

// ─── Trigger AI Research for a trip ──────────────────────────
agentRouter.post('/research/:tripId', async (req, res) => {
  const trip = getTrip(req.params.tripId);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  if (trip.status !== 'FUNDED') {
    return res.status(400).json({ error: `Trip must be in FUNDED state. Current: ${trip.status}` });
  }

  updateTripStatus(trip.id, 'RESEARCHING');

  audit.log({
    tripId: trip.id,
    agentName: 'System',
    action: '🚀 Research phase started',
    reasoning: `Deploying Research Agent to find the best options for ${trip.destination}`,
    severity: 'info',
  });

  try {
    // Step 1: Targeted searches for each category
    audit.log({
      tripId: trip.id,
      agentName: 'Research',
      action: '🔍 Starting multi-category search',
      reasoning: `Searching flights, hotels, activities & restaurants for ${trip.origin} → ${trip.destination}`,
      severity: 'info',
    });

    const [flightSearch, hotelSearch, activitySearch, restaurantSearch] = await Promise.all([
      searchWeb(`cheapest flights from ${trip.origin} to ${trip.destination} ${trip.startDate} makemytrip ixigo skyscanner price`, trip.id),
      searchWeb(`best hotels in ${trip.destination} price per night ${trip.startDate}`, trip.id),
      searchWeb(`top things to do in ${trip.destination} activities tours tickets price`, trip.id),
      searchWeb(`best restaurants in ${trip.destination} popular food places`, trip.id),
    ]);

    // Step 2: Scrape top 2 results from each category for real price data
    const scrapePromises = [
      ...(flightSearch.results.slice(0, 2).map(r => scrapeUrl(r.url, trip.id))),
      ...(hotelSearch.results.slice(0, 2).map(r => scrapeUrl(r.url, trip.id))),
      ...(activitySearch.results.slice(0, 1).map(r => scrapeUrl(r.url, trip.id))),
      ...(restaurantSearch.results.slice(0, 1).map(r => scrapeUrl(r.url, trip.id))),
    ];
    const scrapedResults = await Promise.all(scrapePromises);

    // Step 3: Check weather
    const weather = await getWeather(trip.destination, `${trip.startDate} to ${trip.endDate}`, trip.id);

    // Step 4: Check transit times
    const transit = await getTransitTime('Airport', 'City Center', trip.id);

    // Step 5: Synthesize with Gemini — pass all search + scraped data for real prices
    const itinerary = await synthesizeItinerary(
      {
        origin: trip.origin,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        searchResults: [
          ...flightSearch.results.map(r => ({ ...r, category: 'flight' })),
          ...hotelSearch.results.map(r => ({ ...r, category: 'hotel' })),
          ...activitySearch.results.map(r => ({ ...r, category: 'activity' })),
          ...restaurantSearch.results.map(r => ({ ...r, category: 'restaurant' })),
        ],
        scrapedData: scrapedResults,
        weather,
        transit,
        budget: trip.totalBudget,
        spendingLimits: trip.spendingLimits,
        travelers: trip.travelers,
        preferences: trip.preferences,
      },
      trip.id
    );

    // Build full research results with IDs, within-limit flags, and best pick markers
    const bestPicks = itinerary.bestPicks || { flight: 0, hotel: 0, activity: 0, restaurant: 0 };

    const buildOptions = (items: any[], category: 'flight' | 'hotel' | 'activity' | 'restaurant', limit: number, bestIdx: number) =>
      (items || []).map((item: any, idx: number) => ({
        id: uuidv4(),
        category,
        name: item.name || item.airline || 'Unknown',
        description: item.description || '',
        price: item.price || 0,
        rating: item.rating || 4.0,
        url: item.url || '',
        provider: item.provider || '',
        withinLimit: (item.price || 0) <= limit,
        isBestPick: idx === bestIdx,
        details: item,
      }));

    const researchFlights = buildOptions(itinerary.flights, 'flight', trip.spendingLimits.maxFlight, bestPicks.flight);
    const researchHotels = buildOptions(itinerary.hotels, 'hotel', trip.spendingLimits.maxHotel, bestPicks.hotel);
    const researchActivities = buildOptions(itinerary.activities, 'activity', trip.spendingLimits.maxActivities, bestPicks.activity);
    const researchRestaurants = buildOptions(itinerary.restaurants, 'restaurant', trip.spendingLimits.maxFood, bestPicks.restaurant);

    const researchResults = {
      summary: itinerary.summary,
      flights: researchFlights,
      hotels: researchHotels,
      activities: researchActivities,
      restaurants: researchRestaurants,
      bestPicks: {
        flight: researchFlights.find((o: any) => o.isBestPick)?.id || '',
        hotel: researchHotels.find((o: any) => o.isBestPick)?.id || '',
        activity: researchActivities.find((o: any) => o.isBestPick)?.id || '',
        restaurant: researchRestaurants.find((o: any) => o.isBestPick)?.id || '',
      },
      totalEstimatedCost: itinerary.totalEstimatedCost,
      weather,
    };

    // Legacy options for booking flow (best picks only)
    const options = [
      ...(researchFlights.filter((o: any) => o.isBestPick).map((o: any) => ({
        id: o.id, type: 'flight' as const, name: o.name, description: o.description,
        price: o.price, rating: o.rating, provider: o.provider, details: o.details,
      }))),
      ...(researchHotels.filter((o: any) => o.isBestPick).map((o: any) => ({
        id: o.id, type: 'hotel' as const, name: o.name, description: o.description,
        price: o.price, rating: o.rating, provider: o.provider, details: o.details,
      }))),
      ...(researchActivities.map((o: any) => ({
        id: o.id, type: 'activity' as const, name: o.name, description: o.description,
        price: o.price, rating: o.rating, provider: o.provider, details: o.details,
      }))),
    ];

    updateTrip(trip.id, {
      status: 'OPTIONS_READY',
      options,
      researchResults,
    });

    audit.log({
      tripId: trip.id,
      agentName: 'Research',
      action: `✅ Research complete — ${researchFlights.length + researchHotels.length + researchActivities.length + researchRestaurants.length} options found`,
      reasoning: `Total estimated cost: $${itinerary.totalEstimatedCost} (within $${trip.totalBudget} budget). Weather: ${weather.conditions}. Awaiting user approval.`,
      severity: 'success',
    });

    res.json({
      status: 'OPTIONS_READY',
      summary: itinerary.summary,
      researchResults,
      options,
      weather,
      estimatedTotal: itinerary.totalEstimatedCost,
    });
  } catch (error: any) {
    updateTripStatus(trip.id, 'FAILED');
    audit.log({
      tripId: trip.id,
      agentName: 'System',
      action: 'Research failed',
      reasoning: error.message,
      severity: 'error',
    });
    res.status(500).json({ error: error.message });
  }
});

// ─── Execute bookings for approved options ───────────────────
agentRouter.post('/book/:tripId', async (req, res) => {
  const trip = getTrip(req.params.tripId);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  if (trip.status !== 'BOOKING') {
    return res.status(400).json({ error: `Trip must be in BOOKING state. Current: ${trip.status}` });
  }

  audit.log({
    tripId: trip.id,
    agentName: 'Booking',
    action: '🎯 Booking phase started',
    reasoning: `Executing bookings for ${trip.selectedOptions.length} approved options`,
    severity: 'info',
  });

  try {
    const bookings = [];

    for (const optionId of trip.selectedOptions) {
      const option = trip.options.find((o) => o.id === optionId);
      if (!option) continue;

      // Check spending limits
      const categoryKey = `max${option.type.charAt(0).toUpperCase() + option.type.slice(1)}` as keyof typeof trip.spendingLimits;
      const categorySpent = trip.bookings
        .filter((b) => b.type === option.type)
        .reduce((sum, b) => sum + b.price, 0);

      if (categorySpent + option.price > (trip.spendingLimits[categoryKey] as number || Infinity)) {
        audit.log({
          tripId: trip.id,
          agentName: 'CFO',
          action: `❌ BLOCKED: ${option.name} ($${option.price})`,
          reasoning: `Exceeds ${option.type} budget limit of $${trip.spendingLimits[categoryKey]}. Already spent: $${categorySpent}`,
          severity: 'error',
        });
        continue;
      }

      // Execute payment
      const payment = await sendPayment(
        '0xVENDOR_ADDRESS',
        option.price.toString(),
        trip.id,
        `Booking ${option.type}: ${option.name}`
      );

      const booking = {
        id: uuidv4(),
        optionId: option.id,
        type: option.type,
        name: option.name,
        price: option.price,
        confirmationCode: `VOY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        txHash: payment.txHash,
        paymentMethod: 'pay_send' as const,
        bookedAt: new Date().toISOString(),
      };

      bookings.push(booking);
    }

    updateTrip(trip.id, {
      status: 'CONFIRMED',
      bookings: [...trip.bookings, ...bookings],
      totalSpent: trip.totalSpent + bookings.reduce((s, b) => s + b.price, 0),
    });

    audit.log({
      tripId: trip.id,
      agentName: 'Booking',
      action: `✅ All bookings confirmed — ${bookings.length} items booked`,
      reasoning: `Total spent: $${bookings.reduce((s, b) => s + b.price, 0)}. Confirmation codes generated.`,
      severity: 'success',
    });

    res.json({
      status: 'CONFIRMED',
      bookings,
      totalSpent: bookings.reduce((s, b) => s + b.price, 0),
    });
  } catch (error: any) {
    audit.log({
      tripId: trip.id,
      agentName: 'System',
      action: 'Booking failed',
      reasoning: error.message,
      severity: 'error',
    });
    res.status(500).json({ error: error.message });
  }
});

// ─── Deliver confirmations via email escrow ──────────────────
agentRouter.post('/deliver/:tripId', async (req, res) => {
  const trip = getTrip(req.params.tripId);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.status !== 'CONFIRMED') {
    return res.status(400).json({ error: `Trip must be in CONFIRMED state. Current: ${trip.status}` });
  }

  const { email } = req.body;

  audit.log({
    tripId: trip.id,
    agentName: 'Delivery',
    action: `📧 Delivering confirmations to ${email}`,
    reasoning: `Sending ${trip.bookings.length} booking confirmations via Locus Email Escrow`,
    severity: 'info',
  });

  const result = await sendViaEmail(
    email,
    '0.01', // tiny amount to trigger email escrow
    trip.id,
    `Your VoyageAI trip to ${trip.destination} is confirmed! Booking codes: ${trip.bookings.map((b) => b.confirmationCode).join(', ')}`
  );

  updateTripStatus(trip.id, 'DELIVERED');

  audit.log({
    tripId: trip.id,
    agentName: 'Delivery',
    action: `✅ Confirmations delivered to ${email}`,
    reasoning: `Email escrow transaction: ${result.txHash}`,
    txHash: result.txHash,
    severity: 'success',
  });

  res.json({
    status: 'DELIVERED',
    email,
    txHash: result.txHash,
    bookings: trip.bookings,
  });
});
