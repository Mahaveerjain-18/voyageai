import { Router } from 'express';
import { AuditLogger } from '../services/auditLogger';

export const chatRouter = Router();
const audit = AuditLogger.getInstance();

function getApiBase() { return process.env.LOCUS_API_BASE || 'https://beta-api.paywithlocus.com/api'; }
function getApiKey() { return process.env.LOCUS_API_KEY || ''; }

// ─── AI Travel Chat Agent ────────────────────────────────────
chatRouter.post('/', async (req, res) => {
  const { messages, tripContext } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const tripId = tripContext?.tripId || 'chat-session';
  const lastUserMsg = messages[messages.length - 1]?.content || '';

  audit.log({
    tripId,
    agentName: 'Chat',
    action: '💬 AI Travel Agent responding',
    reasoning: `User asked: "${lastUserMsg.slice(0, 80)}..."`,
    apiProvider: 'gemini',
    apiCost: 0.02,
    severity: 'info',
  });

  // Build trip context string
  let contextBlock = '';
  if (tripContext) {
    const parts = [];
    if (tripContext.origin) parts.push(`Origin: ${tripContext.origin}`);
    if (tripContext.destination) parts.push(`Destination: ${tripContext.destination}`);
    if (tripContext.startDate) parts.push(`Dates: ${tripContext.startDate} to ${tripContext.endDate || '?'}`);
    if (tripContext.travelers) parts.push(`Travelers: ${tripContext.travelers}`);
    if (tripContext.totalBudget) parts.push(`Budget: $${tripContext.totalBudget}`);
    if (tripContext.preferences) parts.push(`Preferences: ${tripContext.preferences}`);
    if (parts.length > 0) {
      contextBlock = `\n\nCURRENT TRIP CONTEXT (user is filling a form):\n${parts.join('\n')}\nUse this context to give more targeted advice.`;
    }
  }

  const systemPrompt = `You are VoyageAI — a warm, knowledgeable, and enthusiastic AI travel planning companion. You talk like a well-traveled friend who genuinely loves helping people discover the world.

YOUR PERSONALITY:
- Warm and conversational — use "you" and "I" naturally
- Enthusiastic about travel without being over-the-top
- Specific and actionable — never give vague advice
- Honest — if something is expensive or has downsides, mention it
- Brief and engaging — 2-3 short paragraphs max, use line breaks
- Use 1-2 relevant emoji naturally (not every sentence)

WHAT YOU DO:
1. Suggest destinations based on mood, budget, season, and interests
2. Give insider travel tips — local food spots, best neighborhoods, hidden gems
3. Answer questions about weather, visas, safety, costs, transportation
4. Help compare destinations (e.g. "Bali vs Thailand for couples")
5. Recommend specific activities, restaurants, and day-by-day itineraries
6. Help users decide budget allocation (flights vs hotels vs experiences)
7. Warn about scams, overpriced tourist traps, or seasonal issues

RULES:
- Always include approximate costs in USD when relevant
- When suggesting food, mention specific dishes and price ranges
- For activities, mention duration and booking tips
- If user seems ready to book, say "You can fill in the details in the form and I'll help research the best options!"
- Keep it real — mention both pros and cons of destinations
- Never use markdown headers. Just plain conversational text with line breaks.${contextBlock}`;

  // Build conversation for Gemini — combine system + conversation into single user prompt
  const conversationHistory = messages
    .slice(-8) // Keep last 8 messages for context window
    .map((m: { role: string; content: string }) =>
      `${m.role === 'user' ? 'Traveler' : 'VoyageAI'}: ${m.content}`
    )
    .join('\n\n');

  const fullPrompt = `${systemPrompt}\n\n--- CONVERSATION ---\n${conversationHistory}\n\nVoyageAI:`;

  try {
    // Try Gemini first
    let aiResponse = await callGemini(fullPrompt, tripId);

    // Fallback to OpenAI if Gemini fails
    if (!aiResponse) {
      console.log('[Chat] Gemini failed, trying OpenAI...');
      aiResponse = await callOpenAI(systemPrompt, messages.slice(-6), tripId);
    }

    if (aiResponse) {
      // Clean up any "VoyageAI:" prefix the model might add
      aiResponse = aiResponse.replace(/^(VoyageAI|Assistant|AI):\s*/i, '').trim();

      audit.log({
        tripId,
        agentName: 'Chat',
        action: '✅ AI response generated',
        reasoning: `Response length: ${aiResponse.length} chars`,
        severity: 'success',
      });

      return res.json({ role: 'assistant', content: aiResponse });
    }

    // If both fail, return a helpful fallback
    return res.json({
      role: 'assistant',
      content: getFallbackResponse(lastUserMsg),
    });
  } catch (error: any) {
    console.error('[Chat] Critical error:', error.message);
    return res.json({
      role: 'assistant',
      content: getFallbackResponse(lastUserMsg),
    });
  }
});

