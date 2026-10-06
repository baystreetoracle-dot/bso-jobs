"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

const LEAVE_MS = 750;

const JoinedContext = createContext<(() => void) | null>(null);

/** Called by the waitlist form once a signup succeeds; null outside the /intelligence hero. */
export const useWaitlistJoined = () => useContext(JoinedContext);

/**
 * The /intelligence hero and what happens after someone joins: the page lifts away and a quiet
 * confirmation settles in its place.
 */
export function IntelligenceHero({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"form" | "leaving" | "done">("form");

  const joined = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setPhase("done");
    setPhase("leaving");
    window.setTimeout(() => setPhase("done"), LEAVE_MS);
  }, []);

  return (
    <main className={`intel-hero is-${phase}`}>
      <div className="intel-hero-glow" aria-hidden="true"/>
      {(phase === "form" || phase === "leaving") && (
        <div className="intel-hero-content">
          <JoinedContext.Provider value={joined}>{children}</JoinedContext.Provider>
        </div>
      )}
      {phase === "done" && (
        <div className="intel-done" role="status">
          <span className="intel-done-icon"><Check size={20}/></span>
          <h2>You&apos;re on the list.</h2>
          <p>We&apos;ll email you as soon as BSO Intelligence opens.</p>
          <Link className="intel-done-link" href="/jobs">Browse open roles on BSO Jobs <ArrowRight size={15}/></Link>
        </div>
      )}
    </main>
  );
}
