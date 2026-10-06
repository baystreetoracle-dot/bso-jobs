"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { FirmReel } from "@/components/firm-reel";
import { COVERAGE, REEL_FIRMS } from "@/lib/intelligence/coverage";

const LEAVE_MS = 750;

const JoinedContext = createContext<(() => void) | null>(null);

/** Called by the waitlist form once a signup succeeds; null outside the /intelligence hero. */
export const useWaitlistJoined = () => useContext(JoinedContext);

/**
 * The /intelligence hero and what happens after someone joins: the page lifts away, the firm reel
 * plays ("Find your next role at …"), then a quiet confirmation settles in its place.
 */
export function IntelligenceHero({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"form" | "leaving" | "reel" | "done">("form");

  const joined = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setPhase("done");
    setPhase("leaving");
    window.setTimeout(() => setPhase("reel"), LEAVE_MS);
  }, []);
  const finished = useCallback(() => setPhase("done"), []);

  return (
    <main className={`intel-hero is-${phase}`}>
      <div className="intel-hero-glow" aria-hidden="true"/>
      {(phase === "form" || phase === "leaving") && (
        <div className="intel-hero-content">
          <JoinedContext.Provider value={joined}>{children}</JoinedContext.Provider>
        </div>
      )}
      {phase === "reel" && <FirmReel firms={REEL_FIRMS} total={COVERAGE.firms} onDone={finished}/>}
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
