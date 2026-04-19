"use client";

import React, { useEffect, useRef, useState } from "react";

export type AnimatedSegment = {
  text: string;
  italic?: boolean;
  breakBefore?: boolean;
};

interface AnimatedHeadingProps {
  segments: AnimatedSegment[];
  className?: string;
  style?: React.CSSProperties;
}

export function AnimatedHeading({ segments, className = "section-heading", style }: AnimatedHeadingProps) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  let charIndex = 0;

  return (
    <h2
      ref={ref}
      className={`${className} ${inView ? "is-visible" : ""}`}
      style={style}
    >
      {segments.map((seg, i) => (
        <span key={i} className={seg.italic ? "italic" : ""} style={{ whiteSpace: "pre-wrap" }}>
          {seg.breakBefore && <br />}
          {seg.text.split("").map((c, j) => (
            <span key={j} className="anim-char" style={{ animationDelay: `${(charIndex++) * 0.025}s` }}>
              {c === " " ? "\u00A0" : c}
            </span>
          ))}
        </span>
      ))}
    </h2>
  );
}
