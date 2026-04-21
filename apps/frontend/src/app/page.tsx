"use client";

import { useState } from "react";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Problems } from "@/components/Problems";
import { HowItWorks } from "@/components/HowItWorks";
import { DestinationMarquee } from "@/components/DestinationMarquee";
import { Features } from "@/components/Features";
import { FAQ } from "@/components/FAQ";
import { CTAFooter } from "@/components/CTAFooter";
import { TripPlanner } from "@/components/TripPlanner";
import { Dashboard } from "@/components/Dashboard";
import { MyTrips } from "@/components/MyTrips";

type View = "landing" | "planner" | "dashboard" | "mytrips";

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [tripId, setTripId] = useState<string | null>(null);

  if (view === "mytrips") {
    return (
      <>
        <Nav
          onLogoClick={() => setView("landing")}
          onStartPlanning={() => setView("planner")}
          onMyTrips={() => setView("mytrips")}
        />
        <div className="fade-in" style={{ paddingTop: 80 }}>
          <MyTrips
            onBack={() => setView("landing")}
            onViewTrip={(id) => {
              setTripId(id);
              setView("dashboard");
            }}
            onStartPlanning={() => setView("planner")}
          />
        </div>
      </>
    );
  }

  if (view === "planner") {
    return (
      <>
        <Nav
          onLogoClick={() => setView("landing")}
          onStartPlanning={() => setView("planner")}
          onMyTrips={() => setView("mytrips")}
        />
        <div className="fade-in" style={{ paddingTop: 80 }}>
          <TripPlanner
            onTripCreated={(id) => {
              setTripId(id);
              setView("dashboard");
            }}
            onBack={() => setView("landing")}
          />
        </div>
      </>
    );
  }

  if (view === "dashboard" && tripId) {
    return (
      <>
        <Nav
          onLogoClick={() => setView("landing")}
          onStartPlanning={() => setView("planner")}
          onMyTrips={() => setView("mytrips")}
        />
        <div className="fade-in" style={{ paddingTop: 80 }}>
          <Dashboard tripId={tripId} onBack={() => setView("landing")} />
        </div>
      </>
    );
  }

  return (
    <>
      <Nav
        onLogoClick={() => setView("landing")}
        onStartPlanning={() => setView("planner")}
        onMyTrips={() => setView("mytrips")}
      />
      <main>
        <Hero onStartPlanning={() => setView("planner")} />
        <div className="section-divider" />
        <Problems />
        <div className="section-divider" />
        <HowItWorks />
        <div className="section-divider" />
        <DestinationMarquee />
        <div className="section-divider" />
        <Features />
        <div className="section-divider" />
        <FAQ />
        <div className="section-divider" />
        <CTAFooter onStart={() => setView("planner")} />
      </main>
    </>
  );
}
