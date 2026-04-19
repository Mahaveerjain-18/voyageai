"use client";

import { useEffect, useState, useRef } from "react";

/* ───────────────────────────────────────────────────────────
   AgentDemo — An auto‑playing animated widget that shows the
   full VoyageAI trip‑planning flow, step by step:
     1. User types destination
     2. Agent "thinks" with status lines
     3. Destination info appears
     4. Budget allocation
     5. Flight / hotel options ranked
     6. User selects an option
     7. Confirm booking dialog
     8. USDC payment + tx hash
   ─────────────────────────────────────────────────────────── */

// ── Step timeline ────────────────────────────────────────────

interface Step {
  type:
    | "user"
    | "status"
    | "agent"
    | "options"
    | "select"
    | "budget"
    | "confirm"
    | "tx"
    | "success"
    | "typing";
  delay: number; // ms after mount to show this step
  content?: string;
  data?: any;
}

const STEPS: Step[] = [
  // ── 0. Initial Agent prompt ─────────────────────────
  { type: "agent",  delay: 0,     content: "Where would you like to travel today? 🌎" },

  // ── 1. User query (typewriter) ──────────────────────
  { type: "user",   delay: 500,   content: "5 days in Bali, August, budget $2,000" },

  // ── 2. Thinking ─────────────────────────────────────
  { type: "typing", delay: 1300 },
  { type: "status", delay: 1600,  content: "Searching flights on 6 providers..." },
  { type: "status", delay: 2000,  content: "Scraping hotel rates from Booking.com..." },
  { type: "status", delay: 2400,  content: "Checking weather forecast — 30°C, sunny" },
  { type: "status", delay: 2800,  content: "Ranking 12 options by value score..." },

  // ── 3. Agent reply ──────────────────────────────────
  { type: "agent",  delay: 3300,  content: "Found 3 best packages within your $2,000 budget. Here are the top matches:" },

  // ── 4. Options cards ────────────────────────────────
  {
    type: "options",
    delay: 3800,
    data: [
      { name: "Qatar Airways + Ubud Villa",      tags: "FLIGHT · HOTEL · 5N", score: 96, price: "$1,840", oh: "8% OH" },
      { name: "Singapore Air + Seminyak Resort",  tags: "FLIGHT · HOTEL · 5N", score: 91, price: "$1,720", oh: "12% OH" },
      { name: "Garuda Direct + Canggu Boutique",  tags: "FLIGHT · HOTEL · 5N", score: 87, price: "$1,560", oh: "15% OH" },
    ],
  },

  // ── 5. Agent reasoning ──────────────────────────────
  { type: "agent", delay: 4800, content: "Qatar Airways + Ubud Villa has the highest value score — direct flight, free cancellation, and includes breakfast. How much would you like to allocate?" },

  // ── 6. Budget selection ─────────────────────────────
  {
    type: "budget",
    delay: 5500,
    data: { amounts: ["$1,560", "$1,720", "$1,840", "$2,000"], selected: 2 },
  },

  // ── 7. Confirm dialog ───────────────────────────────
  {
    type: "confirm",
    delay: 6300,
    data: {
      name: "Qatar Airways + Ubud Villa",
      price: "$1,840.00",
      breakdown: "Flight $680 · Hotel $920 · Activities $240",
    },
  },

  // ── 8. Typing again ─────────────────────────────────
  { type: "typing", delay: 7100 },

  // ── 9. Transaction ──────────────────────────────────
  {
    type: "tx",
    delay: 7600,
    data: {
      hash: "0x7f3a...e91d",
      chain: "Base (L2)",
      amount: "1,840.00 USDC",
    },
  },

  // ── 10. Success ─────────────────────────────────────
  {
    type: "success",
    delay: 8300,
    content: "Booking confirmed! Confirmation sent to your dashboard.",
  },
];

// Loop delay — how long after the last step before restarting
const LOOP_RESTART_DELAY = 4000;
const TOTAL_DURATION = STEPS[STEPS.length - 1].delay + LOOP_RESTART_DELAY;

