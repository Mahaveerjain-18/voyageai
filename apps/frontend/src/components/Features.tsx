"use client";

import { useState, useEffect } from "react";
import { AnimatedHeading } from "./AnimatedHeading";
import { AnimatedSlideIn } from "./AnimatedSlideIn";

const FEATURES = [
  { icon: "🔒", label: "Escrow Subwallets", desc: "Funds locked until trip ends" },
  { icon: "🤖", label: "6 Research APIs", desc: "Brave, Firecrawl, Weather, Maps, Gemini, Screenshots" },
  { icon: "💳", label: "Virtual Debit Cards", desc: "One-time cards via Laso Finance" },
  { icon: "📊", label: "Live Audit Trail", desc: "Every AI decision logged in real-time" },
  { icon: "👥", label: "Group Funding", desc: "Shareable checkout links for friends" },
  { icon: "⚡", label: "Spending Controls", desc: "Per-category budget enforcement" },
  { icon: "📧", label: "Email Confirmations", desc: "Booking proofs sent via pay/send-email" },
  { icon: "🌤️", label: "Weather Guard", desc: "Auto-cancel if storms are detected" },
  { icon: "💰", label: "Price Watch", desc: "Rebooks when prices drop" },
];

const FLOW_STEPS = [
  "Checkout", "Subwallet", "Wrapped APIs", 
  "Laso Card", "pay/send", "Email Escrow", "Audit"
];

