import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { IntelligenceLogoStrip } from "@/components/intelligence-firm-preview";
import { IntelligenceHero } from "@/components/intelligence-hero";
import { IntelligenceWaitlist } from "@/components/intelligence-waitlist";
import { ScrambleNumber } from "@/components/scramble-number";
import { COVERAGE } from "@/lib/intelligence/coverage";
import { getActiveJobs } from "@/lib/jobs/server";
import "./intelligence.css";

export const revalidate = 300;

// Dark browser chrome on phones, matching the page header.
export const viewport: Viewport = { themeColor: "#0c0c0c", colorScheme: "dark" };

const title = "Early Access | BSO Intelligence";
const description = "All of Bay Street, coming soon: 204 firms, 1,214 people and 5,136 deals, every fact sourced. Join the BSO Intelligence waitlist for early access.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/intelligence" },
  openGraph: { title, description, url: "/intelligence", type: "website" },
};
export default async function IntelligencePage() {
  // Firms with active roles get an "Open roles" link in their preview (their BSO Jobs company page exists).
  const hiring = new Set((await getActiveJobs().catch(() => [])).map((job) => job.company_name));

  return (
    <div className="intel-page">
      <header className="intel-header">
        <div className="brand-group">
          <Link className="brand" href="/intelligence"><img className="brand-logo" src="/bso-logo.png" alt="Bay Street Oracle"/><span className="brand-name">BAY STREET ORACLE</span></Link>
          <div className="product-switch" role="group" aria-label="Bay Street Oracle products">
            <Link href="/jobs">Jobs</Link>
            <Link href="/intelligence" aria-current="page">Intelligence</Link>
          </div>
        </div>
      </header>

      <IntelligenceHero>
        <p className="intel-kicker">Private beta · The Canadian finance database</p>
        <h1>All of Bay Street. <span className="intel-nowrap">Coming soon.</span></h1>
        <p className="intel-lede"><span className="intel-proof"><ScrambleNumber value={COVERAGE.firms}/> firms. <ScrambleNumber value={COVERAGE.people}/> people. <ScrambleNumber value={COVERAGE.deals}/> deals. <span className="intel-nowrap">Every fact sourced.</span></span></p>
        <IntelligenceWaitlist/>
        <p className="intel-partner">
          <span>Recruiting data developed with</span>
          <Image src="/partners/frontrun.png" alt="FrontRun" width={359} height={53} style={{width:112,height:"auto"}}/>
        </p>
        <p className="intel-logo-hint">Tap a firm to preview its profile</p>
        <IntelligenceLogoStrip hiring={[...hiring]}/>
      </IntelligenceHero>
    </div>
  );
}