// ─── Gemini API Call (via Locus Wrapped API) ─────────────────
async function callGemini(prompt: string, tripId: string): Promise<string | null> {
  try {
    const url = `${getApiBase()}/wrapped/gemini/chat`;
    console.log(`[Chat] Calling Gemini: ${url}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        maxOutputTokens: 1500,
      }),
    });

    const result = await res.json() as any;

    if (!res.ok) {
      console.error('[Chat Gemini] API error:', res.status, JSON.stringify(result).slice(0, 300));
      return null;
    }

    console.log('[Chat Gemini] Response keys:', Object.keys(result));

    // Try all possible response formats
    const data = result.data || result;

    // Gemini native format
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    // OpenAI-compatible format
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    // Direct text
    if (typeof data === 'string' && data.length > 5) return data;
    if (data.text) return data.text;
    if (data.content) return data.content;
    if (data.response) return data.response;
    if (data.message) return typeof data.message === 'string' ? data.message : data.message.content;

    console.error('[Chat Gemini] Unknown response format:', JSON.stringify(data).slice(0, 500));
    return null;
  } catch (err: any) {
    console.error('[Chat Gemini] Fetch error:', err.message);
    return null;
  }
}

// ─── OpenAI API Call (fallback via Locus Wrapped API) ────────
async function callOpenAI(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  tripId: string
): Promise<string | null> {
  try {
    const url = `${getApiBase()}/wrapped/openai/chat`;
    console.log(`[Chat] Calling OpenAI fallback: ${url}`);

    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    ];

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    const result = await res.json() as any;

    if (!res.ok) {
      console.error('[Chat OpenAI] API error:', res.status, JSON.stringify(result).slice(0, 300));
      return null;
    }

    const data = result.data || result;

    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    if (data.text) return data.text;
    if (data.content) return data.content;

    console.error('[Chat OpenAI] Unknown response format:', JSON.stringify(data).slice(0, 500));
    return null;
  } catch (err: any) {
    console.error('[Chat OpenAI] Fetch error:', err.message);
    return null;
  }
}

// ─── Smart Fallback Responses ────────────────────────────────
function getFallbackResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes('beach') || msg.includes('island')) {
    return `Great choice thinking about a beach getaway! 🏖️ Here are some amazing options depending on your budget:\n\n• Budget ($50-80/day): Goa, India or Koh Lanta, Thailand — incredible beaches, amazing food, very affordable\n• Mid-range ($100-200/day): Bali, Indonesia or Tulum, Mexico — great mix of culture and coast\n• Luxury ($300+/day): Maldives or Seychelles — the ultimate tropical escape\n\nWhat's your budget range and how many days are you thinking? That'll help me narrow it down for you!`;
  }

  if (msg.includes('japan') || msg.includes('tokyo') || msg.includes('osaka')) {
    return `Japan is absolutely incredible — one of my favorite recommendations! 🇯🇵\n\nBest time to visit: Late March-April (cherry blossoms) or November (fall foliage). Summer is hot and humid.\n\nBudget estimate for 7 days:\n• Budget: ~$100/day (hostels, konbini food, trains)\n• Comfortable: ~$200/day (business hotels, mix of restaurants)\n• Luxury: ~$400+/day (ryokans, kaiseki dinners, bullet trains)\n\nMust-do: Try a conveyor belt sushi spot (around $15-20 for a full meal), visit a local onsen, and don't skip Osaka's street food scene in Dotonbori. What dates are you considering?`;
  }

  if (msg.includes('europe') || msg.includes('paris') || msg.includes('italy') || msg.includes('spain')) {
    return `Europe is fantastic! The best hidden gems right now are:\n\n• Porto, Portugal — stunning architecture, amazing wine, much cheaper than Lisbon (~$80/day)\n• Slovenia — Lake Bled is magical, and Ljubljana is one of the most charming capitals in Europe (~$70/day)\n• Puglia, Italy — the real Italy without the tourist crowds of Rome/Florence (~$100/day)\n\nPro tip: Flying between European cities can be as cheap as $30-60 on Ryanair/easyJet if you book 4-6 weeks ahead. When are you thinking of going?`;
  }

  if (msg.includes('budget') || msg.includes('cheap') || msg.includes('afford')) {
    return `Smart thinking about budget! Here's how I typically recommend splitting a travel budget:\n\n• Flights: 25-30% of total budget\n• Accommodation: 30-35%\n• Food & Dining: 20-25%\n• Activities & Experiences: 15-20%\n\nFor the best value right now, Southeast Asia (Thailand, Vietnam, Indonesia) gives you the most bang for your buck — think $50-80/day for a comfortable trip with great food. Fill in your budget in the form and I'll help optimize your spending!`;
  }

  if (msg.includes('family') || msg.includes('kids') || msg.includes('children')) {
    return `Family trips are the best! 👨‍👩‍👧‍👦 Here are top picks:\n\n• Bali, Indonesia — kid-friendly beaches, monkey forests, affordable ($100/day for a family)\n• Costa Rica — incredible wildlife, zip-lining, safe and welcoming ($150/day)\n• Japan — ultra-safe, trains are an adventure themselves, amazing food even picky kids love ($200/day)\n• Portugal's Algarve coast — beautiful beaches, castles, very family-oriented ($120/day)\n\nHow old are your kids? That helps me suggest the right activities!`;
  }

  return `I'd love to help you plan an amazing trip! ✈️ Here are some things I can help with:\n\n• Suggest destinations based on your interests, budget, and travel dates\n• Compare destinations (e.g., "Bali vs Thailand")\n• Give you insider tips on local food, hidden gems, and must-do activities\n• Help you figure out the right budget allocation\n\nTell me — what kind of experience are you looking for? Adventure, relaxation, culture, food... or a mix of everything?`;
}
