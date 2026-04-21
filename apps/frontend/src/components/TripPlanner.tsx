"use client";

import React, { useState, useCallback } from "react";
import { createTrip, createCheckoutSession, confirmCheckout } from "@/lib/api";
import { DatePicker } from "./DatePicker";
import { AnimatedSlideIn } from "./AnimatedSlideIn";
import { TripChatAgent } from "./TripChatAgent";

interface TripPlannerProps {
  onTripCreated: (tripId: string) => void;
  onBack: () => void;
}

export function TripPlanner({ onTripCreated, onBack }: TripPlannerProps) {
  const [step, setStep] = useState<"details" | "budget" | "funding">("details");
  const [loading, setLoading] = useState(false);
  const [paymentPhase, setPaymentPhase] = useState<null | "processing" | "success">(null);

  const [form, setForm] = useState({
    origin: "",
    destination: "",
    startDate: "",
    endDate: "",
    travelers: 1,
    preferences: "",
    totalBudget: 2000,
    maxFlight: 800,
    maxHotel: 900,
    maxActivities: 200,
    maxFood: 100,
  });

  const [tripId, setTripId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleDetailsSubmit = () => {
    if (!form.destination || !form.startDate || !form.endDate) return;
    setStep("budget");
  };

  const handleBudgetSubmit = async () => {
    setLoading(true);
    try {
      const trip = await createTrip({
        origin: form.origin,
        destination: form.destination,
        startDate: form.startDate,
        endDate: form.endDate,
        travelers: form.travelers,
        preferences: form.preferences,
        totalBudget: form.totalBudget,
        spendingLimits: {
          maxFlight: form.maxFlight,
          maxHotel: form.maxHotel,
          maxActivities: form.maxActivities,
          maxFood: form.maxFood,
        },
      });
      setTripId(trip.id);
      const session = await createCheckoutSession(trip.id, form.totalBudget.toString());
      setSessionId(session.sessionId);
      setStep("funding");
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleFundTrip = useCallback(async () => {
    if (!sessionId || !tripId) return;
    setLoading(true);
    setPaymentPhase("processing");
    try {
      await confirmCheckout(sessionId);
      // Show success animation
      setPaymentPhase("success");
      // Wait 1.8s for the animation, then proceed
      await new Promise((resolve) => setTimeout(resolve, 2500));
      onTripCreated(tripId);
    } catch (err) {
      console.error(err);
      setPaymentPhase(null);
    }
    setLoading(false);
  }, [sessionId, tripId, onTripCreated]);

  const stepIndex = ["details", "budget", "funding"].indexOf(step);
  const canProceed = form.origin && form.destination && form.startDate && form.endDate;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px", position: "relative" }}>

      {/* ───── Payment Processing Overlay ───── */}
      {paymentPhase && (
        <div className="payment-overlay">
          <div className="payment-content">
            {paymentPhase === "processing" && (
              <>
                <div className="payment-spinner-wrap">
                  <svg className="payment-ring" viewBox="0 0 66 66">
                    <circle className="payment-ring-track" cx="33" cy="33" r="30" fill="none" />
                    <circle className="payment-ring-fill" cx="33" cy="33" r="30" fill="none" />
                  </svg>
                  <span className="payment-spinner-icon">💳</span>
                </div>
                <p className="payment-label">Processing Payment</p>
                <p className="payment-sub">Securing USDC escrow on Base...</p>
              </>
            )}
            {paymentPhase === "success" && (
              <div className="payment-success-wrap">
                <div className="payment-check-circle">
                  <svg className="payment-check-svg" viewBox="0 0 52 52">
                    <circle className="payment-check-bg" cx="26" cy="26" r="25" fill="none" />
                    <path className="payment-check-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                  </svg>
                </div>
                <p className="payment-label payment-success-text">Payment Successful</p>
                <p className="payment-sub">Redirecting to your dashboard...</p>
                <div className="payment-confetti">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <span key={i} className="confetti-dot" style={{
                      left: `${10 + Math.random() * 80}%`,
                      animationDelay: `${Math.random() * 0.5}s`,
                      animationDuration: `${0.8 + Math.random() * 0.6}s`,
                      background: ['#fff', '#a3e635', '#34d399', '#60a5fa', '#f472b6'][i % 5],
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <style>{`
            .payment-overlay {
              position: fixed;
              inset: 0;
              z-index: 999999;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(0, 0, 0, 0.85);
              backdrop-filter: blur(20px);
              animation: overlayIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes overlayIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .payment-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 20px;
              animation: contentIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes contentIn {
              from { opacity: 0; transform: scale(0.9) translateY(20px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }

            /* Spinner ring */
            .payment-spinner-wrap {
              position: relative;
              width: 80px;
              height: 80px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .payment-ring {
              width: 80px;
              height: 80px;
              transform: rotate(-90deg);
            }
            .payment-ring-track {
              stroke: rgba(255, 255, 255, 0.06);
              stroke-width: 3;
            }
            .payment-ring-fill {
              stroke: #a3e635;
              stroke-width: 3;
              stroke-linecap: round;
              stroke-dasharray: 188.5;
              stroke-dashoffset: 188.5;
              animation: ringFill 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
              filter: drop-shadow(0 0 6px rgba(163, 230, 53, 0.4));
            }
            @keyframes ringFill {
              to { stroke-dashoffset: 0; }
            }
            .payment-spinner-icon {
              position: absolute;
              font-size: 1.6rem;
              animation: iconPulse 1s ease-in-out infinite;
            }
            @keyframes iconPulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.15); }
            }

            .payment-label {
              font-family: var(--font-sans);
              font-size: 1.3rem;
              font-weight: 600;
              color: #fff;
              letter-spacing: -0.01em;
            }
            .payment-sub {
              font-family: var(--font-mono);
              font-size: 0.78rem;
              color: rgba(255, 255, 255, 0.4);
              letter-spacing: 0.03em;
            }

            /* Success checkmark */
            .payment-success-wrap {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 20px;
              animation: successPop 0.5s cubic-bezier(0.16, 1, 0.3, 1);
              position: relative;
            }
            @keyframes successPop {
              from { opacity: 0; transform: scale(0.5); }
              50% { transform: scale(1.08); }
              to { opacity: 1; transform: scale(1); }
            }

            .payment-check-circle {
              width: 80px;
              height: 80px;
            }
            .payment-check-svg {
              width: 80px;
              height: 80px;
            }
            .payment-check-bg {
              stroke: #a3e635;
              stroke-width: 2.5;
              stroke-dasharray: 166;
              stroke-dashoffset: 166;
              animation: circleStroke 0.6s ease forwards;
              filter: drop-shadow(0 0 8px rgba(163, 230, 53, 0.3));
            }
            @keyframes circleStroke {
              to { stroke-dashoffset: 0; }
            }
            .payment-check-path {
              stroke: #a3e635;
              stroke-width: 3.5;
              stroke-linecap: round;
              stroke-linejoin: round;
              stroke-dasharray: 48;
              stroke-dashoffset: 48;
              animation: checkStroke 0.4s 0.4s ease forwards;
              filter: drop-shadow(0 0 6px rgba(163, 230, 53, 0.4));
            }
            @keyframes checkStroke {
              to { stroke-dashoffset: 0; }
            }

            .payment-success-text {
              color: #a3e635;
            }

            /* Confetti */
            .payment-confetti {
              position: absolute;
              top: 0;
              left: 50%;
              transform: translateX(-50%);
              width: 300px;
              height: 200px;
              pointer-events: none;
              overflow: hidden;
            }
            .confetti-dot {
              position: absolute;
              top: 40px;
              width: 6px;
              height: 6px;
              border-radius: 50%;
              animation: confettiFall ease forwards;
              opacity: 0;
            }
            @keyframes confettiFall {
              0% { transform: translateY(0) scale(0); opacity: 1; }
              50% { opacity: 1; }
              100% { transform: translateY(160px) scale(1); opacity: 0; }
            }
          `}</style>
        </div>
      )}
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          fontSize: "0.88rem",
          cursor: "pointer",
          marginBottom: 40,
          padding: 0,
          transition: "color 0.2s",
          fontFamily: "var(--font-sans)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
      >
        ← Back to home
      </button>

      {/* Progress stepper */}
      <div style={{ display: "flex", gap: 8, marginBottom: 48 }}>
        {["Trip Details", "Budget", "Fund Trip"].map((label, i) => (
          <div key={label} style={{ flex: 1 }}>
            <div style={{
              height: 3,
              borderRadius: 2,
              background: i <= stepIndex
                ? "var(--accent)"
                : "rgba(255,255,255,0.06)",
              transition: "background 0.5s ease",
            }} />
            <p style={{
              fontSize: "0.72rem",
              fontFamily: "var(--font-mono)",
              marginTop: 10,
              letterSpacing: "0.04em",
              fontWeight: i === stepIndex ? 600 : 400,
              color: i === stepIndex
                ? "var(--accent)"
                : i < stepIndex
                  ? "var(--text-secondary)"
                  : "var(--text-faint)",
              textTransform: "uppercase",
            }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ───── Step 1: Details ───── */}
      {step === "details" && (
        <div className="slide-up">
          <p style={{
            fontSize: "0.7rem",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 12,
            fontWeight: 600,
          }}>
            STEP 01
          </p>

          <h2 style={{
            fontFamily: "var(--font-serif)",
            fontSize: "2.2rem",
            fontWeight: 400,
            fontStyle: "italic",
            lineHeight: 1.2,
            marginBottom: 12,
            color: "var(--text-primary)",
          }}>
            Where do you want to go?
          </h2>

          <p style={{
            color: "var(--text-secondary)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            marginBottom: 40,
            maxWidth: 480,
          }}>
            Tell us your dream destination. The AI agent handles research,
            booking, and payments autonomously.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Origin & Destination */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <AnimatedSlideIn delay={100} as="div">
                <div>
                  <label style={labelStyle}>Departing From</label>
                  <input
                    type="text"
                    value={form.origin}
                    onChange={(e) => setForm({ ...form, origin: e.target.value })}
                    placeholder="e.g. San Francisco"
                    style={inputStyle}
                    className="premium-input-raw"
                  />
                </div>
              </AnimatedSlideIn>
              <AnimatedSlideIn delay={200} as="div">
                <div>
                  <label style={labelStyle}>Destination</label>
                  <input
                    type="text"
                    value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    placeholder="e.g. Tokyo, Japan"
                    style={inputStyle}
                    className="premium-input-raw"
                  />
                </div>
              </AnimatedSlideIn>
            </div>

            {/* Date grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <AnimatedSlideIn delay={300} as="div">
                <DatePicker 
                  label="Start Date"
                  value={form.startDate}
                  onChange={(d) => {
                    const newForm = { ...form, startDate: d };
                    if (form.endDate && form.endDate < d) {
                      newForm.endDate = "";
                    }
                    setForm(newForm);
                  }}
                  placeholder="Select departure"
                  minDate={new Date().toLocaleDateString('en-CA')} // yyyy-mm-dd
                />
              </AnimatedSlideIn>
              <AnimatedSlideIn delay={400} as="div">
                <DatePicker 
                  label="End Date"
                  value={form.endDate}
                  onChange={(d) => setForm({ ...form, endDate: d })}
                  placeholder="Select return"
                  minDate={form.startDate || new Date().toLocaleDateString('en-CA')}
                />
              </AnimatedSlideIn>
            </div>

            {/* Travelers */}
            <AnimatedSlideIn delay={500} as="div">
              <div>
                <label style={labelStyle}>Travelers</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.travelers}
                  onChange={(e) => setForm({ ...form, travelers: parseInt(e.target.value) || 1 })}
                  style={inputStyle}
                  className="premium-input-raw"
                />
              </div>
            </AnimatedSlideIn>

            {/* Preferences */}
            <AnimatedSlideIn delay={600} as="div">
              <div>
                <label style={labelStyle}>Preferences</label>
                <textarea
                  value={form.preferences}
                  onChange={(e) => setForm({ ...form, preferences: e.target.value })}
                  rows={3}
                  placeholder="Culture, food, nature, hidden gems, nightlife..."
                  style={{ ...inputStyle, resize: "none", minHeight: 120 }}
                  className="premium-input-raw"
                />
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                {["Local Food", "Hidden Gems", "Nightlife", "Adventure", "Relaxation", "Museums", "Culture & History", "Nature", "Shopping", "Live Music"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                        const separator = form.preferences && !form.preferences.endsWith(" ") ? ", " : "";
                        setForm({ ...form, preferences: form.preferences + separator + tag });
                    }}
                    type="button"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "16px",
                      padding: "5px 12px",
                      fontSize: "0.72rem",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </AnimatedSlideIn>

            <button
              onClick={handleDetailsSubmit}
              disabled={!canProceed}
              style={{
                ...btnPrimaryStyle,
                width: "100%",
                opacity: canProceed ? 1 : 0.35,
                cursor: canProceed ? "pointer" : "not-allowed",
              }}
            >
              Continue to budget →
            </button>
          </div>
        </div>
      )}

      {/* ───── Step 2: Budget ───── */}
      {step === "budget" && (
        <div className="slide-up">
          <AnimatedSlideIn delay={0} as="div">
            <p style={{
              fontSize: "0.7rem",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 12,
              fontWeight: 600,
            }}>
              STEP 02
            </p>
          </AnimatedSlideIn>

          <AnimatedSlideIn delay={100} as="div">
            <h2 style={{
              fontFamily: "var(--font-serif)",
              fontSize: "2.2rem",
              fontWeight: 400,
              fontStyle: "italic",
              lineHeight: 1.2,
              marginBottom: 12,
            }}>
              Set your spending limits.
            </h2>
          </AnimatedSlideIn>

          <AnimatedSlideIn delay={200} as="div">
            <p style={{
              color: "var(--text-secondary)",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              marginBottom: 40,
              maxWidth: 480,
            }}>
              The AI agent can never exceed these limits.
              Every dollar is governed on chain.
            </p>
          </AnimatedSlideIn>

          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Category sliders */}
            <AnimatedSlideIn delay={300} as="div">
              <div>
                <h3 style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.3rem",
                  color: "var(--text-primary)",
                  marginBottom: 16,
                  fontWeight: 400
                }}>
                  Allocate your travel funds
                </h3>

                {form.totalBudget >= 10000 ? (
                  <div style={{
                    padding: "24px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px dashed rgba(255, 255, 255, 0.3)",
                    borderRadius: 14,
                    textAlign: "center"
                  }}>
                    <p style={{
                      color: "var(--accent)", 
                      fontFamily: "var(--font-mono)", 
                      fontSize: "0.85rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      marginBottom: 8
                    }}>✨ Luxury Mode Unlocked</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                      Category limits are ignored. The AI agent will plan an ultra-premium, unlimited 5-star experience.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {([
                      { key: "maxFlight" as const, label: "Flights", icon: "✈️" },
                      { key: "maxHotel" as const, label: "Hotels", icon: "🏨" },
                      { key: "maxActivities" as const, label: "Activities", icon: "🎯" },
                      { key: "maxFood" as const, label: "Food & Dining", icon: "🍱" },
                    ]).map(({ key, label, icon }, idx) => (
                      <AnimatedSlideIn key={key} delay={400 + idx * 100} as="div">
                        <div style={{
                          padding: "20px 22px",
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          borderRadius: 14,
                        }}>
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 12,
                          }}>
                            <span style={{
                              fontSize: "0.88rem",
                              color: "var(--text-secondary)",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}>
                              <span style={{ fontSize: "1.1rem" }}>{icon}</span>
                              {label}
                            </span>
                            <span style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.95rem",
                              fontWeight: 700,
                              color: "var(--text-primary)",
                            }}>
                              ${form[key]}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0} max={10000} step={50}
                            value={form[key]}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              const newForm = { ...form, [key]: val };
                              const sum = newForm.maxFlight + newForm.maxHotel + newForm.maxActivities + newForm.maxFood;
                              setForm({ ...newForm, totalBudget: sum });
                            }}
                            style={{ width: "100%" }}
                          />
                        </div>
                      </AnimatedSlideIn>
                    ))}
                  </div>
                )}
              </div>
            </AnimatedSlideIn>

            {/* Total budget */}
            <AnimatedSlideIn delay={800} as="div">
              <div style={{
                padding: "24px 28px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 16,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.1rem",
                    color: "var(--text-primary)",
                  }}>
                    Total Budget
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "var(--accent)",
                  }}>
                    ${form.totalBudget >= 10000 ? "10000+" : form.totalBudget}
                  </span>
                </div>
                <input
                  type="range"
                  min={500} max={10000} step={100}
                  value={form.totalBudget}
                  onChange={(e) => {
                    const newTotal = parseInt(e.target.value);
                    const oldTotal = form.maxFlight + form.maxHotel + form.maxActivities + form.maxFood;
                    const ratio = oldTotal > 0 ? newTotal / oldTotal : 1;
                    setForm({
                      ...form,
                      totalBudget: newTotal,
                      maxFlight: Math.round(form.maxFlight * ratio),
                      maxHotel: Math.round(form.maxHotel * ratio),
                      maxActivities: Math.round(form.maxActivities * ratio),
                      maxFood: Math.round(form.maxFood * ratio),
                    });
                  }}
                  style={{ width: "100%" }}
                />
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 8,
                }}>
                  <span style={rangeLabel}>$500</span>
                  <span style={{ ...rangeLabel, color: "var(--text-muted)" }}>USDC on Base</span>
                  <span style={rangeLabel}>$10000+</span>
                </div>
              </div>
            </AnimatedSlideIn>

            {/* Actions */}
            <div className="slide-up" style={{ animationDelay: "0.5s", animationFillMode: "both" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setStep("details")}
                  style={btnSecondaryStyle}
                >
                  ← Back
                </button>
                <button
                  onClick={handleBudgetSubmit}
                  disabled={loading}
                  style={{ ...btnPrimaryStyle, flex: 1, opacity: loading ? 0.5 : 1 }}
                >
                  {loading ? "Creating trip..." : "Create trip & fund →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───── Step 3: Fund ───── */}
      {step === "funding" && (
        <div className="slide-up" style={{ textAlign: "center", paddingTop: 24 }}>
          <AnimatedSlideIn delay={0} as="div">
            <p style={{
              fontSize: "0.7rem",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 12,
              fontWeight: 600,
            }}>
              STEP 03
            </p>
          </AnimatedSlideIn>

          <AnimatedSlideIn delay={100} as="div">
            <h2 style={{
              fontFamily: "var(--font-serif)",
              fontSize: "2.2rem",
              fontWeight: 400,
              fontStyle: "italic",
              lineHeight: 1.2,
              marginBottom: 12,
            }}>
              Fund your trip.
            </h2>
          </AnimatedSlideIn>

          <AnimatedSlideIn delay={200} as="div">
            <p style={{
              color: "var(--text-secondary)",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              marginBottom: 40,
              maxWidth: 420,
              margin: "0 auto 40px",
            }}>
              USDC goes into a time-locked escrow subwallet.
              Auto-refund if cancelled.
            </p>
          </AnimatedSlideIn>

          {/* Checkout card */}
          <AnimatedSlideIn delay={300} as="div">
            <div style={{
              maxWidth: 420,
              margin: "0 auto",
              padding: "40px 36px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              textAlign: "center",
            }}>
              {/* Locus badge */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 8,
                marginBottom: 28,
              }}>
                <span style={{
                  width: 6,
                  height: 6,
                  background: "var(--accent)",
                  borderRadius: "50%",
                  animation: "pulse 2s infinite",
                }} />
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "var(--accent)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  Locus Checkout
                </span>
              </div>

              {/* Amount */}
              <AnimatedSlideIn delay={500} as="div">
                <div style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "3rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: 4,
                  letterSpacing: "-0.02em",
                }}>
                  ${form.totalBudget}<span style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>.00</span>
                </div>
              </AnimatedSlideIn>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--text-faint)",
                marginBottom: 32,
                letterSpacing: "0.06em",
              }}>
                USDC on Base
              </p>

              <AnimatedSlideIn delay={600} as="div">
                <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
                  <button
                    onClick={handleFundTrip}
                    disabled={loading}
                    style={{
                      ...btnPrimaryStyle,
                      width: "100%",
                      padding: "16px",
                      fontSize: "1rem",
                      opacity: loading ? 0.5 : 1,
                    }}
                  >
                    {loading ? "Processing..." : "Pay with USDC →"}
                  </button>
                  
                  <button
                    onClick={() => setStep("budget")}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "14px",
                      fontSize: "0.9rem",
                      background: "transparent",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      transition: "all 0.2s ease"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                    onMouseOut={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                  >
                    ← Back to Budget
                  </button>
                </div>
              </AnimatedSlideIn>

              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                color: "var(--text-faint)",
                marginTop: 20,
              }}>
                {form.destination} · {form.startDate} → {form.endDate}
              </p>
            </div>
          </AnimatedSlideIn>
        </div>
      )}

      {/* AI Travel Chat Agent */}
      <TripChatAgent
        tripContext={{
          origin: form.origin,
          destination: form.destination,
          startDate: form.startDate,
          endDate: form.endDate,
          travelers: form.travelers,
          preferences: form.preferences,
          totalBudget: form.totalBudget,
        }}
      />
    </div>
  );
}

/* ── Inline style objects ── */

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-mono)",
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "rgba(255,255,255,0.9)",
  marginBottom: 10,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "15px 18px",
  background: "#141414",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#f5f5f5",
  fontFamily: "var(--font-sans)",
  fontSize: "0.95rem",
  outline: "none",
  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
};

const btnPrimaryStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "15px 28px",
  background: "#ffffff",
  color: "#0a0a0a",
  fontFamily: "'Inter', sans-serif",
  fontWeight: 600,
  fontSize: "0.92rem",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const btnSecondaryStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "15px 24px",
  background: "transparent",
  color: "#a3a3a3",
  fontFamily: "'Inter', sans-serif",
  fontWeight: 500,
  fontSize: "0.92rem",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const rangeLabel: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "0.68rem",
  color: "var(--text-faint)",
};
