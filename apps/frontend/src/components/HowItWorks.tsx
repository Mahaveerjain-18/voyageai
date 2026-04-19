"use client";

import { AnimatedHeading } from "./AnimatedHeading";
import { AnimatedSlideIn } from "./AnimatedSlideIn";

export function HowItWorks() {
  const steps = [
    {
      label: "Describe",
      title: "Tell the agent where you want to go.",
      text: "\"5 days in Tokyo, July, $2000 budget, love food and culture.\" Natural language. No forms.",
    },
    {
      label: "Research",
      title: "6 AI-powered APIs search in parallel.",
      text: "Brave Search finds flights and hotels. Firecrawl scrapes prices. OpenWeather checks forecasts. Mapbox calculates transit. Gemini synthesizes everything into ranked options.",
    },
    {
      label: "Approve",
      title: "Review options. Set spending limits.",
      text: "The agent presents its top picks with prices, ratings, and reasoning. You cap each category — flights, hotels, activities, food. The AI can never exceed your limits.",
    },
    {
      label: "Book & Pay",
      title: "USDC moves on Base in seconds.",
      text: "Virtual debit cards for traditional vendors. Direct USDC transfers for crypto-native ones. Every transaction logged with a hash you can verify on BaseScan.",
    },
  ];

  return (
    <section id="how" className="section">
      <div className="container">
        <AnimatedSlideIn delay={0}>
          <p className="section-label">HOW IT WORKS</p>
        </AnimatedSlideIn>
        <AnimatedSlideIn delay={100}>
          <AnimatedHeading
            segments={[
              { text: "Describe. Research. Approve. " },
              { text: "Book.", italic: true }
            ]}
          />
        </AnimatedSlideIn>
        <AnimatedSlideIn delay={200}>
          <p className="section-subtext" style={{ marginBottom: 48 }}>
            Four steps. The agent does the research. The blockchain does the proof.
          </p>
        </AnimatedSlideIn>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, marginTop: 16 }}>
          {steps.map((step, i) => (
            <AnimatedSlideIn key={i} delay={i * 150} as="div">
              <div className="step-card">
                <p className="step-label">{step.label}</p>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                  {step.text}
                </p>
              </div>
            </AnimatedSlideIn>
          ))}
        </div>
      </div>
    </section>
  );
}