export function AgentDemo({ onStartPlanning }: { onStartPlanning?: () => void }) {
  const [activeSteps, setActiveSteps] = useState<number[]>([]);
  const [typewriterText, setTypewriterText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Start / restart the animation loop ────────────────
  const startSequence = () => {
    // Clear previous
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setActiveSteps([]);
    setTypewriterText("");
    setIsTyping(false);

    STEPS.forEach((step, idx) => {
      const t = setTimeout(() => {
        setActiveSteps((prev) => [...prev, idx]);
      }, step.delay);
      timersRef.current.push(t);
    });

    // Restart loop
    const restart = setTimeout(() => startSequence(), TOTAL_DURATION);
    timersRef.current.push(restart);
  };

  useEffect(() => {
    startSequence();
    return () => timersRef.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Typewriter for user message ───────────────────────
  useEffect(() => {
    if (activeSteps.includes(1) && !isTyping) {
      setIsTyping(true);
      const full = STEPS[1].content!;
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setTypewriterText(full.slice(0, i));
        if (i >= full.length) clearInterval(iv);
      }, 15);
      return () => clearInterval(iv);
    }
  }, [activeSteps, isTyping]);

  // ── Auto‑scroll ───────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [activeSteps]);

  // ── Check if a step index is visible ──────────────────
  const vis = (idx: number) => activeSteps.includes(idx);

  // Hide "typing" dots once the *next* step appears
  const showTyping = (typingIdx: number) => {
    const nextIdx = typingIdx + 1;
    return vis(typingIdx) && !vis(nextIdx);
  };

  return (
    <div className="demo-widget">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="demo-header">
        <div className="demo-header-left">
          <span className="demo-icon">✈️</span>
          <span className="demo-title">TRAVEL AGENT</span>
        </div>
        <span className="demo-live">
          <span className="demo-live-dot" />
          LIVE
        </span>
      </div>

      {/* ── Scrollable body ────────────────────────────── */}
      <div className="demo-body" ref={scrollRef}>
        {/* 0 — Agent greeting */}
        {vis(0) && (
          <div className="demo-bubble demo-bubble-agent demo-enter">
            {STEPS[0].content}
          </div>
        )}

        {/* 1 — User message (typewriter) */}
        {vis(1) && (
          <div className="demo-bubble demo-bubble-user demo-enter">
            {typewriterText}
            {isTyping && <span className="demo-cursor" />}
          </div>
        )}

        {/* 2 — Typing dots */}
        {showTyping(2) && <TypingDots />}

        {/* 3–6 — Status lines */}
        {[3, 4, 5, 6].map(
          (idx) =>
            vis(idx) && (
              <div key={idx} className="demo-status demo-enter">
                <span className="demo-status-dot" />
                {STEPS[idx].content}
              </div>
            )
        )}

        {/* 7 — Agent reply */}
        {vis(7) && (
          <div className="demo-bubble demo-bubble-agent demo-enter">
            {STEPS[7].content}
          </div>
        )}

        {/* 8 — Options cards */}
        {vis(8) && (
          <div className="demo-options-card demo-enter">
            <div className="demo-options-header">
              3 MATCHES · VERIFIED
            </div>
            {(STEPS[8].data as any[]).map((opt: any, i: number) => (
              <div
                key={i}
                className={`demo-option-row ${i === 0 ? "demo-option-best" : ""}`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="demo-option-info">
                  <div className="demo-option-name">{opt.name}</div>
                  <div className="demo-option-tags">
                    {opt.tags} · {opt.price}
                  </div>
                </div>
                <div className="demo-option-meta">
                  <span className="demo-option-score">{opt.score}</span>
                  <span className="demo-option-oh">{opt.oh}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 9 — Agent reasoning */}
        {vis(9) && (
          <div className="demo-bubble demo-bubble-agent demo-enter">
            {STEPS[9].content}
          </div>
        )}

        {/* 10 — Budget selection */}
        {vis(10) && (
          <div className="demo-budget demo-enter">
            <div className="demo-budget-label">CHOOSE YOUR BUDGET</div>
            <div className="demo-budget-row">
              {(STEPS[10].data.amounts as string[]).map(
                (amt: string, i: number) => (
                  <button
                    key={i}
                    className={`demo-budget-btn ${i === STEPS[10].data.selected ? "demo-budget-btn-active" : ""}`}
                  >
                    {amt}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* 11 — Confirm dialog */}
        {vis(11) && (
          <div className="demo-confirm demo-enter">
            <div className="demo-confirm-label">CONFIRM BOOKING</div>
            <div className="demo-confirm-body">
              <div className="demo-confirm-row">
                <span>{STEPS[11].data.name}</span>
                <span className="demo-confirm-price">
                  {STEPS[11].data.price}
                </span>
              </div>
              <div className="demo-confirm-breakdown">
                {STEPS[11].data.breakdown}
              </div>
              <div className="demo-confirm-actions">
                <button className="demo-confirm-btn">Confirm</button>
                <button className="demo-confirm-cancel">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* 12 — Typing again */}
        {showTyping(12) && <TypingDots />}

        {/* 13 — Transaction */}
        {vis(13) && (
          <div className="demo-tx demo-enter">
            <div className="demo-tx-icon">⛓️</div>
            <div className="demo-tx-details">
              <div className="demo-tx-row">
                <span className="demo-tx-label">Tx Hash</span>
                <span className="demo-tx-value demo-tx-hash">
                  {STEPS[13].data.hash}
                </span>
              </div>
              <div className="demo-tx-row">
                <span className="demo-tx-label">Chain</span>
                <span className="demo-tx-value">{STEPS[13].data.chain}</span>
              </div>
              <div className="demo-tx-row">
                <span className="demo-tx-label">Amount</span>
                <span className="demo-tx-value demo-tx-amount">
                  {STEPS[13].data.amount}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 14 — Success */}
        {vis(14) && (
          <div className="demo-success demo-enter">
            <span className="demo-success-check">✓</span>
            {STEPS[14].content}
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────── */}
      <div className="demo-footer">
        <span className="demo-footer-cta">Try the real agent →</span>
        <button className="demo-footer-badge" onClick={onStartPlanning}>START PLANNING</button>
      </div>

      {/* ── Scoped styles ──────────────────────────────── */}
      <style jsx>{`
        /* ─── Widget shell ────────────────────────────── */
        .demo-widget {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          width: 100%;
          max-width: 500px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 0 80px rgba(255, 255, 255, 0.04),
                      0 0 2px rgba(255, 255, 255, 0.15);
        }

        /* ─── Header ──────────────────────────────────── */
        .demo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
        }
        .demo-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .demo-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
        }
        .demo-title {
          font-weight: 700;
          font-size: 0.8rem;
          letter-spacing: 0.06em;
          color: var(--text-primary);
        }
        .demo-live {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--accent);
        }
        .demo-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          animation: livePulse 2s infinite;
        }

        /* ─── Scrollable body ─────────────────────────── */
        .demo-body {
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          height: 480px;
          overflow-y: auto;
          scroll-behavior: smooth;
        }

        /* ─── Generic enter animation ─────────────────── */
        .demo-enter {
          animation: demoSlideIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes demoSlideIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ─── Chat bubbles ────────────────────────────── */
        .demo-bubble {
          padding: 11px 16px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.95rem;
          line-height: 1.55;
          max-width: 88%;
          position: relative;
        }
        .demo-bubble-user {
          align-self: flex-end;
          background: var(--accent);
          color: var(--accent-text);
          border-radius: 16px 16px 4px 16px;
          font-weight: 500;
        }
        .demo-bubble-agent {
          align-self: flex-start;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          color: var(--text-primary);
          border-radius: 4px 16px 16px 16px;
        }

        /* ─── Typewriter cursor ───────────────────────── */
        .demo-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: var(--accent-text);
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: blinkCursor 0.7s step-end infinite;
        }
        @keyframes blinkCursor {
          50% { opacity: 0; }
        }

        /* ─── Status lines (monospace) ────────────────── */
        .demo-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.82rem;
          color: var(--text-muted);
          padding: 4px 0 2px;
          letter-spacing: 0.01em;
        }
        .demo-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
          animation: statusPulse 1.5s infinite;
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }

        /* ─── Options card ────────────────────────────── */
        .demo-options-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
        }
        .demo-options-header {
          padding: 10px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .demo-option-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          animation: optionReveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
          transition: background 0.2s;
        }
        .demo-option-row:last-child {
          border-bottom: none;
        }
        .demo-option-best {
          background: rgba(255, 255, 255, 0.06);
          border-left: 3px solid var(--accent);
        }
        @keyframes optionReveal {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .demo-option-info {
          flex: 1;
          min-width: 0;
        }
        .demo-option-name {
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .demo-option-tags {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 3px;
          letter-spacing: 0.02em;
        }
        .demo-option-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          margin-left: 12px;
          flex-shrink: 0;
        }
        .demo-option-score {
          color: var(--accent);
          font-weight: 800;
          font-size: 0.95rem;
        }
        .demo-option-oh {
          font-size: 0.65rem;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }

        /* ─── Budget selector ─────────────────────────── */
        .demo-budget {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px 16px;
        }
        .demo-budget-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 10px;
        }
        .demo-budget-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        .demo-budget-btn {
          padding: 10px 4px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-secondary);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: default;
          transition: all 0.3s;
          text-align: center;
        }
        .demo-budget-btn-active {
          background: var(--accent);
          color: var(--accent-text);
          border-color: var(--accent);
          box-shadow: 0 0 14px rgba(255, 255, 255, 0.25);
          transform: scale(1.04);
        }

        /* ─── Confirm dialog ──────────────────────────── */
        .demo-confirm {
          border: 1px solid var(--accent);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.08);
        }
        .demo-confirm-label {
          padding: 10px 16px;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--accent);
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.04);
        }
        .demo-confirm-body {
          padding: 14px 16px;
          background: var(--bg-elevated);
        }
        .demo-confirm-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.88rem;
          font-weight: 500;
          color: var(--text-primary);
        }
        .demo-confirm-price {
          font-weight: 800;
          font-size: 1rem;
          color: var(--accent);
        }
        .demo-confirm-breakdown {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-top: 6px;
          font-family: var(--font-mono);
          letter-spacing: 0.01em;
        }
        .demo-confirm-actions {
          display: flex;
          gap: 8px;
          margin-top: 14px;
        }
        .demo-confirm-btn {
          flex: 1;
          padding: 10px;
          background: var(--accent);
          color: var(--accent-text);
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: default;
          animation: confirmPulse 1.8s ease-in-out infinite;
        }
        @keyframes confirmPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.3); }
          50%      { box-shadow: 0 0 14px 4px rgba(255, 255, 255, 0.15); }
        }
        .demo-confirm-cancel {
          padding: 10px 18px;
          background: transparent;
          color: var(--text-muted);
          border: 1px solid var(--border);
          border-radius: 10px;
          font-size: 0.85rem;
          cursor: default;
        }

        /* ─── Transaction card ────────────────────────── */
        .demo-tx {
          display: flex;
          gap: 14px;
          padding: 14px 16px;
          background: rgba(34, 197, 94, 0.04);
          border: 1px solid rgba(34, 197, 94, 0.15);
          border-radius: 14px;
        }
        .demo-tx-icon {
          font-size: 1.3rem;
          line-height: 1;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .demo-tx-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .demo-tx-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.78rem;
        }
        .demo-tx-label {
          color: var(--text-muted);
          font-weight: 500;
        }
        .demo-tx-value {
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 0.75rem;
        }
        .demo-tx-hash {
          color: #60a5fa;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .demo-tx-amount {
          color: #22c55e;
          font-weight: 700;
        }

        /* ─── Success banner ──────────────────────────── */
        .demo-success {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 14px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--accent);
        }
        .demo-success-check {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--accent);
          color: var(--accent-text);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 800;
          flex-shrink: 0;
          animation: checkPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes checkPop {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }

        /* ─── Footer ──────────────────────────────────── */
        .demo-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          border-top: 1px solid var(--border);
        }
        .demo-footer-cta {
          font-size: 0.78rem;
          color: var(--text-muted);
        }
        .demo-footer-badge {
          padding: 6px 14px;
          background: var(--accent);
          color: var(--accent-text);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .demo-footer-badge:hover {
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        /* ─── Keyframes ───────────────────────────────── */
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}

/* ─── Typing dots sub‑component ──────────────────────────── */
function TypingDots() {
  return (
    <div className="demo-typing demo-enter">
      <span /><span /><span />
      <style jsx>{`
        .demo-typing {
          display: flex;
          gap: 5px;
          padding: 10px 4px;
        }
        .demo-typing span {
          width: 7px;
          height: 7px;
          background: var(--text-muted);
          border-radius: 50%;
          animation: dotBounce 1.4s infinite ease-in-out;
        }
        .demo-typing span:nth-child(2) { animation-delay: 0.2s; }
        .demo-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
