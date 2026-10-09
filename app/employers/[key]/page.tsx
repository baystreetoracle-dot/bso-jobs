import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check, Lock } from "lucide-react";
import { CheckoutLink, CountUp, EmailAlternative, EmployerPageView, EmployerRequests, JumpLink, RequestButton } from "@/components/employer-page";
import { Reveal, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { AUDIENCE_METRICS, AUDIENCE_NOTE, PACKAGES, checkoutUrl } from "@/lib/employers/packages";
import "./employers.css";

const title = "Recruit on BSO Jobs | For Employers";
const description = "Reach Canada's next generation of finance talent. Featured listings and recruiting campaigns on BSO Jobs for investment banks, private equity firms, asset managers and investors.";

// A private, unlisted page: shared by link only, never indexed. The key lives in EMPLOYER_PAGE_KEY
// (the repository is public, so it must not appear in code).
export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  openGraph: { title, description, type: "website" },
};

const stepsFor = (checkout: boolean) => [
  { title: "Choose a package", text: "Pick the level of visibility the role needs." },
  checkout
    ? { title: "Check out securely", text: "Pay by card through Stripe, adding the company and role as you go." }
    : { title: "Share the role", text: "Send the company, role and the link to your posting." },
  { title: "We review it", text: "The BSO team confirms the details and schedules the campaign." },
  { title: "Your role goes live", text: "Placement and distribution run for 30 days." },
];

const PATHS = ["Investment banking", "Corporate finance", "Private equity", "Private credit", "Asset management", "Hedge funds"];

export default async function EmployersPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const pageKey = process.env.EMPLOYER_PAGE_KEY;
  if (!pageKey || key !== pageKey) notFound();
  const upgradeUrl = checkoutUrl("featured");
  const steps = stepsFor(Boolean(upgradeUrl));

  return (
    <EmployerRequests pageKey={key}>
    <main className="emp-page">
      <EmployerPageView/>
      <SiteHeader/>

      <section className="emp-hero" id="top">
        <div className="emp-hero-copy">
          <p className="eyebrow light emp-rise" style={{ ["--d" as string]: "0ms" }}>BSO for employers</p>
          <h1 className="emp-rise" style={{ ["--d" as string]: "90ms" }}>Reach Canada&apos;s next generation of finance talent.</h1>
          <p className="emp-hero-lede emp-rise" style={{ ["--d" as string]: "180ms" }}>BSO Jobs puts your role in front of a focused audience building careers across Canadian capital markets.</p>
          <div className="emp-hero-actions emp-rise" style={{ ["--d" as string]: "270ms" }}>
            <JumpLink className="emp-button light" to="packages">View packages <ArrowRight size={16}/></JumpLink>
            <JumpLink className="emp-button ghost" to="custom">Contact us</JumpLink>
          </div>
        </div>
        <div className="emp-metrics emp-rise" style={{ ["--d" as string]: "360ms" }}>
          <dl>
          {AUDIENCE_METRICS.map((metric) => (
            <div key={metric.label}><dt>{metric.label}</dt><dd><CountUp value={metric.value} suffix={metric.suffix}/></dd></div>
          ))}
          </dl>
          <p className="emp-metrics-note">{AUDIENCE_NOTE}</p>
        </div>
        <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
      </section>

      <section className="emp-paths" aria-label="Career paths covered">
        <p>Built for firms across</p>
        <ul>{PATHS.map((path) => <li key={path}>{path}</li>)}</ul>
      </section>

      <section className="emp-packages" id="packages">
        <Reveal className="section-heading">
          <div><p className="eyebrow">Packages</p><h2>Recruiting distribution, priced per role.</h2></div>
          <p>Every paid package runs for 30 days. Prices are in Canadian dollars, per role.</p>
        </Reveal>
        <div className="emp-cards">
          {PACKAGES.map((pkg, index) => (
            <Reveal key={pkg.id} delay={index * 90} className={`emp-card-wrap${pkg.emphasized ? " is-emphasized" : ""}`}>
              <article className="emp-card">
                <header>
                  <p className="emp-card-name">{pkg.name}</p>
                  {pkg.emphasized && <span className="emp-card-tag">Most popular</span>}
                </header>
                <p className="emp-price">{pkg.price ? <><span className="emp-currency">C$</span>{pkg.price}</> : "Free"}</p>
                <p className="emp-cadence">{pkg.price ? "per role · 30 days" : "always"}</p>
                <p className="emp-summary">{pkg.summary}</p>
                <ul className="emp-features">
                  {pkg.inherits && <li className="emp-inherits">{pkg.inherits}</li>}
                  {pkg.features.map((feature) => <li key={feature}><Check size={15} aria-hidden="true"/>{feature}</li>)}
                </ul>
                {(() => {
                  const href = pkg.price ? checkoutUrl(pkg.id) : null;
                  const style = `emp-button ${pkg.emphasized ? "solid" : "outline"}`;
                  return href ? (
                    <div className="emp-card-actions">
                      <CheckoutLink className={style} href={href} packageId={pkg.id}>{pkg.cta} <ArrowRight size={16}/></CheckoutLink>
                      <p className="emp-secure"><Lock size={12} aria-hidden="true"/> Secure checkout with Stripe</p>
                      <RequestButton className="emp-card-secondary" packageId={pkg.id}>Questions first? Send a request</RequestButton>
                    </div>
                  ) : (
                    <RequestButton className={style} packageId={pkg.id}>{pkg.cta} <ArrowRight size={16}/></RequestButton>
                  );
                })()}
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal className="emp-upgrade">
          <p><strong>Already have a role on BSO Jobs?</strong> Upgrade its visibility at any time.</p>
          {upgradeUrl
            ? <CheckoutLink className="emp-text-link" href={upgradeUrl} packageId="featured">Upgrade a role <ArrowUpRight size={15}/></CheckoutLink>
            : <RequestButton className="emp-text-link" packageId="featured">Upgrade a role <ArrowUpRight size={15}/></RequestButton>}
        </Reveal>
      </section>

      <section className="emp-steps" aria-labelledby="emp-steps-title">
        <Reveal className="emp-steps-head"><p className="eyebrow">How it works</p><h2 id="emp-steps-title">From brief to live campaign.</h2></Reveal>
        <Reveal className="emp-steps-track">
          <ol>
            {steps.map((step, index) => (
              <li key={step.title} style={{ ["--i" as string]: index }}>
                <span className="emp-step-num">{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      <section className="emp-custom" id="custom">
        <Reveal>
          <div className="emp-custom-inner">
            <div>
              <p className="eyebrow light">Institutional and custom</p>
              <h2>Recruiting for multiple roles or running an ongoing campaign?</h2>
              <p>Tell us what you&apos;re hiring for and we&apos;ll put together a campaign around your timeline.</p>
            </div>
            <div className="emp-custom-actions">
              <RequestButton className="emp-button light" packageId="custom">Contact us <ArrowRight size={16}/></RequestButton>
              <EmailAlternative prefix="Or email"/>
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter/>
    </main>
    </EmployerRequests>
  );
}
