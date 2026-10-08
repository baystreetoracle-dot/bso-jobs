#!/usr/bin/env node
// Builds lib/intelligence/firm-previews.json: the small, public-safe slice of BSO Intelligence
// research shown in the /intelligence logo previews. Everything else on those previews is a blurred
// stand-in, so only the fields below ever leave the Intelligence repo.
//
// Usage: node scripts/intelligence/build-firm-previews.mjs <path-to-bso-intelligence-repo>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = process.argv[2];
if (!repo) {
  console.error("Usage: node scripts/intelligence/build-firm-previews.mjs <path-to-bso-intelligence-repo>");
  process.exit(1);
}

// The seven firms on the /intelligence logo strip, in order. `name` and `logo` follow BSO Jobs;
// `type` is the BSO Jobs company type that Intelligence also displays.
const FIRMS = [
  { slug: "rbc-capital-markets", name: "RBC Capital Markets", type: "Canadian Investment Bank", logo: "/company-logos/bso-supplied/rbc-capital-markets.webp" },
  { slug: "goldman-sachs", name: "Goldman Sachs", type: "Global Bank", logo: "/company-logos/bso-supplied/goldman-sachs.webp" },
  { slug: "cpp-investments", name: "CPP Investments", type: "Pension Fund", logo: "/company-logos/bso-supplied/cpp-investments.webp" },
  { slug: "brookfield", name: "Brookfield Asset Management", type: "Private Equity", headquarters: "New York, NY · Toronto, ON", logo: "/company-logos/bso-supplied/brookfield-asset-management.webp" },
  { slug: "evercore", name: "Evercore", type: "Global Independent Advisory", logo: "/company-logos/bso-supplied/evercore-inc.webp" },
  { slug: "ontario-teachers", name: "Ontario Teachers' Pension Plan", type: "Pension Fund", logo: "/company-logos/bso-supplied/ontario-teachers-pension-plan.webp" },
  { slug: "jp-morgan", name: "J.P. Morgan", type: "Global Bank", logo: "/company-logos/bso-supplied/jpmorgan.webp" },
];

// Split after a word of 2+ letters so initials such as "J.P." do not end the sentence.
const firstSentence = (text) => (text ?? "").split(/(?<=[a-z0-9)]{2}[.!?])\s+(?=[A-Z])/)[0]?.trim() || null;
const byDateDesc = (key) => (a, b) => String(b[key] ?? "").localeCompare(String(a[key] ?? ""));
const verified = (item) => !item.verification_status || item.verification_status.startsWith("verified");

const previews = FIRMS.map((firm) => {
  const data = JSON.parse(readFileSync(join(repo, "research", "firms", `${firm.slug}.json`), "utf8"));
  const moves = (data.people_moves ?? []).filter(verified).sort(byDateDesc("effective_date"));
  const deals = (data.deals ?? []).filter((deal) => deal.announcement_date).sort(byDateDesc("announcement_date"));
  const move = moves[0];
  // The one visible deal prefers a hand-curated record (it carries an industry and a clean target)
  // over a newsroom-ingested one, whose "target" is the press-release headline.
  const deal = deals.find((item) => item.industry) ?? deals[0];
  return {
    ...firm,
    headquarters: firm.headquarters ?? data.firm.headquarters ?? null,
    tagline: data.firm.tagline ?? null,
    brief: firstSentence(data.firm.description),
    founded: data.firm.founded_year ?? null,
    counts: {
      people: data.people?.length ?? 0,
      moves: moves.length,
      deals: deals.length,
      changes: data.timeline?.length ?? 0,
      programs: data.recruiting_programs?.length ?? 0,
      interviews: data.interview?.experiences?.length ?? 0,
      sources: data.sources?.length ?? 0,
    },
    leaders: (data.people ?? []).slice(0, 3).map((person) => ({
      name: person.full_name,
      title: person.current_title,
      photo: person.photo_url || null,
    })),
    latestMove: move ? {
      person: move.person_name,
      type: move.move_type,
      title: move.new_title ?? move.old_title ?? null,
      date: move.effective_date,
    } : null,
    latestDeal: deal ? {
      target: deal.target,
      role: deal.firm_role ?? null,
      value: deal.transaction_value ?? null,
      currency: deal.currency ?? null,
      date: deal.announcement_date,
    } : null,
  };
});

const out = resolve(dirname(fileURLToPath(import.meta.url)), "../../lib/intelligence/firm-previews.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(previews, null, 2)}\n`);
console.log(`Wrote ${previews.length} firm previews to ${out}`);
