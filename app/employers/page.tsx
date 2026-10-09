import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmployerGate } from "@/components/employer-page";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import "./[key]/employers.css";

export const metadata: Metadata = {
  title: "For Employers | BSO Jobs",
  description: "Recruiting packages for firms hiring through BSO Jobs.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

/**
 * The public way in to the employer page: a visitor confirms they hire on behalf of a firm, then
 * continues to /employers/<key>. A soft gate, not access control; the key lives in EMPLOYER_PAGE_KEY.
 */
export default function EmployersGatePage() {
  const pageKey = process.env.EMPLOYER_PAGE_KEY;
  if (!pageKey) notFound();

  return (
    <main className="emp-page">
      <SiteHeader/>
      <section className="emp-paid emp-gate">
        <div className="emp-paid-inner emp-rise">
          <p className="eyebrow light">BSO for employers</p>
          <h1>For hiring teams.</h1>
          <p>Recruiting packages for firms hiring through BSO Jobs, from featured listings to full recruiting campaigns.</p>
          <EmployerGate destination={`/employers/${pageKey}`}/>
          <p className="emp-gate-alt">Looking for a role instead? <Link href="/jobs">Browse open opportunities</Link></p>
        </div>
        <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
      </section>
      <SiteFooter/>
    </main>
  );
}
