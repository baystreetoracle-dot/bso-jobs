"use client";

import { useEffect, useState } from "react";

/**
 * Renders the final number on the server, then on mount scrambles every digit and locks them
 * in from left to right until the real value is showing. Skipped for reduced-motion users.
 */
export function ScrambleNumber({ value, duration = 1300, delay = 150 }: { value: number; duration?: number; delay?: number }) {
  const target = String(value);
  const [text, setText] = useState(target);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let last = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const progress = Math.max(0, (now - start) / duration);
      if (progress >= 1) {
        setText(target);
        return;
      }
      // Swap digits roughly every 45ms so the churn stays readable rather than a blur.
      if (now - last > 45) {
        last = now;
        const locked = Math.floor(progress * target.length);
        setText(Array.from(target, (digit, index) => index < locked ? digit : String(Math.floor(Math.random() * 10))).join(""));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, delay]);

  return (
    <span className="scramble-number">
      <span aria-hidden="true">{text}</span>
      <span className="scramble-number-label">{target}</span>
    </span>
  );
}
