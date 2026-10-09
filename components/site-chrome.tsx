"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** The BSO Jobs header, shared by the job board and the employer pages. */
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);
  return <header className="site-header"><div className="brand-group"><Link className="brand" href="/jobs"><img className="brand-logo" src="/bso-logo.png" alt="Bay Street Oracle"/><span className="brand-name">BAY STREET ORACLE</span></Link><div className="product-switch" role="group" aria-label="Bay Street Oracle products"><Link href="/jobs" aria-current="page">Jobs</Link><Link href="/intelligence">Intelligence</Link></div></div><nav className={menuOpen?"open":""}><Link href="/jobs" onClick={close}>Jobs</Link><Link href="/companies" onClick={close}>Companies</Link><Link href="/jobs#newsletter" onClick={close}>Newsletter</Link><a className="nav-employer" href="mailto:info@baystreetoracle.ca?subject=BSO%20Hiring%20Campaign" onClick={close}>For employers</a></nav><button className="menu-button" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Toggle menu"><span/><span/></button></header>;
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
