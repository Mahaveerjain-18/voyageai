"use client";

import React, { useEffect, useState } from "react";
import { getAllTrips, Trip } from "@/lib/api";

interface MyTripsProps {
  onBack: () => void;
  onViewTrip: (tripId: string) => void;
  onStartPlanning: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  CREATED: { label: "Created", color: "#a3a3a3", bg: "rgba(163,163,163,0.08)", icon: "📝" },
  FUNDED: { label: "Funded", color: "#60a5fa", bg: "rgba(96,165,250,0.08)", icon: "💰" },
  RESEARCHING: { label: "Researching", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: "🔍" },
  OPTIONS_READY: { label: "Options Ready", color: "#a78bfa", bg: "rgba(167,139,250,0.08)", icon: "📋" },
  BOOKING: { label: "Booking", color: "#f97316", bg: "rgba(249,115,22,0.08)", icon: "✈️" },
  CONFIRMED: { label: "Confirmed", color: "#a3e635", bg: "rgba(163,230,53,0.08)", icon: "✅" },
  DELIVERED: { label: "Delivered", color: "#34d399", bg: "rgba(52,211,153,0.08)", icon: "📧" },
  CANCELLED: { label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: "❌" },
  FAILED: { label: "Failed", color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: "⚠️" },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || { label: status, color: "#a3a3a3", bg: "rgba(163,163,163,0.08)", icon: "•" };
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function daysBetween(start: string, end: string) {
  try {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(diff / 86400000));
  } catch {
    return 0;
  }
}

export function MyTrips({ onBack, onViewTrip, onStartPlanning }: MyTripsProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllTrips()
      .then((data) => {
        // Sort by most recent first
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setTrips(sorted);
      })
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48 }}>
        <div>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "0.85rem",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              padding: 0,
              marginBottom: 16,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            ← Back to home
          </button>

          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "2.4rem",
              fontWeight: 400,
              color: "var(--text-primary)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Trip History
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.95rem",
              color: "var(--text-secondary)",
              marginTop: 8,
            }}
          >
            {trips.length > 0
              ? `${trips.length} trip${trips.length > 1 ? "s" : ""} planned with VoyageAI`
              : "Your travel history will appear here"}
          </p>
        </div>

        <button
          onClick={onStartPlanning}
          className="btn-primary"
          style={{ padding: "14px 28px", flexShrink: 0 }}
        >
          + Plan new trip
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div className="my-trips-spinner" />
          <p style={{ color: "var(--text-secondary)", marginTop: 20, fontFamily: "var(--font-sans)" }}>
            Loading your trips...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && trips.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "80px 40px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 20,
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: 20 }}>🌍</div>
          <h3
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "1.5rem",
              fontWeight: 400,
              color: "var(--text-primary)",
              marginBottom: 12,
            }}
          >
            No trips yet
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Start planning your first AI-powered trip. Our agent will research, compare, and book everything for you.
          </p>
          <button onClick={onStartPlanning} className="btn-primary" style={{ padding: "14px 28px" }}>
            Plan my first trip →
          </button>
        </div>
      )}

      {/* Trip Cards */}
      {!loading && trips.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {trips.map((trip, idx) => {
            const sc = getStatusConfig(trip.status);
            const nights = daysBetween(trip.startDate, trip.endDate);
            const isActive = !["CANCELLED", "FAILED", "DELIVERED"].includes(trip.status);

            return (
              <div
                key={trip.id}
                onClick={() => onViewTrip(trip.id)}
                className="trip-card"
                style={{
                  padding: "24px 28px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  animation: `tripFadeIn 0.4s ease ${idx * 0.08}s both`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Active trip left accent */}
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background: sc.color,
                      borderRadius: "3px 0 0 3px",
                    }}
                  />
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  {/* Destination icon */}
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                      flexShrink: 0,
                    }}
                  >
                    {sc.icon}
                  </div>

                  {/* Trip info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                      <h3
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "1.05rem",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          margin: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {trip.origin ? `${trip.origin} → ` : ""}
                        {trip.destination}
                      </h3>

                      {/* Status badge */}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "3px 10px",
                          borderRadius: 8,
                          background: sc.bg,
                          color: sc.color,
                          fontSize: "0.7rem",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {sc.label}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <span className="trip-meta">
                        📅 {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                      </span>
                      <span className="trip-meta">🌙 {nights} night{nights > 1 ? "s" : ""}</span>
                      <span className="trip-meta">👤 {trip.travelers} traveler{trip.travelers > 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  {/* Budget info */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "1.15rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        margin: 0,
                      }}
                    >
                      ${trip.totalBudget.toLocaleString()}
                    </p>
                    {trip.totalSpent > 0 && (
                      <p
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.72rem",
                          color: "var(--accent)",
                          margin: "4px 0 0",
                        }}
                      >
                        ${trip.totalSpent.toLocaleString()} spent
                      </p>
                    )}
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.65rem",
                        color: "var(--text-faint)",
                        margin: "4px 0 0",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      USDC Budget
                    </p>
                  </div>

                  {/* Arrow */}
                  <div
                    className="trip-arrow"
                    style={{
                      color: "var(--text-faint)",
                      fontSize: "1.1rem",
                      transition: "all 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && trips.length > 0 && (
        <div
          style={{
            marginTop: 40,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {[
            { label: "Total Trips", value: trips.length.toString(), icon: "🌍" },
            {
              label: "Total Budget",
              value: `$${trips.reduce((s, t) => s + t.totalBudget, 0).toLocaleString()}`,
              icon: "💰",
            },
            {
              label: "Total Spent",
              value: `$${trips.reduce((s, t) => s + t.totalSpent, 0).toLocaleString()}`,
              icon: "💳",
            },
            {
              label: "Active Trips",
              value: trips.filter((t) => !["CANCELLED", "FAILED", "DELIVERED"].includes(t.status)).length.toString(),
              icon: "✈️",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: "20px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "1.3rem", marginBottom: 8 }}>{stat.icon}</div>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                {stat.value}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  color: "var(--text-faint)",
                  margin: "6px 0 0",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes tripFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .trip-card:hover {
          border-color: rgba(200, 245, 71, 0.25) !important;
          transform: translateY(-2px);
          background: var(--bg-card-hover) !important;
        }

        .trip-card:hover .trip-arrow {
          color: var(--accent) !important;
          transform: translateX(4px);
        }

        .trip-meta {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--text-faint);
          white-space: nowrap;
        }

        .my-trips-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(255, 255, 255, 0.06);
          border-top-color: var(--accent);
          border-radius: 50%;
          margin: 0 auto;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .trip-card > div {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
