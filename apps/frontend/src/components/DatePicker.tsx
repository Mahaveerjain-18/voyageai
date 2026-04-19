"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function DatePicker({ label, value, onChange, placeholder }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  // Handle positioning and clicking outside
  useEffect(() => {
    const updateCoords = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    };

    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // This won't work perfectly with Portal as the dropdown is outside.
        // We'll handle inside the portal logic too.
      }
    };

    if (isOpen) {
      updateCoords();
      window.addEventListener("resize", updateCoords);
      window.addEventListener("scroll", updateCoords, true);
      document.addEventListener("mousedown", handler);
    }

    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
      document.removeEventListener("mousedown", handler);
    };
  }, [isOpen]);

  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const todayStr = new Date().toISOString().split("T")[0];

  const prevMonth = useCallback(() => {
    setViewDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const nextMonth = useCallback(() => {
    setViewDate(new Date(year, month + 1, 1));
  }, [year, month]);

  const selectDate = (day: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateStr = `${year}-${mm}-${dd}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const displayValue = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const dayCells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) {
    dayCells.push(<div key={`empty-${i}`} className="dp-day dp-empty" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateStr = `${year}-${mm}-${dd}`;
    const isSelected = value === dateStr;
    const isToday = todayStr === dateStr;

    dayCells.push(
      <button
        key={`day-${day}`}
        type="button"
        onClick={() => selectDate(day)}
        className={`dp-day ${isSelected ? "dp-selected" : ""} ${isToday && !isSelected ? "dp-today" : ""}`}
      >
        {day}
      </button>
    );
  }

  // Dropdown Component to be Portaled
  const dropdown = (
    <div 
      className="dp-dropdown-portal"
      style={{
        position: "absolute",
        top: coords.top + 8,
        left: coords.left,
        zIndex: 999999,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="dp-inner">
        <div className="dp-header">
          <button type="button" className="dp-nav" onClick={prevMonth}>←</button>
          <span className="dp-month-year">{MONTHS[month]} {year}</span>
          <button type="button" className="dp-nav" onClick={nextMonth}>→</button>
        </div>
        <div className="dp-weekdays">
          {WEEKDAYS.map((d, i) => (
            <div key={`wd-${i}`} className="dp-weekday">{d}</div>
          ))}
        </div>
        <div className="dp-grid">{dayCells}</div>
        <button
          type="button"
          className="dp-today-btn"
          onClick={() => {
            const today = new Date();
            setViewDate(today);
            selectDate(today.getDate());
          }}
        >
          Today
        </button>
      </div>

      <style jsx>{`
        .dp-dropdown-portal {
          width: 320px;
          animation: dpSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .dp-inner {
          background: #0d0d0d;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.7);
        }
        @keyframes dpSlideIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .dp-month-year { font-weight: 600; font-size: 0.95rem; color: #fff; }
        .dp-nav { background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: #fff; cursor: pointer; padding: 4px 8px; }
        .dp-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 6px; }
        .dp-weekday { font-size: 0.65rem; color: rgba(255, 255, 255, 0.3); text-align: center; }
        .dp-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
        .dp-day { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 0.82rem; border: none; background: transparent; color: #fff; cursor: pointer; border-radius: 10px; }
        .dp-day:hover:not(.dp-empty) { background: rgba(255, 255, 255, 0.1); }
        .dp-day.dp-selected { background: #fff; color: #000; font-weight: 700; }
        .dp-day.dp-today { color: var(--accent); text-decoration: underline; }
        .dp-today-btn { width: 100%; margin-top: 12px; padding: 8px; background: rgba(255, 255, 255, 0.05); border: none; border-radius: 8px; color: #fff; cursor: pointer; font-size: 0.75rem; text-transform: uppercase; }
      `}</style>
    </div>
  );

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      <label className="dp-label">{label}</label>
      <button
        ref={triggerRef}
        type="button"
        className={`dp-trigger ${isOpen ? "dp-active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{displayValue || placeholder || "Select date..."}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        </svg>
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(dropdown, document.body)}

      <style jsx>{`
        .dp-label { display: block; font-family: var(--font-mono); font-size: 0.72rem; color: #fff; margin-bottom: 10px; text-transform: uppercase; opacity: 0.9; }
        .dp-trigger { width: 100%; padding: 15px 18px; background: #141414; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: space-between; text-align: left; }
        .dp-active { border-color: #fff; }
      `}</style>
    </div>
  );
}
