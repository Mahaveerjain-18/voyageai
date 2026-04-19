"use client";

import React, { useState, useRef, useEffect } from "react";

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export function DatePicker({ label, value, onChange, placeholder, style }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value or use today
  const [viewDate, setViewDate] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  });

  // Handle clicking outside to close
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const selectDate = (day: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    // Format as YYYY-MM-DD
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const totalDays = daysInMonth(month, year);
    const startDay = firstDayOfMonth(month, year);
    const monthName = viewDate.toLocaleString("default", { month: "long" });

    const days = [];
    // Padding for start of month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`pad-${i}`} className="cal-day pad" />);
    }
    // Actual days
    for (let day = 1; day <= totalDays; day++) {
      const isSelected = value === `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <button
          key={day}
          type="button"
          className={`cal-day ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
          onClick={() => selectDate(day)}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="cal-content fade-in">
        <div className="cal-header">
          <button type="button" onClick={handlePrevMonth} className="cal-nav">←</button>
          <span className="cal-month">{monthName} {year}</span>
          <button type="button" onClick={handleNextMonth} className="cal-nav">→</button>
        </div>
        <div className="cal-grid-header">
          {["S", "M", "T", "W", "T", "F", "S"].map(d => <div key={d} className="cal-weekday">{d}</div>)}
        </div>
        <div className="cal-grid">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <label className="input-label-premium">{label}</label>
      <div 
        className={`premium-input-wrap ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        style={style}
      >
        <span className={!value ? "placeholder" : ""}>
          {value || placeholder || "Select date..."}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>

      {isOpen && (
        <div className="premium-calendar-popup">
          {renderCalendar()}
        </div>
      )}

      <style jsx>{`
        .input-label-premium {
          display: block;
          font-family: var(--font-mono);
          font-size: 0.72rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: color 0.3s ease;
        }

        .premium-input-wrap {
          width: 100%;
          padding: 15px 18px;
          background: #141414;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #f5f5f5;
          font-family: var(--font-sans);
          font-size: 0.95rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .premium-input-wrap:hover {
          background: #1a1a1a;
          border-color: rgba(255, 255, 255, 0.3);
        }

        .premium-input-wrap.active {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
        }

        .placeholder {
          color: rgba(255, 255, 255, 0.2);
        }

        .premium-calendar-popup {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          z-index: 1000;
          width: 300px;
          background: rgba(18, 18, 18, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .cal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .cal-month {
          font-weight: 600;
          font-size: 0.95rem;
          letter-spacing: -0.01em;
        }

        .cal-nav {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .cal-nav:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }

        .cal-grid-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 8px;
        }

        .cal-weekday {
          font-size: 0.7rem;
          font-weight: 700;
          color: rgba(255,255,255,0.3);
          text-align: center;
        }

        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }

        .cal-day {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          border: none;
          background: none;
          color: var(--text-secondary);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cal-day:hover:not(.pad) {
          background: rgba(255,255,255,0.06);
          color: white;
        }

        .cal-day.selected {
          background: white !important;
          color: black !important;
          font-weight: 700;
        }

        .cal-day.today {
          color: var(--accent);
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .cal-day.pad {
          cursor: default;
        }
      `}</style>
    </div>
  );
}
