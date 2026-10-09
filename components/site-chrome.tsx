"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, X } from "lucide-react";
import { useModalDialog } from "@/components/use-modal-dialog";

const NAV_LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/companies", label: "Companies" },
  { href: "/jobs#newsletter", label: "Newsletter" },
  { href: "/employers", label: "For employers", employer: true },
] as const;

/** Current page: an exact match or a child route. The newsletter anchor is never "current". */
const isCurrent = (path: string, href: string) => !href.includes("#") && (path === href || path.startsWith(`${href}/`));
const isJobsRoute = (path: string) => /^\/(jobs|companies)(\/|$)/.test(path);
const noop = () => () => {};

/** The BSO Jobs header, shared by the job board and the employer pages. */
export function SiteHeader() {
  const path = usePathname() ?? "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPath, setLastPath] = useState(path);
  // Navigating closes the menu.
  if (path !== lastPath) {
    setLastPath(path);
    setMenuOpen(false);
  }
  return <header className="site-header"><div className="brand-group"><Link className="brand" href="/jobs"><img className="brand-logo" src="/bso-logo.png" alt="Bay Street Oracle"/><span className="brand-name">BAY STREET ORACLE</span></Link><div className="product-switch" role="group" aria-label="Bay Street Oracle products"><Link href="/jobs" aria-current={isJobsRoute(path)?"page":undefined}>Jobs</Link><Link href="/intelligence">Intelligence</Link></div></div><nav aria-label="BSO Jobs">{NAV_LINKS.map(link=><Link key={link.href} className={"employer" in link?"nav-employer":undefined} href={link.href} aria-current={isCurrent(path,link.href)?"page":undefined}>{link.label}</Link>)}</nav><button type="button" className="menu-button" onClick={()=>setMenuOpen(true)} aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label="Open menu"><span/><span/></button><MobileMenu open={menuOpen} path={path} onClose={()=>setMenuOpen(false)}/></header>;
}

/**
 * Full-screen phone menu that slides in from the right, ported from BSO Intelligence
 * (components/layout/mobile-menu.tsx there) in the Jobs palette. Portalled to <body> because the
 * header's backdrop blur would otherwise contain a fixed panel.
 */
function MobileMenu({ open, path, onClose }: { open: boolean; path: string; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closer = useRef<HTMLButtonElement>(null);
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  useModalDialog(open, onClose, panelRef, closer);
  if (!mounted) return null;
  return createPortal(
    <div id="mobile-menu" ref={panelRef} className={`mobile-menu${open?" is-open":""}`} role="dialog" aria-modal="true" aria-label="Menu" inert={!open}>
      <div className="mobile-menu-glow" aria-hidden="true"/>
      <div className="mobile-menu-top">
        <Link href="/jobs" className="mobile-menu-brand" onClick={onClose} aria-label="BSO Jobs home"><img src="/bso-logo.png" alt=""/><span>Jobs</span></Link>
        <button ref={closer} type="button" className="mobile-menu-close" onClick={onClose} aria-label="Close menu"><X size={16} strokeWidth={1.6}/></button>
      </div>
      <div className="mobile-menu-body">
        <nav aria-label="BSO Jobs">
          {NAV_LINKS.map((link, index) => {
            const current = isCurrent(path, link.href);
            return (
              <Link key={link.href} href={link.href} onClick={onClose} aria-current={current?"page":undefined} className="mobile-menu-link" style={{ transitionDelay: open ? `${80 + index * 40}ms` : "0ms" }}>
                <span>{link.label}</span><ArrowRight size={16}/>
              </Link>
            );
          })}
        </nav>
        <div className="mobile-menu-actions">
          <Link href="/jobs#newsletter" className="mobile-menu-primary" onClick={onClose}>Join the BSO briefing</Link>
          <Link href="/intelligence" className="mobile-menu-secondary" onClick={onClose}>BSO Intelligence <ArrowRight size={16}/></Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** The BSO Jobs footer, shared by the job board and the employer pages. */
export function SiteFooter() {
  return <footer><Link className="footer-brand" href="/jobs"><img src="/bso-logo.png" alt=""/><span>THE BAY STREET ORACLE</span></Link><div><Link href="/jobs">Jobs</Link><Link href="/companies">Companies</Link><Link href="/jobs#newsletter">Newsletter</Link></div><div><p>Not NYC.<br/>Not trying to be.</p><a href="mailto:info@baystreetoracle.ca">info@baystreetoracle.ca</a><div className="footer-socials"><a href="https://www.youtube.com/@baystreetoracle" target="_blank" rel="noreferrer" aria-label="Bay Street Oracle on YouTube"><YouTubeIcon/></a><a href="https://www.instagram.com/baystreetoracle/" target="_blank" rel="noreferrer" aria-label="Bay Street Oracle on Instagram"><InstagramIcon/></a><a href="https://www.linkedin.com/company/baystreetoracle/" target="_blank" rel="noreferrer" aria-label="Bay Street Oracle on LinkedIn"><LinkedInIcon/></a></div></div><small>© 2026 The Bay Street Oracle</small></footer>;
}

/** Fades content up as it scrolls into view (styled by .reveal / .is-visible in globals.css). */
export function Reveal({children,className="",delay=0}:{children:ReactNode;className?:string;delay?:number}) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const node=ref.current;if(!node)return;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){node.classList.add("is-visible");observer.disconnect();}},{threshold:.12});observer.observe(node);return()=>observer.disconnect();},[]);
  return <div ref={ref} className={`reveal ${className}`} style={{transitionDelay:`${delay}ms`}}>{children}</div>;
}

function YouTubeIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="m10 9 5 3-5 3Z" fill="currentColor"/></svg>}
function InstagramIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.4" cy="6.7" r="1.1" fill="currentColor"/></svg>}
function LinkedInIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.2 8.8H2V22h3.2V8.8ZM3.6 2A2 2 0 1 0 3.6 6a2 2 0 0 0 0-4ZM12.2 8.8H9.1V22h3.2v-6.5c0-1.7.3-3.4 2.5-3.4 2.2 0 2.2 2 2.2 3.5V22h3.2v-7.2c0-3.5-.8-6.3-5-6.3-2 0-3.3 1.1-3.9 2.1h-.1V8.8Z" fill="currentColor"/></svg>}
