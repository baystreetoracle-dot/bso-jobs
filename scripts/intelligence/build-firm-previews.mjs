#!/usr/bin/env node
// Builds lib/intelligence/firm-previews.json: the small, public-safe slice of BSO Intelligence
// shown in the /intelligence logo previews. Everything else on those previews is a blurred
// stand-in, so only the fields below ever leave the Intelligence repo.
//
// Reads Intelligence's built dataset (lib/research/dataset.json, written by its
// scripts/build-dataset.ts), not the raw research files: the build merges the deal database
// (research/deals) into each firm, so counts here match what Intelligence itself shows.
//
// Usage: node scripts/intelligence/build-firm-previews.mjs <bso-intelligence repo | dataset.json>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/intelligence/build-firm-previews.mjs <bso-intelligence repo | dataset.json>");
  process.exit(1);
}
const datasetPath = input.endsWith(".json") ? input : join(input, "lib", "research", "dataset.json");
const dataset = JSON.parse(readFileSync(datasetPath, "utf8"));

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
const verified = (move) => !move.verificationStatus || move.verificationStatus.startsWith("verified");

// Several banks often advise on the same headline deal; each preview shows a different one.
const shownDeals = new Set();

const previews = FIRMS.map((firm) => {
  const bundle = dataset.firms.find((item) => item.firm.slug === firm.slug);
  if (!bundle) throw new Error(`${firm.slug} is not in ${datasetPath}`);
  const moves = [...bundle.moves].sort(byDateDesc("effectiveDate"));
  const deals = bundle.deals.filter((deal) => deal.announcementDate).sort(byDateDesc("announcementDate"));
  // The one visible move is a verified one; the one visible deal prefers a hand-curated record
  // (it carries an industry and a clean target) over a newsroom one titled with its headline.
  const move = moves.find(verified);
  const deal = deals.find((item) => item.industry && !shownDeals.has(item.slug)) ?? deals.find((item) => item.industry) ?? deals[0];
  if (deal) shownDeals.add(deal.slug);
  return {
    ...firm,
    headquarters: firm.headquarters ?? bundle.firm.headquarters ?? null,
    tagline: bundle.firm.tagline ?? null,
    brief: firstSentence(bundle.firm.description),
    founded: bundle.firm.foundedYear ?? null,
    counts: {
      people: bundle.people.length,
      moves: bundle.moves.length,
      deals: bundle.deals.length,
      changes: bundle.events.length,
      programs: bundle.programs.length,
      interviews: bundle.interviews.length,
      sources: bundle.sources.length,
    },
    leaders: bundle.people.slice(0, 3).map((person) => ({
      name: person.fullName,
      title: person.currentTitle,
      photo: person.photoUrl || null,
    })),
    latestMove: move ? {
      person: move.personName,
      type: move.moveType,
      title: move.newTitle ?? move.oldTitle ?? null,
      date: move.effectiveDate,
    } : null,
    latestDeal: deal ? {
      target: deal.target,
      role: deal.firmRole ?? null,
      value: deal.transactionValue ?? null,
      currency: deal.currency ?? null,
      date: deal.announcementDate,
    } : null,
  };
});

const out = resolve(dirname(fileURLToPath(import.meta.url)), "../../lib/intelligence/firm-previews.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(previews, null, 2)}\n`);
const totals = dataset.firms.reduce((sum, item) => ({ firms: sum.firms + 1, people: sum.people + item.people.length, deals: sum.deals + item.deals.length }), { firms: 0, people: 0, deals: 0 });
console.log(`Wrote ${previews.length} firm previews to ${out}`);
console.log(`Dataset coverage (for lib/intelligence/coverage.ts): ${totals.firms} firms, ${totals.people} people, ${totals.deals} deals`);