export function Features() {
  const [activeIndex, setActiveIndex] = useState(0);

  // 60FPS Smooth Auto-advance Flow Pulse
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let start = performance.now();
    const duration = 7000; // 7 seconds full cycle
    let raf: number;

    const loop = (time: number) => {
      const p = ((time - start) % duration) / duration;
      setProgress(p);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const activeFlowStep = Math.min(Math.floor(progress * FLOW_STEPS.length), FLOW_STEPS.length - 1);
  const pulseLeft = progress * (FLOW_STEPS.length / (FLOW_STEPS.length - 1)) * 100;

  // Auto-advance
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % FEATURES.length);
    }, 2500); // slightly faster to show the loop
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="features" className="section overflow-hidden">
      <div className="container" style={{ textAlign: "center", marginBottom: 60 }}>
        <AnimatedSlideIn delay={0}>
          <p className="section-label">CAPABILITIES</p>
        </AnimatedSlideIn>
        <AnimatedSlideIn delay={100}>
          <AnimatedHeading
            segments={[
              { text: "What " },
              { text: "powers", italic: true },
              { text: " the agent?" }
            ]}
          />
        </AnimatedSlideIn>
        <AnimatedSlideIn delay={200}>
          <p className="section-subtext" style={{ margin: "0 auto" }}>
            Locus capabilities chained into one autonomous flow.
          </p>
        </AnimatedSlideIn>
      </div>

      {/* Infinite Focus-Snap Carousel */}
      <div className="spotlight-container">
        <div className="spotlight-wrapper">
          {FEATURES.map((f, i) => {
            // Calculate absolute visual offset (-4 to 4)
            const N = FEATURES.length;
            let offset = i - activeIndex;
            if (offset > Math.floor(N / 2)) offset -= N;
            if (offset < -Math.floor(N / 2)) offset += N;

            const absOffset = Math.abs(offset);
            
            // Determine styles based on offset position
            let translateX = offset * 250; // space between cards
            let scale = 1;
            let opacity = 1;
            let zIndex = 10;
            let filter = "grayscale(0%)";

            if (absOffset === 0) {
              scale = 1.1;
              opacity = 1;
              zIndex = 10;
            } else if (absOffset === 1) {
              scale = 0.85;
              opacity = 0.6;
              zIndex = 5;
              filter = "grayscale(80%)";
            } else if (absOffset === 2) {
              scale = 0.7;
              opacity = 0.2;
              zIndex = 2;
              filter = "grayscale(100%)";
            } else {
              // Hide the ones wrapping around the back
              scale = 0.5;
              opacity = 0;
              zIndex = 0;
              filter = "grayscale(100%)";
            }

            return (
              <div
                key={i}
                className="spotlight-card"
                onClick={() => setActiveIndex(i)}
                style={{
                  transform: `translateX(${translateX}px) scale(${scale})`,
                  opacity,
                  zIndex,
                  filter,
                  pointerEvents: absOffset <= 2 ? "auto" : "none",
                }}
              >
                <div className="spotlight-icon">{f.icon}</div>
                <h3 className="spotlight-title">{f.label}</h3>
                <p className="spotlight-desc">{f.desc}</p>
                
                {/* Glowing border only on active */}
                <div className="spotlight-glow" style={{ opacity: absOffset === 0 ? 1 : 0 }} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="container">
        {/* Glowing Circuit Timeline */}
        <div className="circuit-container">
          <p className="circuit-header">7 LOCUS CAPABILITIES IN ONE AUTONOMOUS FLOW</p>
          
          <div className="circuit-visual">
            <div className="circuit-line-container">
              <div className="circuit-track" />
              <div 
                className="circuit-pulse" 
                style={{ 
                  left: `${pulseLeft}%`,
                  opacity: progress < 0.05 ? progress * 20 : progress > 0.95 ? (1 - progress) * 20 : 1,
                }}
              />
            </div>

            <div className="circuit-nodes">
              {FLOW_STEPS.map((step, i) => {
                const isActive = activeFlowStep === i;
                const isPast = i <= activeFlowStep;
                
                return (
                  <div key={i} className="circuit-node">
                    <div className={`circuit-dot ${isActive ? 'active' : isPast ? 'past' : ''}`}>
                      {isActive && <div className="circuit-dot-glow" />}
                      {isPast && (
                        <svg className="circuit-tick" viewBox="0 0 24 24" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    <div className={`circuit-label ${isActive ? 'active' : ''}`}>{step}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .spotlight-container {
          width: 100vw;
          margin-left: calc(-50vw + 50%);
          overflow: hidden; /* Hide anything outside viewport window */
          /* Sleek black fades on absolute edges */
          mask-image: linear-gradient(to right, transparent, black 25%, black 75%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 25%, black 75%, transparent);
        }

        .spotlight-wrapper {
          position: relative;
          height: 300px; 
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .spotlight-card {
          position: absolute;
          width: 320px;
          height: 200px;
          border-radius: 20px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          justify-content: center;
          cursor: pointer;
          
          /* Smoothly animate position, scale, opacity of every card */
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
                      filter 0.8s cubic-bezier(0.16, 1, 0.3, 1),
                      background 0.3s ease;
        }
        
        .spotlight-card:hover {
          background: var(--bg-card-hover);
        }

        .spotlight-icon {
          font-size: 2.5rem;
          margin-bottom: 12px;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .spotlight-title {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
          transition: color 0.5s ease;
        }

        .spotlight-desc {
          font-family: var(--font-sans);
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .spotlight-glow {
          position: absolute;
          inset: 0;
          border-radius: 20px;
          box-shadow: 0 0 40px rgba(255, 255, 255, 0.15),
                      inset 0 0 0 1px var(--accent);
          pointer-events: none;
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ─── Glowing Circuit ─── */
        .circuit-container {
          margin-top: 40px;
          padding: 20px 48px 16px 48px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          max-width: 1300px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 0 80px rgba(0,0,0,0.3);
        }

        .circuit-header {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-muted);
          text-align: center;
          margin-bottom: 20px;
        }

        .circuit-visual {
          position: relative;
          width: 100%;
        }

        .circuit-line-container {
          position: absolute;
          top: 7px;
          left: 40px;
          right: 40px;
          z-index: 1;
        }

        .circuit-track {
          width: 100%;
          height: 2px;
          background: rgba(255, 255, 255, 0.08);
        }

        .circuit-pulse {
          position: absolute;
          top: 0;
          width: 100px;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4) 60%, var(--accent) 100%);
          transform: translateX(-100%); /* Right edge aligns strictly to 'left' % */
          z-index: 2;
        }

        .circuit-pulse::after {
          content: '';
          position: absolute;
          right: 0;
          top: -1px;
          width: 8px;
          height: 4px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 15px 4px var(--accent), 0 0 30px 8px var(--accent);
        }.circuit-nodes {
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 3;
        }

        .circuit-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: 90px;
        }

        .circuit-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--bg-primary);
          border: 2px solid var(--border);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        .circuit-dot.active {
          background: var(--accent);
          border-color: var(--accent);
          transform: scale(1.4);
        }

        .circuit-dot-glow {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: var(--accent);
          filter: blur(8px);
          opacity: 0.8;
          z-index: -1;
        }

        .circuit-dot.past {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .circuit-label {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.05em;
          color: var(--text-faint);
          text-transform: uppercase;
          text-align: center;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          line-height: 1.4;
        }

        .circuit-label.active {
          color: #fff;
          font-weight: 700;
          transform: translateY(2px) scale(1.1);
          text-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
        }

        .circuit-tick {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          stroke: #ffffff; /* Pure white core for maximum contrast */
          filter: drop-shadow(0 0 10px var(--accent)) drop-shadow(0 0 6px var(--accent)) drop-shadow(0 0 3px var(--accent));
          animation: popTick 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .circuit-dot.active .circuit-tick {
          stroke: #0a0a0a;
          filter: none;
        }

        @keyframes popTick {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }

        @media (max-width: 768px) {
          .circuit-label {
            font-size: 0.55rem;
          }
          .circuit-line-container {
            left: 20px;
            right: 20px;
          }
          .circuit-node {
            width: 40px;
          }
          .circuit-header {
            margin-bottom: 32px;
          }
        }
      `}</style>
    </section>
  );
}
