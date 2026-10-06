"use client";
import { useEffect, useRef } from "react";

/**
 * Silver comet that travels the parent's rounded outline (border-beam style).
 *
 * Painted on a canvas as one continuous line: the tail is sampled every fraction of a pixel and each
 * piece is drawn with "lighten" compositing, so overlaps keep the brighter value instead of stacking
 * alpha. The fade from white head to cool silver tail is therefore continuous on every screen density
 * (stacked translucent SVG dashes showed visible bands on high-DPI phones). The canvas is screen-blended,
 * so it reads as light on the dark surface.
 *
 * The comet glides along the straight edges and accelerates gently (about 1.8x) around the rounded
 * ends; it keeps one length and one thin width from head to tail over a soft blurred glow.
 * `tone="rainbow"` swaps silver for an iridescent spectrum (used on premium actions).
 * Place inside an element with the `comet-ring` class.
 */

const TAIL = 0.23; // comet length, as a share of the outline
const WIDTH = 1.15; // px
const GLOW_WIDTH = 3.5; // px, blurred in CSS
const PAD = 10; // px of canvas beyond the element, room for the glow
const CAP_BOOST = 0.8; // speed on the rounded ends = 1.8x the straight-edge speed
const STEPS = 1000; // timing resolution along the outline

/** Brightness along the comet, 1 at the head to 0 at the tail end (d in 0..1 of the tail). */
const profile = (d: number) => Math.pow(1 - d, 1.7);
const HEAD = [255, 255, 255];
const END = [176, 184, 198];

export type CometTone = "silver" | "rainbow";

/** HSL (h in degrees, s and l in 0..1) to RGB 0..255. */
function hsl(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return [f(0), f(8), f(4)];
}

/**
 * Colour at distance d (0 head .. 1 tail end) before brightness. Silver fades white to cool silver; rainbow
 * runs a full spectrum down the tail from a white-hot head, with the hues drifting slowly over time.
 */
function colorAt(tone: CometTone, d: number, time: number): [number, number, number] {
  if (tone === "silver") return [0, 1, 2].map((c) => HEAD[c] + (END[c] - HEAD[c]) * d) as [number, number, number];
  const [r, g, b] = hsl((time * 0.04 + d * 320) % 360, 0.95, 0.64);
  const white = Math.max(0, 1 - d / 0.1) * 0.85; // white-hot head melting into colour
  return [r + (255 - r) * white, g + (255 - g) * white, b + (255 - b) * white];
}

interface Geometry {
  w: number;
  h: number;
  perimeter: number;
  /** Point on the outline at distance s (px) from the top-left of the top edge, clockwise. */
  at: (s: number) => [number, number];
  /** Head distance (0..1 of the outline) at lap fraction f, with the slower straights. */
  headAt: (f: number) => number;
}

