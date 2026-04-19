"use client";

export function Problems() {
  const problems = [
    {
      num: "01",
      title: "No more 47 open tabs.",
      text: "Every search is a rabbit hole. Flights on one site, hotels on another, reviews somewhere else. You spend 10 hours researching a 5-day trip.",
      img: "/images/problem-tabs-new.png",
    },
    {
      num: "02",
      title: "No more second-guessing prices.",
      text: "Is this the best deal? Should you wait? The AI searches 6 data sources in parallel, compares across vendors, and explains its reasoning.",
      img: "/images/problem-prices-new.png",
    },
    {
      num: "03",
      title: "No more opaque transactions.",
      text: "Every payment is USDC on Base. Every booking has a transaction hash. One dashboard shows every dollar your AI agent spent — and why.",
      img: "/images/problem-audit-new.png",
    },
  ];

  return (
    <section id="problems" className="section">
      <div className="container">
        <p className="section-label">THE PROBLEM</p>
        <h2 className="section-heading" style={{ maxWidth: 700 }}>
          Vacation booking is broken <br />
          <span className="italic">in three familiar ways.</span>
        </h2>

        <div className="problem-grid">
          {problems.map((item) => (
            <div key={item.num} className="problem-card">
              <div className="problem-image-container">
                <img src={item.img} alt={item.title} className="problem-image" />
                <div className="problem-number-overlay">{item.num}</div>
              </div>
              <div className="problem-content">
                <h3 className="problem-title">{item.title}</h3>
                <p className="problem-text">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .problem-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-top: 64px;
        }

        .problem-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          // border-radius: 20px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .problem-card:hover {
          border-color: rgba(200, 245, 71, 0.4);
          transform: translateY(-8px);
          background: var(--bg-card-hover);
        }

        .problem-image-container {
          position: relative;
          width: 100%;
          height: 220px;
          overflow: hidden;
          border-bottom: 1px solid var(--border);
        }

        .problem-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .problem-card:hover .problem-image {
          transform: scale(1.05);
        }

        .problem-content {
          padding: 32px;
          flex-grow: 1;
        }

        .problem-title {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 1.5rem;
          font-weight: 400;
          margin-bottom: 12px;
          color: var(--text-primary);
          line-height: 1.2;
          letter-spacing: -0.01em;
        }

        .problem-text {
          font-family: var(--font-sans);
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
          opacity: 0.8;
          font-weight: 400;
        }

        @media (max-width: 1024px) {
          .problem-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .problem-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
