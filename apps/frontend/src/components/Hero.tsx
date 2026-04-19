"use client";

import { useEffect, useState } from "react";
import { AgentDemo } from "./AgentDemo";
import { AnimatedSlideIn } from "./AnimatedSlideIn";

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
        <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.8s ease" }}>
          <AnimatedSlideIn delay={0}>
            <div style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "6px 14px",
            borderRadius: "999px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            marginBottom: 28,
          }}>
            <p className="section-label" style={{ color: "var(--text-secondary)", letterSpacing: "0.08em", fontSize: "0.75rem", margin: 0 }}>
              ✨ AI-POWERED TRAVEL · ON-CHAIN PAYMENTS
            </p>
            </div>
          </AnimatedSlideIn>

          <AnimatedSlideIn delay={150}>
            <h1 style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: "clamp(3.5rem, 7.5vw, 6.5rem)",
            fontWeight: 500,
            lineHeight: 1.02,
            letterSpacing: "-0.025em",
            marginBottom: 32,
            background: "linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0px 4px 24px rgba(255,255,255,0.1))"
          }}>
            Travel with<br />intent.
            </h1>
          </AnimatedSlideIn>

          <AnimatedSlideIn delay={300}>
            <p className="section-subtext" style={{ 
            marginBottom: 40,
            color: "var(--text-secondary)",
            fontSize: "1.125rem",
            lineHeight: 1.7,
            maxWidth: "90%"
          }}>
            Chat with an AI agent that researches, books, and pays for your
            vacation. Every transaction is USDC on Base — traceable, verifiable,
            autonomous. No more 47 open tabs.
            </p>
          </AnimatedSlideIn>

          <AnimatedSlideIn delay={450}>
            <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onStartPlanning} className="btn-primary">
              Plan my trip
            </button>
            <a href="#how" className="btn-secondary">
              See how it works ↓
            </a>
            </div>
          </AnimatedSlideIn>
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