function geometry(w: number, h: number): Geometry {
  const inset = 0.5;
  const r = Math.max(h / 2 - inset, 0);
  const straight = Math.max(w - 2 * inset - 2 * r, 0);
  const arc = Math.PI * r;
  const perimeter = 2 * straight + 2 * arc;
  const cx1 = inset + r + straight; // right cap centre
  const cx0 = inset + r; // left cap centre
  const cy = h / 2;

  const at = (s: number): [number, number] => {
    s = ((s % perimeter) + perimeter) % perimeter;
    if (s < straight) return [cx0 + s, inset];
    s -= straight;
    if (s < arc) {
      const a = -Math.PI / 2 + s / r;
      return [cx1 + r * Math.cos(a), cy + r * Math.sin(a)];
    }
    s -= arc;
    if (s < straight) return [cx1 - s, h - inset];
    s -= straight;
    const a = Math.PI / 2 + s / r;
    return [cx0 + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  // Speed profile: 1 on the straights, up to 1 + CAP_BOOST on the ends, eased around each end.
  const A = straight / perimeter;
  const C = arc / perimeter;
  const ramp = Math.max(C * 0.35, 0.001);
  const caps: [number, number][] = [
    [A, A + C],
    [2 * A + C, 1],
  ];
  const capWeight = (u: number) => {
    let best = 0;
    for (const [a, b] of caps) {
      const d = u < a ? a - u : u > b ? u - b : 0;
      const dist = b === 1 && u < ramp ? Math.min(d, u) : d; // the left end runs into the path start
      if (dist <= 0) return 1;
      if (dist < ramp) best = Math.max(best, 0.5 + 0.5 * Math.cos((Math.PI * dist) / ramp));
    }
    return best;
  };
  const times = new Float64Array(STEPS + 1);
  for (let i = 1; i <= STEPS; i++) times[i] = times[i - 1] + 1 / (1 + CAP_BOOST * capWeight((i - 0.5) / STEPS));
  const total = times[STEPS];

  const headAt = (f: number) => {
    const t = f * total;
    let lo = 0;
    let hi = STEPS;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (times[mid] <= t) lo = mid;
      else hi = mid;
    }
    const span = times[hi] - times[lo] || 1;
    return (lo + (t - times[lo]) / span) / STEPS;
  };

  return { w, h, perimeter, at, headAt };
}

function paint(ctx: CanvasRenderingContext2D, g: Geometry, head: number, glow: boolean, tone: CometTone, time: number) {
  const { perimeter, at } = g;
  const rainbow = tone === "rainbow";
  // The rainbow runs longer, brighter and a touch thicker so the whole spectrum reads on small buttons.
  const length = (rainbow ? 0.34 : TAIL) * perimeter;
  const step = 0.75; // px between samples: well under the line width, so the fade is continuous
  const n = Math.ceil(length / step);
  ctx.globalCompositeOperation = "lighten";
  ctx.lineCap = "round";
  ctx.lineWidth = glow ? GLOW_WIDTH + (rainbow ? 1 : 0) : WIDTH + (rainbow ? 0.35 : 0);
  const s0 = head * perimeter;
  let prev = at(s0);
  for (let i = 1; i <= n; i++) {
    const d = (i - 0.5) / n;
    const k = (rainbow ? Math.pow(1 - d, 1.15) : profile(d)) * (glow ? (rainbow ? 0.65 : 0.42) : 1);
    const [r, gr, b] = colorAt(tone, d, time);
    const p = at(s0 - i * step);
    ctx.strokeStyle = `rgb(${Math.round(r * k)} ${Math.round(gr * k)} ${Math.round(b * k)})`;
    ctx.beginPath();
    ctx.moveTo(prev[0] + PAD, prev[1] + PAD);
    ctx.lineTo(p[0] + PAD, p[1] + PAD);
    ctx.stroke();
    prev = p;
  }
}

export function Comet({ lap = 7000, tone = "silver" }: { lap?: number; tone?: CometTone }) {
  const coreRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const core = coreRef.current;
    const glow = glowRef.current;
    const host = core?.parentElement;
    if (!core || !glow || !host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cctx = core.getContext("2d");
    const gctx = glow.getContext("2d");
    if (!cctx || !gctx) return;

    let g: Geometry | null = null;
    let dpr = 1;
    const measure = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 3);
      for (const c of [core, glow]) {
        c.width = Math.round((width + PAD * 2) * dpr);
        c.height = Math.round((height + PAD * 2) * dpr);
      }
      g = geometry(width, height);
    };
    // Measure right away (ResizeObserver is deferred in background tabs), then on resize.
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(host);

    const start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!g || !visible) return;
      const head = g.headAt(((now - start) % lap) / lap);
      for (const [ctx, isGlow] of [
        [gctx, true],
        [cctx, false],
      ] as const) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        paint(ctx, g, head, isGlow, tone, now - start);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [lap, tone]);

  return (
    <>
      <canvas ref={glowRef} aria-hidden className="comet comet-glow" />
      <canvas ref={coreRef} aria-hidden className="comet" />
    </>
  );
}
