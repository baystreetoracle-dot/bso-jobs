"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { ArrowRight, ArrowUpRight, FileText, Lock, X } from "lucide-react";
import previews from "@/lib/intelligence/firm-previews.json";
import { companyPath } from "@/lib/jobs/urls";

type FirmPreview = (typeof previews)[number];

/**
 * The /intelligence logo strip. Each logo opens a gated preview of that firm's Intelligence profile:
 * a few public facts from the research snapshot (lib/intelligence/firm-previews.json), with every
 * other section blurred. The blurred layers are generic stand-ins, never the firm's real data.
 */
export function IntelligenceLogoStrip({ hiring }: { hiring: string[] }) {
  const [firm, setFirm] = useState<FirmPreview | null>(null);

  return (
    <>
      <ul className="intel-logos" aria-label="Preview firm profiles">
        {previews.map((preview) => (
          <li key={preview.slug}>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-label={`Preview ${preview.name} on BSO Intelligence`}
              onClick={() => {
                track("intelligence_preview_opened", { firm: preview.slug });
                setFirm(preview);
              }}
            >
              <img src={preview.logo} alt="" loading="lazy"/>
            </button>
          </li>
        ))}
      </ul>
      {firm && <FirmPreviewDialog firm={firm} hiring={hiring.includes(firm.name)} onClose={() => setFirm(null)}/>}
    </>
  );
}

