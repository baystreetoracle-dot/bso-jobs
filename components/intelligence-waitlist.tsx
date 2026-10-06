"use client";

import { useState, type FormEvent } from "react";
import { track } from "@vercel/analytics";
import { ArrowRight, Mail } from "lucide-react";
import { Comet } from "@/components/comet";
import { useWaitlistJoined } from "@/components/intelligence-hero";
import { ScrambleNumber } from "@/components/scramble-number";
import { COVERAGE } from "@/lib/intelligence/coverage";

export function IntelligenceWaitlist() {
  const onJoined = useWaitlistJoined();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/intelligence-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), website: data.get("website") }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Unable to join the waitlist right now. Please try again.");
      track("intelligence_waitlist_joined");
      onJoined?.();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to join the waitlist right now. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="intel-waitlist">
      <form className="intel-email comet-ring" onSubmit={submit}>
        <Mail size={17} aria-hidden="true"/>
        <input id="intel-email-input" name="email" type="email" placeholder="Enter email address" aria-label="Email address" autoComplete="email" required/>
        <input className="intel-honeypot" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
        <button type="submit" disabled={pending} aria-label="Get early access">
          {pending ? "Joining…" : <><span className="intel-email-label">Get early access</span><ArrowRight size={15}/></>}
        </button>
        <Comet/>
      </form>
      {error && <p className="intel-error" role="alert">{error}</p>}
      <p className="intel-stats"><ScrambleNumber value={COVERAGE.firms}/> firms · <ScrambleNumber value={COVERAGE.people}/> people · <ScrambleNumber value={COVERAGE.deals}/> deals</p>
    </div>
  );
}
