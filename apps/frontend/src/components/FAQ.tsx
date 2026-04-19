"use client";

import { useState } from "react";

const faqs = [
  {
    q: "How does the AI agent handle my money?",
    a: "When you fund a trip, your USDC goes into a time-locked escrow subwallet on Base. The AI can only spend from this subwallet, and only within the budget limits you set for each category (flights, hotels, activities, food). If the trip is cancelled before the lock expires, funds auto-return to your main wallet.",
  },
  {
    q: "Is every transaction really on-chain?",
    a: "Yes. Every payment the AI makes — whether it's a USDC transfer or a virtual debit card purchase — generates a transaction hash on Base (Ethereum L2). You can verify any payment on BaseScan independently.",
  },
  {
    q: "What if the AI finds a bad deal?",
    a: "The AI explains its reasoning for every recommendation. You see the price comparison, ratings, and why it chose one option over another. Nothing is booked without your explicit approval. You're always in control.",
  },
  {
    q: "Can I set spending limits per category?",
    a: "Absolutely. Before the AI starts booking, you set max amounts for flights, hotels, activities, and food. The spending guard middleware blocks any transaction that would exceed these limits — even if the AI tries.",
  },
  {
    q: "What APIs does the agent use?",
    a: "Six Locus Wrapped APIs: Brave Search for web results, Firecrawl for price scraping, OpenWeather for forecasts, Mapbox for transit times, Gemini 2.5 for synthesis and ranking, and ScreenshotOne for visual confirmation proofs.",
  },
  {
    q: "How much does this cost me?",
    a: "API calls cost fractions of a cent each (typically $0.005–$0.03 per call). A full research pipeline for one trip costs roughly $0.15–$0.25 in total API fees, charged to your Locus account. No markup, no hidden fees.",
  },
];

import { AnimatedHeading } from "./AnimatedHeading";
import { AnimatedSlideIn } from "./AnimatedSlideIn";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="section">
      <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 80, alignItems: "start" }}>
        <div>
          <AnimatedSlideIn delay={0}>
            <p className="section-label">FREQUENTLY ASKED</p>
          </AnimatedSlideIn>
          <AnimatedSlideIn delay={100}>
            <AnimatedHeading
              segments={[
                { text: "Questions,\n" },
                { text: "answered plainly.", italic: true }
              ]}
            />
          </AnimatedSlideIn>
          <AnimatedSlideIn delay={200}>
            <p className="section-subtext">
              Still have something we didn&apos;t cover? The agent can probably
              handle it ,every trip prompt is open-ended.
            </p>
          </AnimatedSlideIn>
        </div>

        <div>
          {faqs.map((faq, i) => (
            <AnimatedSlideIn key={i} delay={i * 100} as="div">
              <div className="faq-item">
                <button className="faq-button" onClick={() => setOpen(open === i ? null : i)}>
                  <span>{faq.q}</span>
                  <span style={{ fontSize: "1.2rem", color: "var(--text-muted)", flexShrink: 0, marginLeft: 16 }}>
                    {open === i ? "−" : "+"}
                  </span>
                </button>
                {open === i && (
                  <div className="faq-answer slide-up">
                    {faq.a}
                  </div>
                )}
              </div>
            </AnimatedSlideIn>
          ))}
        </div>
      </div>
    </section>
  );
}
