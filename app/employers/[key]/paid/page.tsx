import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { CheckoutCompleted } from "@/components/employer-page";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { PACKAGES } from "@/lib/employers/packages";
import "../employers.css";

export const metadata: Metadata = {
  title: "Payment received | BSO Jobs for Employers",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

/**
 * Where Stripe Payment Links return after a successful payment. A thank-you page only: the
 * payment itself is confirmed in Stripe, never by a visit to this URL.
 */
export default async function EmployerPaidPage({ params, searchParams }: { params: Promise<{ key: string }>; searchParams: Promise<{ package?: string }> }) {
  const [{ key }, { package: packageId }] = await Promise.all([params, searchParams]);
  const pageKey = process.env.EMPLOYER_PAGE_KEY;
  if (!pageKey || key !== pageKey) notFound();
  const pkg = PACKAGES.find((item) => item.id === packageId && item.price);

  return (
    <main className="emp-page">
      <CheckoutCompleted packageId={pkg?.id ?? "unknown"}/>
      <SiteHeader/>
      <section className="emp-paid">
        <div className="emp-paid-inner emp-rise">
          <span className="emp-done-icon"><Check size={22}/></span>
          <p className="eyebrow light">BSO for employers</p>
          <h1>Payment received.</h1>
          <p>Thank you{pkg ? ` for choosing the ${pkg.name.toLowerCase()}` : ""}. The BSO team will follow up at the email you used at checkout to confirm the role details and schedule your campaign.</p>
          <div className="emp-hero-actions">
            <Link className="emp-button light" href="/jobs">View BSO Jobs <ArrowRight size={16}/></Link>
            <Link className="emp-button ghost" href={`/employers/${key}`}>Back to packages</Link>
          </div>
        </div>
        <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
      </section>
      <SiteFooter/>
    </main>
  );
}
