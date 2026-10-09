"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { track } from "@vercel/analytics";

/** Records one employer_page_viewed event, keeping any UTM parameters the visitor arrived with. */
export function EmployerPageView() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm = Object.fromEntries([...params].filter(([key]) => key.startsWith("utm_")));
    track("employer_page_viewed", utm);
  }, []);
  return null;
}

/** A link that records which package an employer chose before following it. */
export function PackageLink({ href, packageId, className, children }: { href: string; packageId: string; className?: string; children: ReactNode }) {
  return (
    <a className={className} href={href} onClick={() => track("employer_package_selected", { package: packageId })}>
      {children}
    </a>
  );
}

/** Counts up to the value once it scrolls into view; renders the final value on the server. */
export function CountUp({ value, suffix = "", duration = 1400 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      setShown(0);
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="emp-count">
      <span aria-hidden="true">{shown.toLocaleString("en-CA")}{suffix}</span>
      <span className="emp-sr">{value.toLocaleString("en-CA")}{suffix}</span>
    </span>
  );
}
