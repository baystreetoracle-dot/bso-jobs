"use client";

import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { track } from "@vercel/analytics";
import { ArrowRight, Check, X } from "lucide-react";
import { EMPLOYER_EMAIL, PACKAGES, type PackageId } from "@/lib/employers/packages";

type RequestPackage = PackageId | "custom";

const utmParams = () => Object.fromEntries([...new URLSearchParams(window.location.search)].filter(([key]) => key.startsWith("utm_")));

/** Records one employer_page_viewed event, keeping any UTM parameters the visitor arrived with. */
export function EmployerPageView() {
  useEffect(() => {
    track("employer_page_viewed", utmParams());
  }, []);
  return null;
}

const RequestContext = createContext<((pkg: RequestPackage) => void) | null>(null);

/** Holds the request form; any RequestButton inside opens it for its package. */
export function EmployerRequests({ pageKey, children }: { pageKey: string; children: ReactNode }) {
  const [selected, setSelected] = useState<RequestPackage | null>(null);
  const open = (pkg: RequestPackage) => {
    track("employer_package_selected", { package: pkg });
    setSelected(pkg);
  };
  return (
    <RequestContext.Provider value={open}>
      {children}
      {selected && <RequestDialog pageKey={pageKey} packageId={selected} onClose={() => setSelected(null)}/>}
    </RequestContext.Provider>
  );
}

/** Records employer_checkout_completed once, on the page Stripe returns to after payment. */
export function CheckoutCompleted({ packageId }: { packageId: string }) {
  useEffect(() => {
    track("employer_checkout_completed", { package: packageId });
  }, [packageId]);
  return null;
}

/** Goes straight to the package's Stripe checkout, recording employer_checkout_started first. */
export function CheckoutLink({ href, packageId, className, children }: { href: string; packageId: PackageId; className?: string; children: ReactNode }) {
  return (
    <a className={className} href={href} onClick={() => track("employer_checkout_started", { package: packageId, ...utmParams() })}>
      {children}
    </a>
  );
}

export function RequestButton({ packageId, className, children }: { packageId: RequestPackage; className?: string; children: ReactNode }) {
  const open = useContext(RequestContext);
  return <button type="button" className={className} onClick={() => open?.(packageId)}>{children}</button>;
}

function RequestDialog({ pageKey, packageId, onClose }: { pageKey: string; packageId: RequestPackage; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const pkg = PACKAGES.find((item) => item.id === packageId);
  const custom = packageId === "custom";

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/employer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, key: pageKey, package: packageId, utm: utmParams() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? `Unable to send your request right now. Please email ${EMPLOYER_EMAIL}.`);
      track("employer_request_submitted", { package: packageId });
      setSentTo(String(data.email));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : `Unable to send your request right now. Please email ${EMPLOYER_EMAIL}.`);
    } finally {
      setPending(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="emp-dialog"
      aria-labelledby="emp-dialog-title"
      onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}
    >
      <div className="emp-dialog-panel">
        <button type="button" className="emp-dialog-close" aria-label="Close" onClick={() => dialogRef.current?.close()}><X size={18}/></button>
        {sentTo ? (
          <div className="emp-dialog-done" role="status">
            <span className="emp-done-icon"><Check size={20}/></span>
            <h2 id="emp-dialog-title">Request received.</h2>
            <p>Thank you. The BSO team will review the details and follow up at {sentTo}.</p>
            <button type="button" className="emp-button outline" onClick={() => dialogRef.current?.close()}>Done</button>
          </div>
        ) : (
          <>
            <p className="eyebrow">{custom ? "Custom campaign" : "Request"}</p>
            <h2 id="emp-dialog-title">{custom ? "Tell us what you're hiring for." : pkg?.name}</h2>
            {pkg && <p className="emp-dialog-price">{pkg.price ? `C$${pkg.price} per role · 30 days` : "Free"}</p>}
            <form className="emp-form" onSubmit={submit}>
              <label className="emp-field wide"><span>Company</span><input name="companyName" autoComplete="organization" required maxLength={160}/></label>
              <label className="emp-field"><span>First name</span><input name="firstName" autoComplete="given-name" required maxLength={80}/></label>
              <label className="emp-field"><span>Last name</span><input name="lastName" autoComplete="family-name" required maxLength={80}/></label>
              <label className="emp-field wide"><span>Work email</span><input name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" required maxLength={254}/></label>
              {!custom && <label className="emp-field wide"><span>Role title</span><input name="roleTitle" maxLength={200}/></label>}
              {!custom && <label className="emp-field wide"><span>Job posting URL <em>optional</em></span><input name="jobUrl" type="url" inputMode="url" autoCapitalize="none" placeholder="https://" maxLength={500}/></label>}
              <label className="emp-field wide"><span>{custom ? "Roles, number of positions, level and timeline" : "Notes"} {!custom && <em>optional</em>}</span><textarea name="notes" rows={custom ? 5 : 3} maxLength={2000} required={custom}/></label>
              <input className="emp-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
              {error && <p className="emp-form-error" role="alert">{error}</p>}
              <button type="submit" className="emp-button solid-green wide" disabled={pending}>{pending ? "Sending…" : <>Send request <ArrowRight size={16}/></>}</button>
              <p className="emp-form-note">No payment is taken now. We&apos;ll confirm the details and next steps by email.</p>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}

/**
 * In-page link that scrolls to a section itself. A plain #hash link fires popstate, which the
 * Next.js router handles as a history navigation and cancels the browser's smooth scroll.
 */
export function JumpLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  return (
    <a
      className={className}
      href={`#${to}`}
      onClick={(event) => {
        const target = document.getElementById(to);
        if (!target) return;
        event.preventDefault();
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        window.history.replaceState(window.history.state, "", `#${to}`);
      }}
    >
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
