"use client";

import { useEffect, useState } from "react";
import { AgentDemo } from "./AgentDemo";

interface HeroProps {
  onStartPlanning: () => void;
}

export function Hero({ onStartPlanning }: HeroProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <section className="section" style={{ paddingTop: 160, paddingBottom: 100 }}>
      <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
        {/* Left: Copy */}
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <p className="section-label" style={{ color: "var(--accent)" }}>
            AI-POWERED TRAVEL · ON-CHAIN PAYMENTS
          </p>

          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)",
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
            marginBottom: 24,
          }}>
            Travel with<br />intent.
          </h1>

          <p className="section-subtext" style={{ marginBottom: 32 }}>
            Chat with an AI agent that researches, books, and pays for your
            vacation. Every transaction is USDC on Base — traceable, verifiable,
            autonomous. No more 47 open tabs.
          </p>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onStartPlanning} className="btn-primary">
              Plan my trip
            </button>
            <a href="#how" className="btn-secondary">
              See how it works ↓
            </a>
          </div>
        </div>

        {/* Right: Agent Demo Widget (auto-playing full flow) */}
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(30px)",
          transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
          display: "flex",
          justifyContent: "flex-end",
        }}>
          <AgentDemo onStartPlanning={onStartPlanning} />
        </div>
      </div>
    </section>
  );
}
