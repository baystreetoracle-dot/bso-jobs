import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { CountUp, EmployerPageView, PackageLink } from "@/components/employer-page";
import { Reveal, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { AUDIENCE_METRICS, AUDIENCE_NOTE, PACKAGES, customCampaignMailto, packageMailto } from "@/lib/employers/packages";
import "./employers.css";

const title = "Recruit on BSO Jobs | For Employers";
const description = "Reach Canada's next generation of finance talent. Featured listings and recruiting campaigns on BSO Jobs for investment banks, private equity firms, asset managers and investors.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/employers" },
  openGraph: { title, description, url: "/employers", type: "website" },
};

const STEPS = [
  { title: "Choose a package", text: "Pick the level of visibility the role needs." },
  { title: "Share the role", text: "Send the company, role and the link to your posting." },
  { title: "We review it", text: "The BSO team confirms the details and schedules the campaign." },
  { title: "Your role goes live", text: "Placement and distribution run for 30 days." },
];

const PATHS = ["Investment banking", "Corporate finance", "Private equity", "Private credit", "Asset management", "Hedge funds"];

export default function EmployersPage() {
  const upgrade = PACKAGES.find((pkg) => pkg.id === "featured")!;
  return (
    <main className="emp-page">
      <EmployerPageView/>
      <SiteHeader current="employers"/>

      <section className="emp-hero" id="top">
        <div className="emp-hero-copy">
          <p className="eyebrow light emp-rise" style={{ ["--d" as string]: "0ms" }}>BSO for employers</p>
          <h1 className="emp-rise" style={{ ["--d" as string]: "90ms" }}>Reach Canada&apos;s next generation of finance talent.</h1>
          <p className="emp-hero-lede emp-rise" style={{ ["--d" as string]: "180ms" }}>BSO Jobs puts your role in front of a focused audience building careers across Canadian capital markets.</p>
          <div className="emp-hero-actions emp-rise" style={{ ["--d" as string]: "270ms" }}>
            <a className="emp-button light" href="#packages">View packages <ArrowRight size={16}/></a>
            <a className="emp-button ghost" href="#custom">Contact us</a>
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
                <PackageLink className={`emp-button ${pkg.emphasized ? "solid" : "outline"}`} href={packageMailto(pkg)} packageId={pkg.id}>
                  {pkg.cta} <ArrowRight size={16}/>
                </PackageLink>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal className="emp-upgrade">
          <p><strong>Already have a role on BSO Jobs?</strong> Upgrade its visibility at any time.</p>
          <PackageLink className="emp-text-link" href={packageMailto(upgrade)} packageId="upgrade">Upgrade a role <ArrowUpRight size={15}/></PackageLink>
        </Reveal>
      </section>

      <section className="emp-steps" aria-labelledby="emp-steps-title">
        <Reveal className="emp-steps-head"><p className="eyebrow">How it works</p><h2 id="emp-steps-title">From brief to live campaign.</h2></Reveal>
        <Reveal className="emp-steps-track">
          <ol>
            {STEPS.map((step, index) => (
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
            <PackageLink className="emp-button light" href={customCampaignMailto()} packageId="custom">Contact us <ArrowRight size={16}/></PackageLink>
          </div>
        </Reveal>
      </section>

      <SiteFooter/>
    </main>
  );
}