function FirmPreviewDialog({ firm, hiring, onClose }: { firm: FirmPreview; hiring: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function close(afterClose?: () => void) {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => {
      dialogRef.current?.close();
      onClose();
      afterClose?.();
    }, 180);
  }

  function getAccess(placement: string) {
    track("intelligence_preview_cta", { firm: firm.slug, placement });
    close(() => {
      const input = document.getElementById("intel-email-input") as HTMLInputElement | null;
      input?.focus();
    });
  }

  const { counts } = firm;
  const extraLeaders = Math.max(0, counts.people - firm.leaders.length);
  const stats = [
    { label: "People tracked", value: counts.people },
    { label: "Disclosed deals", value: counts.deals },
    { label: "People moves", value: counts.moves },
    { label: "Sources", value: counts.sources },
  ].filter((stat) => stat.value > 0);

  return (
    <dialog
      ref={dialogRef}
      className={`fp-dialog${closing ? " is-closing" : ""}`}
      aria-labelledby="fp-title"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}
    >
      <div className="fp-panel">
        <div className="fp-scroll">
          <div className="fp-glow" aria-hidden="true"/>
          <button type="button" className="fp-close" onClick={() => close()} aria-label="Close preview"><X size={18}/></button>

          <header className="fp-hero fp-reveal" style={{ ["--i" as string]: 0 }}>
            <span className="fp-logo"><img src={firm.logo} alt={`${firm.name} logo`}/></span>
            <div className="fp-hero-copy">
              <p className="fp-eyebrow">BSO Intelligence <span className="fp-beta">Preview</span></p>
              <h2 id="fp-title">{firm.name}</h2>
              <p className="fp-meta">{[firm.type, firm.headquarters, firm.founded && `Founded ${firm.founded}`].filter(Boolean).join(" · ")}</p>
            </div>
          </header>
          {firm.tagline && <p className="fp-tagline fp-reveal" style={{ ["--i" as string]: 1 }}>{firm.tagline}</p>}
          {stats.length > 0 && (
            <dl className="fp-stats fp-reveal" style={{ ["--i" as string]: 2 }}>
              {stats.map((stat) => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}
            </dl>
          )}

          <Section index={3} title="For you" kicker={`How you match ${firm.name}`}>
            <div className="fp-resume">
              <span className="fp-resume-icon"><FileText size={18}/></span>
              <div>
                <p className="fp-resume-title">Add your resume</p>
                <p className="fp-resume-text">See why you&apos;d stand out at {firm.name}, your pitch, who to contact and roles at your level.</p>
              </div>
              <span className="fp-lock-chip"><Lock size={11}/> Early access</span>
            </div>
            <Locked onUnlock={() => getAccess("match")} message={`See how you match ${firm.name}`}><Decoy variant="match"/></Locked>
          </Section>

          <Section index={4} title="At a glance" kicker={`${firm.name} in brief`}>
            {firm.brief && <p className="fp-brief">{firm.brief}</p>}
            <Locked onUnlock={() => getAccess("brief")} message="Read the full brief" compact><Decoy variant="text" count={3}/></Locked>
          </Section>

          <Section index={5} title="Recruiting" kicker={`How ${firm.name} hires`} aside={counts.programs > 0 ? `${counts.programs} program${counts.programs === 1 ? "" : "s"} tracked` : undefined}>
            <Locked onUnlock={() => getAccess("recruiting")} message={counts.programs > 0 ? "See programs, timelines and who they hire" : "Opens with early access"}><Decoy variant="rows" count={3}/></Locked>
          </Section>

          <Section index={6} title="Community signal" kicker={`Candidates frequently discussing ${firm.name}`}>
            <Locked onUnlock={() => getAccess("community")} message="See what candidates are saying" compact><Decoy variant="chips"/></Locked>
          </Section>

          <Section index={7} title="Interviews" kicker="Interviews frequently mentioned" aside={counts.interviews > 0 ? `${counts.interviews} candidate account${counts.interviews === 1 ? "" : "s"}` : undefined}>
            <Locked onUnlock={() => getAccess("interviews")} message={counts.interviews > 0 ? "See the stages and questions candidates report" : "Opens with early access"}><Decoy variant="rows" count={3} kind="interview"/></Locked>
          </Section>

          <Section index={8} title="What's changed" kicker="Hires, departures, transactions and announcements" aside={counts.changes > 0 ? `${counts.changes} updates` : undefined}>
            <Locked onUnlock={() => getAccess("changes")} message="See every recent change"><Decoy variant="timeline"/></Locked>
          </Section>

          <Section index={9} title="People" kicker="Publicly identifiable leaders" aside={extraLeaders > 0 ? `+${extraLeaders} more` : undefined}>
            <ul className="fp-leaders">
              {firm.leaders.map((leader) => (
                <li key={leader.name}>
                  <Avatar name={leader.name} photo={leader.photo}/>
                  <div><p className="fp-leader-name">{leader.name}</p><p className="fp-leader-title">{leader.title}</p></div>
                </li>
              ))}
            </ul>
            {extraLeaders > 0 && <Locked onUnlock={() => getAccess("people")} message={`See all ${counts.people} people, with bios`} compact><Decoy variant="people"/></Locked>}
          </Section>

          <Section index={10} title="People moves" kicker="Hires, promotions and departures" aside={counts.moves > 0 ? `${counts.moves} moves` : undefined}>
            {firm.latestMove ? (
              <>
                <div className="fp-item">
                  <span className="fp-tag">{label(firm.latestMove.type)}</span>
                  <div><p className="fp-item-title">{firm.latestMove.person}</p>{firm.latestMove.title && <p className="fp-item-sub">{firm.latestMove.title}</p>}</div>
                  <time>{month(firm.latestMove.date)}</time>
                </div>
                {counts.moves > 1 && <Locked onUnlock={() => getAccess("moves")} message="See every hire, promotion and departure" compact><Decoy variant="rows" count={2} kind="move"/></Locked>}
              </>
            ) : <p className="fp-empty">Publicly reported moves at {firm.name} will appear here.</p>}
          </Section>

          <Section index={11} title="Deals" kicker="Transactions where this firm played a disclosed role" aside={counts.deals > 0 ? `${counts.deals} deals` : undefined}>
            {firm.latestDeal ? (
              <>
                <div className="fp-item">
                  <span className="fp-tag">{firm.latestDeal.value ? money(firm.latestDeal.value, firm.latestDeal.currency) : "Deal"}</span>
                  <div><p className="fp-item-title">{firm.latestDeal.target}</p>{firm.latestDeal.role && <p className="fp-item-sub">{firm.latestDeal.role}</p>}</div>
                  <time>{month(firm.latestDeal.date)}</time>
                </div>
                {counts.deals > 1 && <Locked onUnlock={() => getAccess("deals")} message="See every deal and the firm's role" compact><Decoy variant="rows" count={2} kind="deal"/></Locked>}
              </>
            ) : <p className="fp-empty">Disclosed transactions will appear here.</p>}
          </Section>
        </div>

        <footer className="fp-footer">
          <p>The full {firm.name} profile opens with early access.</p>
          <div className="fp-footer-actions">
            {hiring && <Link className="fp-roles" href={companyPath(firm.name)}>Open roles <ArrowUpRight size={14}/></Link>}
            <button type="button" className="fp-cta" onClick={() => getAccess("footer")}>Get early access <ArrowRight size={15}/></button>
          </div>
        </footer>
      </div>
    </dialog>
  );
}

