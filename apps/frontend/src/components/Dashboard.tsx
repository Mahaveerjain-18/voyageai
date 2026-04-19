"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTrip,
  getAuditLog,
  triggerResearch,
  approveOptions,
  executeBookings,
  deliverConfirmations,
  swapOption,
  Trip,
  AuditEntry,
  ResearchOption,
} from "@/lib/api";
import { AuditLogPanel } from "./AuditLogPanel";

interface DashboardProps {
  tripId: string;
  onBack: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  CREATED:      { label: "Created",        color: "#666",    bg: "rgba(102,102,102,0.08)" },
  FUNDED:       { label: "Funded",         color: "#ffffff", bg: "rgba(255,255,255,0.04)" },
  RESEARCHING:  { label: "Researching…",   color: "#ffffff", bg: "rgba(255,255,255,0.04)" },
  OPTIONS_READY:{ label: "Options Ready",  color: "#ffffff", bg: "rgba(255,255,255,0.04)" },
  BOOKING:      { label: "Booking…",       color: "#ffffff", bg: "rgba(255,255,255,0.04)" },
  CONFIRMED:    { label: "Confirmed",      color: "#ffffff", bg: "rgba(255,255,255,0.04)" },
  DELIVERED:    { label: "Delivered",       color: "#ffffff", bg: "rgba(255,255,255,0.04)" },
  COMPLETED:    { label: "Completed",      color: "#ffffff", bg: "rgba(255,255,255,0.04)" },
  CANCELLED:    { label: "Cancelled",      color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  FAILED:       { label: "Failed",         color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
};

export function Dashboard({ tripId, onBack }: DashboardProps) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("traveler@voyageai.com");
  const [researchTab, setResearchTab] = useState<'flights' | 'hotels' | 'activities' | 'restaurants' | 'bestpicks'>('bestpicks');

  const refreshData = useCallback(async () => {
    try {
      const [t, a] = await Promise.all([getTrip(tripId), getAuditLog(tripId)]);
      setTrip(t);
      setAuditLogs(a.logs);
    } catch (err) {
      console.error(err);
    }
  }, [tripId]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const withAction = async (fn: () => Promise<any>) => {
    setLoading(true);
    await fn();
    await refreshData();
    setLoading(false);
  };

  if (!trip) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.2)",
          borderTopColor: "#ffffff",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  const status = STATUS_CONFIG[trip.status] || STATUS_CONFIG.CREATED;
  const budgetPct = trip.totalBudget > 0 ? (trip.totalSpent / trip.totalBudget) * 100 : 0;
  const totalApiCost = auditLogs.reduce((s, l) => s + (l.apiCost || 0), 0);

  const categories = [
    { label: "Flights", icon: "✈️", max: trip.spendingLimits.maxFlight, spent: trip.bookings.filter(b => b.type === "flight").reduce((s, b) => s + b.price, 0) },
    { label: "Hotels", icon: "🏨", max: trip.spendingLimits.maxHotel, spent: trip.bookings.filter(b => b.type === "hotel").reduce((s, b) => s + b.price, 0) },
    { label: "Activities", icon: "🎯", max: trip.spendingLimits.maxActivities, spent: trip.bookings.filter(b => b.type === "activity").reduce((s, b) => s + b.price, 0) },
    { label: "Food", icon: "🍱", max: trip.spendingLimits.maxFood, spent: 0 },
  ];

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case 'flight': return '✈️';
      case 'hotel': return '🏨';
      case 'activity': return '🎯';
      case 'restaurant': return '🍱';
      default: return '📌';
    }
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.3;
    return (
      <span style={{ fontSize: "0.72rem", letterSpacing: 1 }}>
        {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-secondary)", marginLeft: 4 }}>
          {rating.toFixed(1)}
        </span>
      </span>
    );
  };

  const handleSwap = async (item: ResearchOption) => {
    try {
      await withAction(() => swapOption(tripId, item.category, item));
    } catch (err) {
      console.error(err);
    }
  };

  const renderResearchCard = (item: ResearchOption, highlight = false) => (
    <div key={item.id} style={{
      padding: "16px 18px",
      background: highlight ? "rgba(255,255,255,0.04)" : "#111",
      border: `1px solid ${item.isBestPick ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.05)"}`,
      borderRadius: 14,
      transition: "border-color 0.2s, background 0.2s",
    }}>
      {/* Top row: icon, name, badges, price */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: "1.4rem", marginTop: 2 }}>{categoryIcon(item.category)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <p style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--text-primary)" }}>{item.name}</p>
            {item.isBestPick && (
              <span style={{
                padding: "2px 8px",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 6,
                fontSize: "0.65rem",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}>
                ⭐ Best Pick
              </span>
            )}
            <span style={{
              padding: "2px 7px",
              background: item.withinLimit ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${item.withinLimit ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
              borderRadius: 5,
              fontSize: "0.62rem",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              color: item.withinLimit ? "#22c55e" : "#ef4444",
            }}>
              {item.withinLimit ? "✓ Within limit" : "✗ Over limit"}
            </span>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 6, lineHeight: 1.4 }}>
            {item.description}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ color: "#f59e0b" }}>{renderStars(item.rating)}</span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
              via {item.provider}
            </span>
            {item.details?.departureTime && (
              <span style={{ fontSize: "0.7rem", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
                🛫 {item.details.departureTime}
              </span>
            )}
            {item.details?.duration && (
              <span style={{ fontSize: "0.7rem", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
                ⏱ {item.details.duration}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            color: "#ffffff",
            fontSize: "1.1rem",
            marginBottom: 4,
          }}>
            ${item.price}
          </p>
          {item.details?.pricePerNight && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-faint)" }}>
              ${item.details.pricePerNight}/night
            </p>
          )}
        </div>
      </div>
      {/* Action Links */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              fontSize: "0.72rem",
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontFamily: "var(--font-mono)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            🔗 View on {item.provider} →
          </a>
        )}
        {!item.isBestPick && (
          <button
            onClick={() => handleSwap(item)}
            disabled={loading}
            style={{
              padding: "5px 12px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 6,
              fontSize: "0.72rem",
              color: "#ffffff",
              fontFamily: "var(--font-mono)",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            Swap with AI Choice
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 64px" }}>
      {/* ── Header ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 36,
        paddingBottom: 24,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button
            onClick={onBack}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "8px 16px",
              color: "var(--text-secondary)",
              fontSize: "0.85rem",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "all 0.2s",
            }}
          >
            ← Home
          </button>
          <div>
            <h1 style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.6rem",
              fontWeight: 600,
              fontStyle: "italic",
              color: "var(--text-primary)",
              marginBottom: 2,
            }}>
              {trip.origin ? `${trip.origin} → ${trip.destination}` : trip.destination}
            </h1>
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              letterSpacing: "0.02em",
            }}>
              {trip.startDate} → {trip.endDate} · {trip.travelers} traveler{trip.travelers > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 16px",
          background: status.bg,
          border: `1px solid ${status.color}30`,
          borderRadius: 10,
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: status.color,
            boxShadow: `0 0 8px ${status.color}60`,
          }} />
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: status.color,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
            {status.label}
          </span>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 900px)", justifyContent: "center", gap: 20, alignItems: "start" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Budget Overview Card */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.15rem",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}>
                Budget Overview
              </h3>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                color: "var(--text-faint)",
                padding: "4px 10px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 6,
              }}>
                API: ${totalApiCost.toFixed(4)}
              </span>
            </div>

            {/* Stat grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
              {[
                { label: "BUDGET", value: `$${trip.totalBudget}`, color: "var(--text-primary)" },
                { label: "SPENT", value: `$${trip.totalSpent}`, color: "var(--text-primary)" },
                { label: "REMAINING", value: `$${trip.totalBudget - trip.totalSpent}`, color: "var(--text-primary)" },
                { label: "BOOKINGS", value: `${trip.bookings.length}`, color: "var(--text-primary)" },
              ].map((s) => (
                <div key={s.label} style={{
                  background: "#111",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 12,
                  padding: "16px 14px",
                  textAlign: "center",
                }}>
                  <p style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.62rem",
                    fontWeight: 500,
                    color: "var(--text-faint)",
                    marginBottom: 6,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}>{s.label}</p>
                  <p style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    color: s.color,
                    letterSpacing: "-0.02em",
                  }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Budget bar */}
            <div style={{
              height: 5,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 3,
              overflow: "hidden",
              marginBottom: 6,
            }}>
              <div style={{
                height: "100%",
                borderRadius: 3,
                background: budgetPct > 90 ? "#ef4444" : "#ffffff",
                width: `${Math.min(budgetPct, 100)}%`,
                transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }} />
            </div>
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.68rem",
              color: "var(--text-faint)",
              textAlign: "right",
            }}>
              {budgetPct.toFixed(1)}% used
            </p>

            {/* Category bars */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
              {categories.map((c) => {
                const pct = c.max > 0 ? Math.min((c.spent / c.max) * 100, 100) : 0;
                return (
                  <div key={c.label} style={{
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 10,
                    padding: "14px 16px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{c.icon}</span> {c.label}
                      </span>
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}>
                        ${c.spent}/${c.max}
                      </span>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        borderRadius: 2,
                        background: "#ffffff",
                        width: `${pct}%`,
                        transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Research Results (Rich UI) ─── */}
          {trip.researchResults && (
            <div style={cardStyle}>
              {/* Summary */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 8,
                }}>
                  AI Research Results
                </h3>
                <p style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}>
                  {trip.researchResults.summary}
                </p>
                {trip.researchResults.weather && (
                  <p style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    marginTop: 6,
                    fontFamily: "var(--font-mono)",
                  }}>
                    🌤️ Weather: {(trip.researchResults.weather as any).conditions || 'Fair'} · {(trip.researchResults.weather as any).avgTemp || 24}°C
                  </p>
                )}
                <p style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.82rem",
                  color: "#ffffff",
                  marginTop: 8,
                  fontWeight: 600,
                }}>
                  Estimated Total: ${trip.researchResults.totalEstimatedCost}
                </p>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: 18, flexWrap: "wrap" }}>
                {([
                  { key: 'bestpicks' as const, label: '⭐ Best Picks', count: 4 },
                  { key: 'flights' as const, label: '✈️ Flights', count: trip.researchResults.flights.length },
                  { key: 'hotels' as const, label: '🏨 Hotels', count: trip.researchResults.hotels.length },
                  { key: 'activities' as const, label: '🎯 Activities', count: trip.researchResults.activities.length },
                  { key: 'restaurants' as const, label: '🍱 Restaurants', count: trip.researchResults.restaurants.length },
                ]).map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setResearchTab(key)}
                    style={{
                      padding: "8px 14px",
                      background: researchTab === key ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${researchTab === key ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 8,
                      color: researchTab === key ? "#ffffff" : "var(--text-secondary)",
                      fontSize: "0.78rem",
                      fontFamily: "var(--font-sans)",
                      fontWeight: researchTab === key ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {label} ({count})
                  </button>
                ))}
              </div>

              {/* Best Picks Tab */}
              {researchTab === 'bestpicks' && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 4, fontStyle: "italic" }}>
                    AI-recommended best options based on rating, popularity, and price within your limits.
                  </p>
                  {[
                    ...trip.researchResults.flights.filter(o => o.isBestPick),
                    ...trip.researchResults.hotels.filter(o => o.isBestPick),
                    ...trip.researchResults.activities.filter(o => o.isBestPick),
                    ...trip.researchResults.restaurants.filter(o => o.isBestPick),
                  ].map((item) => renderResearchCard(item, true))}
                </div>
              )}

              {/* Category Tabs */}
              {researchTab === 'flights' && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {trip.researchResults.flights.map((item) => renderResearchCard(item))}
                </div>
              )}
              {researchTab === 'hotels' && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {trip.researchResults.hotels.map((item) => renderResearchCard(item))}
                </div>
              )}
              {researchTab === 'activities' && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {trip.researchResults.activities.map((item) => renderResearchCard(item))}
                </div>
              )}
              {researchTab === 'restaurants' && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {trip.researchResults.restaurants.map((item) => renderResearchCard(item))}
                </div>
              )}
            </div>
          )}

          {/* ─── AI Finalized Plan ─── */}
          {trip.researchResults?.finalizedPlan && (
            <div style={cardStyle}>
              <h3 style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.15rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 4,
              }}>
                AI Finalized Plan
              </h3>
              <p style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                marginBottom: 18,
                fontStyle: "italic",
              }}>
                The AI agent has selected these options for booking based on your preferences and budget.
              </p>

              {/* Selected Flight */}
              {trip.researchResults.finalizedPlan.flight && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: "0.72rem", color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Flight
                  </p>
                  <div style={{
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                        {trip.researchResults.finalizedPlan.flight.name}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {trip.researchResults.finalizedPlan.flight.description}
                      </p>
                    </div>
                    <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#ffffff", fontSize: "1rem" }}>
                      ${trip.researchResults.finalizedPlan.flight.price}
                    </p>
                  </div>
                </div>
              )}

              {/* Selected Hotel */}
              {trip.researchResults.finalizedPlan.hotel && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: "0.72rem", color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Hotel ({(trip.researchResults.finalizedPlan.hotel as any).totalNights} nights)
                  </p>
                  <div style={{
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                        {trip.researchResults.finalizedPlan.hotel.name}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {trip.researchResults.finalizedPlan.hotel.description} · ${(trip.researchResults.finalizedPlan.hotel as any).pricePerNight}/night
                      </p>
                    </div>
                    <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#ffffff", fontSize: "1rem" }}>
                      ${trip.researchResults.finalizedPlan.hotel.price}
                    </p>
                  </div>
                </div>
              )}

              {/* Selected Activities */}
              {trip.researchResults.finalizedPlan.activities?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: "0.72rem", color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Activities ({trip.researchResults.finalizedPlan.activities.length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {trip.researchResults.finalizedPlan.activities.map((act: any, i: number) => (
                      <div key={i} style={{
                        padding: "12px 16px",
                        background: "#111",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 10,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 500, fontSize: "0.85rem", color: "var(--text-primary)" }}>{act.name}</p>
                          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{act.description} · {act.duration}</p>
                        </div>
                        <p style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem", marginLeft: 12 }}>
                          ${act.price}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Restaurants */}
              {trip.researchResults.finalizedPlan.restaurants?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: "0.72rem", color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Dining ({trip.researchResults.finalizedPlan.restaurants.length} meals)
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {trip.researchResults.finalizedPlan.restaurants.map((rest: any, i: number) => (
                      <div key={i} style={{
                        padding: "12px 16px",
                        background: "#111",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 10,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 500, fontSize: "0.85rem", color: "var(--text-primary)" }}>{rest.name}</p>
                          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{rest.description}</p>
                        </div>
                        <p style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem", marginLeft: 12 }}>
                          ${rest.price}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Finalized total */}
              <div style={{
                padding: "14px 16px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Finalized Total
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#ffffff", fontSize: "1.1rem" }}>
                  ${trip.researchResults.totalEstimatedCost}
                </p>
              </div>
            </div>
          )}

          {/* Agent Controls Card */}
          <div style={cardStyle}>
            <h3 style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.15rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 18,
            }}>
              Agent Controls
            </h3>

            {trip.status === "FUNDED" && (
              <button
                onClick={() => withAction(() => triggerResearch(tripId))}
                disabled={loading}
                style={{
                  ...actionBtnStyle,
                  background: "#ffffff",
                  color: "#0a0a0a",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? "Researching..." : "Start AI Research"}
              </button>
            )}

            {trip.status === "OPTIONS_READY" && (
              <button
                onClick={() => withAction(() => approveOptions(tripId, trip.options.map(o => o.id)))}
                disabled={loading}
                style={{
                  ...actionBtnStyle,
                  background: "#ffffff",
                  color: "#0a0a0a",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? "Approving..." : "Approve All Options"}
              </button>
            )}

            {trip.status === "BOOKING" && (
              <button
                onClick={() => withAction(() => executeBookings(tripId))}
                disabled={loading}
                style={{
                  ...actionBtnStyle,
                  background: "#ffffff",
                  color: "#0a0a0a",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? "Booking..." : "Execute Bookings"}
              </button>
            )}

            {trip.status === "CONFIRMED" && (
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email for confirmations"
                  style={{
                    flex: 1,
                    padding: "14px 16px",
                    background: "#141414",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    color: "#f5f5f5",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => withAction(() => deliverConfirmations(tripId, email))}
                  disabled={loading}
                  style={{
                    ...actionBtnStyle,
                    width: "auto",
                    padding: "14px 20px",
                    fontSize: "0.85rem",
                    background: "#ffffff",
                    color: "#0a0a0a",
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {loading ? "Sending..." : "Deliver"}
                </button>
              </div>
            )}

            {trip.status === "DELIVERED" && (
              <div style={{ textAlign: "center", padding: "28px 16px" }}>
                <p style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontSize: "1.3rem",
                  color: "#ffffff",
                  marginBottom: 6,
                }}>
                  Trip Booked & Delivered!
                </p>
                <p style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                }}>
                  Confirmations sent to {email}
                </p>
              </div>
            )}

            {!["FUNDED", "OPTIONS_READY", "BOOKING", "CONFIRMED", "DELIVERED"].includes(trip.status) && (
              <p style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                textAlign: "center",
                padding: 20,
                fontStyle: "italic",
              }}>
                Waiting for status change...
              </p>
            )}
          </div>


          {/* Legacy Bookings list */}
          {trip.bookings.length > 0 && (
            <div style={cardStyle}>
              <h3 style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.15rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 18,
              }}>
                Confirmed Bookings
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {trip.bookings.map((item: any) => (
                  <div key={item.id} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 12,
                  }}>
                    <span style={{ fontSize: "1.3rem" }}>
                      {item.type === "flight" ? "✈️" : item.type === "hotel" ? "🏨" : "🎯"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{item.name}</p>
                      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {item.confirmationCode}
                      </p>
                    </div>
                    <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#ffffff", fontSize: "1rem" }}>
                      ${item.price}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Style objects ── */

const cardStyle: React.CSSProperties = {
  background: "#161616",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 18,
  padding: "28px 28px",
};

const actionBtnStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "15px 24px",
  fontFamily: "'Inter', sans-serif",
  fontWeight: 600,
  fontSize: "0.92rem",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  transition: "all 0.2s ease",
};
