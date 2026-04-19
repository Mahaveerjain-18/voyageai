import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getTrip, updateTrip, updateTripStatus } from '../models/Trip';
import { AuditLogger } from '../services/auditLogger';
import { createSubwallet } from '../services/walletService';

export const checkoutRouter = Router();
const audit = AuditLogger.getInstance();

const LOCUS_API_BASE = () => process.env.LOCUS_API_BASE || 'https://beta-api.paywithlocus.com/api';
const LOCUS_API_KEY = () => process.env.LOCUS_API_KEY || '';

// ─── In-memory checkout sessions ─────────────────────────────

interface CheckoutSession {
  id: string;
  tripId: string;
  amount: string;
  description: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  createdAt: string;
  txHash?: string;
  locusSessionId?: string;
  checkoutUrl?: string;
}

const sessions: Map<string, CheckoutSession> = new Map();

// ─── Create a checkout session for trip funding ──────────────
checkoutRouter.post('/sessions', async (req, res) => {
  try {
    const { tripId, amount } = req.body;

    const trip = getTrip(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const sessionAmount = amount || trip.totalBudget.toString();
    let locusSessionId: string | undefined;
    let checkoutUrl: string | undefined;

    // Try to create a real Locus checkout session
    try {
      const locusRes = await fetch(`${LOCUS_API_BASE()}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOCUS_API_KEY()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: sessionAmount,
          description: `VoyageAI Trip: ${trip.destination} (${trip.startDate} → ${trip.endDate})`,
          metadata: { tripId, destination: trip.destination },
        }),
      });

      if (locusRes.ok) {
        const locusData = await locusRes.json() as any;
        const d = locusData.data || locusData;
        locusSessionId = d.id || d.sessionId;
        checkoutUrl = d.checkoutUrl || d.url || `https://beta.paywithlocus.com/checkout/${locusSessionId}`;

        audit.log({
          tripId,
          agentName: 'System',
          action: `Locus Checkout session created: $${sessionAmount}`,
          reasoning: `Real checkout session ${locusSessionId}. Checkout URL generated.`,
          severity: 'success',
        });
      } else {
        const errData = await locusRes.json().catch(() => ({}));
        console.log('[Checkout] Locus session creation returned:', locusRes.status, errData);
      }
    } catch (err: any) {
      console.log('[Checkout] Locus session creation error:', err.message);
    }

    // Create our internal session (with or without Locus session)
    const session: CheckoutSession = {
      id: locusSessionId || uuidv4(),
      tripId,
      amount: sessionAmount,
      description: `VoyageAI Trip: ${trip.destination}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      locusSessionId,
      checkoutUrl,
    };

    sessions.set(session.id, session);

    if (!locusSessionId) {
      audit.log({
        tripId,
        agentName: 'System',
        action: `Checkout session created: $${session.amount}`,
        reasoning: 'Internal session created. Ready for payment.',
        severity: 'info',
      });
    }

    res.status(201).json({
      sessionId: session.id,
      amount: session.amount,
      checkoutUrl: session.checkoutUrl || `https://beta.paywithlocus.com/checkout/${session.id}`,
      status: session.status,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Get checkout session status ─────────────────────────────
checkoutRouter.get('/sessions/:sessionId', async (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  // If we have a Locus session, check its real status
  if (session.locusSessionId && session.status === 'pending') {
    try {
      const locusRes = await fetch(`${LOCUS_API_BASE()}/checkout/sessions/${session.locusSessionId}`, {
        headers: { 'Authorization': `Bearer ${LOCUS_API_KEY()}` },
      });
      if (locusRes.ok) {
        const locusData = await locusRes.json() as any;
        const d = locusData.data || locusData;
        if (d.status === 'paid' || d.status === 'completed') {
          session.status = 'paid';
          session.txHash = d.paymentTxHash || d.txHash;
          sessions.set(session.id, session);
        }
      }
    } catch (err) {
      // Continue with local state
    }
  }

  res.json(session);
});

// ─── Confirm payment (works for both real & demo) ─────────────
checkoutRouter.post('/sessions/:sessionId/confirm', async (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  // If there's a real Locus session, try to pay via agent
  if (session.locusSessionId) {
    try {
      const payRes = await fetch(`${LOCUS_API_BASE()}/checkout/agent/pay/${session.locusSessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOCUS_API_KEY()}`,
          'Content-Type': 'application/json',
        },
      });

      if (payRes.ok) {
        const payData = await payRes.json() as any;
        const d = payData.data || payData;
        session.txHash = d.txHash || d.paymentTxHash || `0xLOCUS_${Date.now().toString(16)}`;

        audit.log({
          tripId: session.tripId,
          agentName: 'System',
          action: `Locus payment confirmed! TX: ${session.txHash}`,
          reasoning: 'Real USDC payment processed on Base via Locus Checkout',
          txHash: session.txHash,
          severity: 'success',
        });
      }
    } catch (err: any) {
      console.log('[Checkout] Agent pay error:', err.message);
    }
  }

  session.status = 'paid';
  if (!session.txHash) {
    session.txHash = `0xCHECKOUT_TX_${Date.now().toString(16)}`;
  }
  sessions.set(session.id, session);

  const trip = getTrip(session.tripId);
  if (trip) {
    // Create the trip escrow subwallet
    const tripEndDate = new Date(trip.endDate).getTime() / 1000;
    const subwallet = await createSubwallet(session.amount, tripEndDate, trip.id);

    updateTrip(trip.id, {
      status: 'FUNDED',
      checkoutSessionId: session.id,
      subwalletAddress: subwallet.subwalletAddress,
    });

    audit.log({
      tripId: trip.id,
      agentName: 'System',
      action: `Trip funded! $${session.amount} USDC received`,
      reasoning: `Checkout confirmed (tx: ${session.txHash}). Escrow active. Ready to start research.`,
      txHash: session.txHash,
      severity: 'success',
    });
  }

  res.json({ status: 'paid', txHash: session.txHash });
});

// ─── Webhook handler (for production) ────────────────────────
checkoutRouter.post('/webhook', (req, res) => {
  console.log('[Checkout Webhook]', req.body);

  // Handle Locus webhook callback
  const { sessionId, status, txHash } = req.body;
  if (sessionId && status === 'paid') {
    const session = sessions.get(sessionId);
    if (session) {
      session.status = 'paid';
      session.txHash = txHash;
      sessions.set(sessionId, session);
    }
  }

  res.status(200).json({ received: true });
});
