"use client";

interface NavProps {
  onLogoClick: () => void;
  onStartPlanning?: () => void;
  onMyTrips?: () => void;
}

export function Nav({ onLogoClick, onStartPlanning, onMyTrips }: NavProps) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <button onClick={onLogoClick} className="nav-logo" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <span className="serif-italic" style={{ fontSize: "1.15rem" }}>Voyage</span>
          <span style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>AI</span>
        </button>

        <div className="nav-actions">
          {onMyTrips && (
            <button
              onClick={onMyTrips}
              className="btn-ghost"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
               Trip History
            </button>
          )}
          <a
            href="#how"
            className="btn-ghost"
            onClick={() => {
              onLogoClick();
              setTimeout(() => document.getElementById("how")?.scrollIntoView({ behavior: 'smooth' }), 100);
            }}
          >
            How it works
          </a>
          <a
            href="#features"
            className="btn-ghost"
            onClick={() => {
              onLogoClick();
              setTimeout(() => document.getElementById("features")?.scrollIntoView({ behavior: 'smooth' }), 100);
            }}
          >
            Features
          </a>
          <a
            href="#faq"
            className="btn-ghost"
            onClick={() => {
              onLogoClick();
              setTimeout(() => document.getElementById("faq")?.scrollIntoView({ behavior: 'smooth' }), 100);
            }}
          >
            FAQ
          </a>
          <button
            onClick={onStartPlanning || onLogoClick}
            className="btn-primary"
            style={{ padding: "10px 20px", fontSize: "0.85rem" }}
          >
            Start planning
          </button>
        </div>
      </div>
    </nav>
  );
}