function Section({ index, title, kicker, aside, children }: { index: number; title: string; kicker: string; aside?: string; children: ReactNode }) {
  return (
    <section className="fp-section fp-reveal" style={{ ["--i" as string]: index }}>
      <header>
        <div><p className="fp-section-title">{title}</p><h3>{kicker}</h3></div>
        {aside && <span className="fp-aside">{aside}</span>}
      </header>
      {children}
    </section>
  );
}

function Locked({ children, message, onUnlock, compact }: { children: ReactNode; message: string; onUnlock: () => void; compact?: boolean }) {
  return (
    <div className={`fp-locked${compact ? " is-compact" : ""}`}>
      <div className="fp-blur" aria-hidden="true" inert>{children}</div>
      <button type="button" className="fp-unlock" onClick={onUnlock}><Lock size={13}/> {message}</button>
    </div>
  );
}

const PHRASES = [
  "Analyst · Toronto · Investment Banking",
  "First round: two interviews, behavioural and technical",
  "Walk me through the three financial statements",
  "Superday with four back-to-back conversations",
  "Coverage group and deal team, with notes",
  "Associate · Calgary · Energy",
  "Why this firm over the other banks you're speaking to",
  "Offer timing and how decisions were communicated",
];

/** Generic stand-in shapes for blurred layers. They read as content once blurred but name no firm or person. */
function Decoy({ variant, count = 3, kind }: { variant: "text" | "rows" | "chips" | "timeline" | "people" | "match"; count?: number; kind?: "interview" | "move" | "deal" }) {
  if (variant === "match") return (
    <div className="fd-match">
      <span className="fd-ring">87</span>
      <div>{PHRASES.slice(0, 3).map((phrase) => <p key={phrase}>{phrase}. Strong fit for the coverage teams hiring at your level.</p>)}</div>
    </div>
  );
  if (variant === "text") return <div className="fd-text">{Array.from({ length: count }, (_, i) => <p key={i}>{PHRASES[i % 8]}. {PHRASES[(i + 3) % 8]}, and {PHRASES[(i + 5) % 8].toLowerCase()}.</p>)}</div>;
  if (variant === "chips") return <div className="fd-chips">{["Superday format", "Technicals", "Group placement", "Culture", "Hours", "Offer timing", "Networking"].map((chip) => <span key={chip}>{chip}</span>)}</div>;
  if (variant === "timeline") return <div className="fd-timeline">{PHRASES.slice(2, 6).map((phrase, i) => <p key={phrase}><time>{["Sep", "Aug", "Jul", "Jun"][i]} 2026</time>{phrase}</p>)}</div>;
  if (variant === "people") return <div className="fd-people">{PHRASES.slice(0, 3).map((phrase) => <p key={phrase}><span/>{phrase}</p>)}</div>;
  const tag = kind === "deal" ? "US$1.2B" : kind === "move" ? "Hire" : kind === "interview" ? "Round 2" : "Program";
  return <div className="fd-rows">{Array.from({ length: count }, (_, i) => <p key={i}><span>{tag}</span>{PHRASES[(i + 1) % 8]}<time>2026</time></p>)}</div>;
}

function Avatar({ name, photo }: { name: string; photo: string | null }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(" ").filter((part) => /^[A-Z]/.test(part)).map((part) => part[0]).slice(0, 2).join("");
  return (
    <span className="fp-avatar">
      {photo && !failed
        ? <img src={photo} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)}/>
        : <span aria-hidden="true">{initials}</span>}
    </span>
  );
}

const label = (type: string) => type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");

// Research dates are YYYY-MM-DD, or YYYY-MM when only the month is known.
const month = (date: string) => new Date(`${date.slice(0, 7)}-01T12:00:00Z`).toLocaleDateString("en-CA", { month: "short", year: "numeric", timeZone: "UTC" });

function money(value: number, currency: string | null) {
  const prefix = currency === "USD" ? "US$" : currency === "CAD" ? "C$" : currency === "AUD" ? "A$" : currency ? `${currency} ` : "$";
  const amount = value >= 1e9 ? `${+(value / 1e9).toFixed(1)}B` : value >= 1e6 ? `${Math.round(value / 1e6)}M` : value.toLocaleString("en-CA");
  return `${prefix}${amount}`;
}
