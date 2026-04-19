"use client";

import React, { useState } from "react";
import { createTrip, createCheckoutSession, confirmCheckout } from "@/lib/api";
import { DatePicker } from "./DatePicker";
import { AnimatedSlideIn } from "./AnimatedSlideIn";

interface TripPlannerProps {
  onTripCreated: (tripId: string) => void;
  onBack: () => void;
}

export function TripPlanner({ onTripCreated, onBack }: TripPlannerProps) {
  const [step, setStep] = useState<"details" | "budget" | "funding">("details");
  const [loading, setLoading] = useState(false);

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

  const handleFundTrip = async () => {
    if (!sessionId || !tripId) return;
    setLoading(true);
    try {
      await confirmCheckout(sessionId);
      onTripCreated(tripId);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const stepIndex = ["details", "budget", "funding"].indexOf(step);
  const canProceed = form.origin && form.destination && form.startDate && form.endDate;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
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
                  onChange={(d) => setForm({ ...form, startDate: d })}
                  placeholder="Select departure"
                />
              </AnimatedSlideIn>
              <AnimatedSlideIn delay={400} as="div">
                <DatePicker 
                  label="End Date"
                  value={form.endDate}
                  onChange={(d) => setForm({ ...form, endDate: d })}
                  placeholder="Select return"
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

          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Category sliders */}
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
                  ]).map(({ key, label, icon }) => (
                    <div key={key} style={{
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
                  ))}
                </div>
              )}
            </div>

            {/* Total budget */}
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

            {/* Actions */}
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
      )}

      {/* ───── Step 3: Fund ───── */}
      {step === "funding" && (
        <div className="slide-up" style={{ textAlign: "center", paddingTop: 24 }}>
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

          {/* Checkout card */}
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
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--text-faint)",
              marginBottom: 32,
              letterSpacing: "0.06em",
            }}>
              USDC on Base
            </p>

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

            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              color: "var(--text-faint)",
              marginTop: 20,
            }}>
              {form.destination} · {form.startDate} → {form.endDate}
            </p>
          </div>
        </div>
      )}
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
