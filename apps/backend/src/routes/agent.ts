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
    // Step 1: Search for flights and hotels
    const searchResults = await searchWeb(
      `best hotels and flights ${trip.destination} ${trip.startDate}`,
      trip.id
    );

    // Step 2: Scrape top results for details
    const scraped = await scrapeUrl(searchResults.results[0].url, trip.id);

    // Step 3: Check weather
    const weather = await getWeather(trip.destination, `${trip.startDate} to ${trip.endDate}`, trip.id);

    // Step 4: Check transit times
    const transit = await getTransitTime('Airport', 'City Center', trip.id);

    // Step 5: Synthesize with Gemini
    const itinerary = await synthesizeItinerary(
      {
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        searchResults: searchResults.results,
        scrapedData: scraped,
        weather,
        transit,
        budget: trip.totalBudget,
        spendingLimits: trip.spendingLimits,
        travelers: trip.travelers,
        preferences: trip.preferences,
      },
      trip.id
    );

    // Generate options from the itinerary
    const options = [
      {
        id: uuidv4(),
        type: 'flight' as const,
        name: itinerary.recommendedFlight.airline,
        description: `${itinerary.recommendedFlight.route} — ${itinerary.recommendedFlight.class}`,
        price: itinerary.recommendedFlight.price,
        rating: 4.5,
        provider: 'Skyscanner',
        details: itinerary.recommendedFlight,
      },
      {
        id: uuidv4(),
        type: 'hotel' as const,
        name: itinerary.recommendedHotel.name,
        description: `${itinerary.recommendedHotel.location} — ${itinerary.recommendedHotel.totalNights} nights`,
        price: itinerary.recommendedHotel.totalPrice,
        rating: itinerary.recommendedHotel.rating,
        provider: 'Booking.com',
        details: itinerary.recommendedHotel,
      },
      ...itinerary.recommendedActivities.map((act) => ({
        id: uuidv4(),
        type: 'activity' as const,
        name: act.name,
        description: `Duration: ${act.duration}`,
        price: act.price,
        rating: 4.3,
        provider: 'GetYourGuide',
        details: act,
      })),
    ];

    updateTrip(trip.id, {
      status: 'OPTIONS_READY',
      options,
    });

    audit.log({
      tripId: trip.id,
      agentName: 'Research',
      action: `✅ Research complete — ${options.length} options found`,
      reasoning: `Total estimated cost: $${itinerary.totalEstimatedCost} (within $${trip.totalBudget} budget). Weather: ${weather.conditions}. Awaiting user approval.`,
      severity: 'success',
    });

    res.json({
      status: 'OPTIONS_READY',
      summary: itinerary.summary,
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
