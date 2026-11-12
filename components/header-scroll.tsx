"use client";
import { useEffect } from "react";

/**
 * Ported from BSO Intelligence (components/layout/header-scroll.tsx). Hides the header on the way down and brings it back on the way up.
 *
 * A sticky bar across a long page is a strip of the screen permanently spent on
 * navigation nobody is using while they read. Going back up is the gesture that means
 * "I want to get somewhere", so that is when it returns.
 *
 * It sets an attribute on <html> and lets CSS do the moving: no inline styles, no
 * measuring, and the header stays a server component. Passive listener, and it does
 * nothing at all for a reader who has asked for reduced motion - for them the bar
 * simply stays put, which is the honest reading of that preference.
 */
export function HeaderScroll({ threshold = 120 }: { threshold?: number }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    let last = window.scrollY;
    let frame = 0;

    const read = () => {
      frame = 0;
      const y = window.scrollY;
      // A few pixels of jitter, a trackpad settling, or the rubber band at the top
      // should not move the bar.
      if (Math.abs(y - last) < 8) return;
      root.dataset.nav = y > last && y > threshold ? "hidden" : "shown";
      last = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      delete root.dataset.nav;
    };
  }, [threshold]);

  return null;
}
