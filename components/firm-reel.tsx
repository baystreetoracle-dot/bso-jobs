"use client";

import { useEffect, useRef, useState } from "react";

/**
 * "Find your next role at …", with firm names dropping through a clipped slot like the face of a
 * wheel: fast at first, slowing as it loses momentum, then landing on the firm count in green.
 *
 * A CSS port of the reel on the BSO Intelligence sign-in page (components/profile/firm-reel.tsx there),
 * same timings, without its animation library. The slot is sized by every option stacked invisibly,
 * so the sentence never shifts.
 */
const LAPS = 2;
const FIRST_MS = 70;
const LAST_MS = 300;
const HOLD_MS = 1300;
const EXIT_MS = 600;

export function FirmReel({ firms, total, onDone }: { firms: readonly string[]; total: number; onDone: () => void }) {
  const closing = `all ${total} of them.`;
  const [sequence] = useState(() => Array.from({ length: LAPS }, () => firms).flat());
  // `step` is the name in the slot; -1 once it has resolved to the count. `outgoing` is the name leaving.
  const [step, setStep] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [interval, setIntervalMs] = useState(FIRST_MS);
  const timers = useRef<number[]>([]);
  const done = useRef(onDone);

  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const pending = timers.current;
    const later = (fn: () => void, ms: number) => pending.push(window.setTimeout(fn, ms));
    const show = (next: number, from: number | null) => {
      setOutgoing(from);
      setStep(next);
    };
    const finish = (from: number | null) => {
      show(-1, from);
      later(() => setLeaving(true), HOLD_MS);
      later(() => done.current(), HOLD_MS + EXIT_MS);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish(null);
      return () => pending.forEach(clearTimeout);
    }
    let n = 0;
    const tick = () => {
      n += 1;
      if (n >= sequence.length) return finish(n - 1);
      // Eased from fast to slow, like a wheel losing momentum.
      const t = n / sequence.length;
      const ms = FIRST_MS + (LAST_MS - FIRST_MS) * t * t * t;
      setIntervalMs(ms);
      show(n, n - 1);
      later(tick, ms);
    };
    later(tick, 350);
    return () => pending.forEach(clearTimeout);
  }, [sequence]);

  const skip = () => {
    timers.current.forEach(clearTimeout);
    setLeaving(true);
    timers.current.push(window.setTimeout(() => done.current(), EXIT_MS));
  };

  const resolved = step === -1;
  // Each change takes most of the gap before the next, so names never pile up mid-flight.
  const duration = resolved ? 550 : Math.max(90, interval * 0.85);

  return (
    <div className={`firm-reel${leaving ? " is-leaving" : ""}`} role="status" aria-label={`BSO Intelligence covers ${total} Canadian finance firms`}>
      <p className="firm-reel-line" aria-hidden="true">
        <span>Find your next role at&nbsp;</span>
        <span className="firm-reel-slot">
          {[...firms, closing].map((name) => <span key={name} className="firm-reel-sizer">{name}</span>)}
          <span className="firm-reel-window" style={{ ["--reel-ms" as string]: `${duration}ms` }}>
            {outgoing !== null && <span key={`out-${outgoing}`} className="firm-reel-name is-out">{sequence[outgoing]}</span>}
            <span key={`in-${step}`} className={`firm-reel-name is-in${resolved ? " is-resolved" : ""}`}>{resolved ? closing : sequence[step]}</span>
          </span>
        </span>
      </p>
      <button type="button" className="firm-reel-skip" onClick={skip}>Skip</button>
    </div>
  );
}
