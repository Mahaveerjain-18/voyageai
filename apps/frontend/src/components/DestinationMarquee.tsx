"use client";

/* ──────────────────────────────────────────────────────────────
   DestinationMarquee — Premium infinite‑scroll gallery
   Two rows scrolling in opposite directions with glassmorphic
   destination labels, gradient edge fades, and hover‑pause.
   Uses high-res Unsplash photos (free).
   ────────────────────────────────────────────────────────────── */

const ROW_A = [
  { name: "Bali, Indonesia",    img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80", tag: "🌴 Tropical" },
  { name: "Santorini, Greece",  img: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80", tag: "🏛️ Islands" },
  { name: "Tokyo, Japan",       img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80", tag: "🏙️ Culture" },
  { name: "Maldives",           img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80", tag: "🐚 Beach" },
  { name: "Paris, France",      img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80", tag: "🗼 Romance" },
  { name: "Swiss Alps",         img: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80", tag: "⛷️ Mountains" },
  { name: "Kyoto, Japan", img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80", tag: "🌸 Culture" },
  { name: "Dubai, UAE",         img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80", tag: "✨ Luxury" },
];

const ROW_B = [
  { name: "New York, USA",       img: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80", tag: "🌃 Urban" },
  { name: "Amalfi Coast, Italy", img: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=800&q=80", tag: "🍋 Coastal" },
  { name: "Kyoto, Japan",        img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80", tag: "🎎 Historic" },
  { name: "Iceland",             img: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=800&q=80", tag: "🌋 Nature" },
  { name: "Cape Town, SA",       img: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80", tag: "🦁 Safari" },
  { name: "Barcelona, Spain",    img: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80", tag: "🎨 Art" },
  { name: "Patagonia, Argentina",img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80", tag: "🏕️ Wild" },
  { name: "Sydney, Australia",   img: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80", tag: "🌊 Harbour" },
];

function MarqueeRow({ items, reverse = false }: { items: typeof ROW_A; reverse?: boolean }) {
  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className={`marquee-track ${reverse ? "marquee-reverse" : ""}`}>
      <div className="marquee-inner">
        {doubled.map((d, i) => (
          <div key={i} className="marquee-card">
            <img src={d.img} alt={d.name} className="marquee-img" loading="lazy" />
            {/* Gradient overlay */}
            <div className="marquee-overlay" />
            {/* Info */}
            <div className="marquee-info">
              <span className="marquee-tag">{d.tag}</span>
              <span className="marquee-name">{d.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { AnimatedHeading } from "./AnimatedHeading";
import { AnimatedSlideIn } from "./AnimatedSlideIn";

export function DestinationMarquee() {
  return (
    <section className="marquee-section">
      {/* Section heading */}
      <div className="container" style={{ marginBottom: 48 }}>
        <AnimatedSlideIn delay={0}>
          <p className="section-label" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
            DESTINATIONS
          </p>
        </AnimatedSlideIn>
        <AnimatedSlideIn delay={100}>
          <AnimatedHeading
            style={{ textAlign: "center", maxWidth: 600, margin: "0 auto" }}
            segments={[
              { text: "Where will your agent " },
              { text: "take you?", italic: true }
            ]}
          />
        </AnimatedSlideIn>
        <AnimatedSlideIn delay={200}>
          <p
            className="section-subtext"
            style={{ textAlign: "center", maxWidth: 500, margin: "12px auto 0", color: "var(--text-secondary)" }}
          >
            From hidden temples in Kyoto to overwater villas in the Maldives —
            just describe it. The AI handles the rest.
          </p>
        </AnimatedSlideIn>
      </div>

      {/* Marquee rows */}
      <div className="marquee-container">
        {/* Gradient fade — left */}
        <div className="marquee-fade marquee-fade-left" />
        {/* Gradient fade — right */}
        <div className="marquee-fade marquee-fade-right" />

        <AnimatedSlideIn delay={250}>
          <MarqueeRow items={ROW_A} />
        </AnimatedSlideIn>
        <AnimatedSlideIn delay={400}>
          <MarqueeRow items={ROW_B} reverse />
        </AnimatedSlideIn>
      </div>

      <style jsx global>{`
        /* ─── Section ────────────────────────────────── */
        .marquee-section {
          padding: 100px 0 80px;
          overflow: hidden;
          position: relative;
        }

        /* ─── Container with edge fades ──────────────── */
        .marquee-container {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .marquee-fade {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 160px;
          z-index: 2;
          pointer-events: none;
        }
        .marquee-fade-left {
          left: 0;
          background: linear-gradient(90deg, var(--bg-primary) 0%, transparent 100%);
        }
        .marquee-fade-right {
          right: 0;
          background: linear-gradient(270deg, var(--bg-primary) 0%, transparent 100%);
        }

        /* ─── Track ──────────────────────────────────── */
        .marquee-track {
          overflow: hidden;
          width: 100%;
        }

        .marquee-inner {
          display: flex;
          gap: 20px;
          width: max-content;
          animation: marqueeScroll 45s linear infinite;
        }
        .marquee-reverse .marquee-inner {
          animation: marqueeScrollReverse 50s linear infinite;
        }

        .marquee-track:hover .marquee-inner {
          animation-play-state: paused;
        }

        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marqueeScrollReverse {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        /* ─── Card ───────────────────────────────────── */
        .marquee-card {
          position: relative;
          width: 340px;
          height: 220px;
          border-radius: 16px;
          overflow: hidden;
          flex-shrink: 0;
          cursor: pointer;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .marquee-card:hover {
          transform: scale(1.04) translateY(-6px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4),
                      0 0 30px rgba(255, 255, 255, 0.08);
        }

        /* ─── Image ──────────────────────────────────── */
        .marquee-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .marquee-card:hover .marquee-img {
          transform: scale(1.1);
        }

        /* ─── Gradient overlay ────────────────────────── */
        .marquee-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            transparent 30%,
            rgba(0, 0, 0, 0.55) 75%,
            rgba(0, 0, 0, 0.85) 100%
          );
          transition: opacity 0.4s;
        }
        .marquee-card:hover .marquee-overlay {
          opacity: 0.9;
        }

        /* ─── Info overlay (glassmorphic) ─────────────── */
        .marquee-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transform: translateY(4px);
          opacity: 0.9;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .marquee-card:hover .marquee-info {
          transform: translateY(0);
          opacity: 1;
        }

        .marquee-tag {
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent);
        }
        .marquee-name {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 1.15rem;
          font-weight: 400;
          color: #fff;
          line-height: 1.2;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }

        /* ─── Animated Heading ───────────────────────── */
        .anim-char {
          display: inline-block;
          opacity: 0;
          transform: translateX(-15px) rotateY(15deg);
        }
        .is-visible .anim-char {
          animation: revealChar 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes revealChar {
          0% {
            opacity: 0;
            transform: translateX(-15px) rotateY(15deg);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateX(0) rotateY(0deg);
            filter: blur(0);
          }
        }

        /* ─── Responsive ──────────────────────────────── */
        @media (max-width: 768px) {
          .marquee-card {
            width: 260px;
            height: 170px;
          }
          .marquee-fade {
            width: 60px;
          }
          .marquee-name {
            font-size: 1rem;
          }
        }
      `}</style>
    </section>
  );
}
