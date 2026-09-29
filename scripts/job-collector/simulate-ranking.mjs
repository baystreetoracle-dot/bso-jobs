import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rankJobs } from "../../lib/jobs/ranking.ts";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPORTS = path.join(ROOT, "reports");
const DRY_RUN = "dry-run-2026-09-29T02-31-18-723Z.json";
const ADDITIONS = "local-review-additions-2026-09-29.json";

function torontoDate() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

const today = process.env.RANKING_DATE ?? torontoDate();
const [report, additions] = await Promise.all([
  readFile(path.join(REPORTS, DRY_RUN), "utf8").then(JSON.parse),
  readFile(path.join(REPORTS, ADDITIONS), "utf8").then(JSON.parse),
]);

const candidates = [
  ...report.snapshot.jobs
    .filter((job) => job.status === "active" && (!job.application_deadline || job.application_deadline >= today))
    .map((job) => ({ ...job, review_state: "Production active" })),
  ...[...report.reconciliation.newJobs, ...additions]
    .filter((item) => !/\bCPA\b/i.test(item.job?.title ?? ""))
    .filter((item) => item.job?.status === "active" && (!item.job.application_deadline || item.job.application_deadline >= today))
    .map((item) => ({ ...item.job, origin: item.origin, exclusive: Boolean(item.exclusive), review_state: "Proposed — not approved" })),
];

const unique = [...new Map(candidates.map((job) => [`${job.company_id}|${job.external_job_id}`, job])).values()];
const ranked = rankJobs(unique, { today, diversity: true });
const rows = ranked.map((item) => ({
  rank: item.rank,
  company: item.job.company_name,
  role: item.job.title,
  careerPath: item.job.category,
  seniority: item.job.seniority,
  location: item.job.location_display,
  score: item.score,
  baseScore: item.baseScore,
  band: item.band,
  state: item.job.review_state,
  components: item.components,
  why: item.why,
  externalJobId: item.job.external_job_id,
}));

const output = {
  generatedAt: new Date().toISOString(),
  rankingDate: today,
  methodology: "Firm 28 + career path 24 + rarity 18 + seniority 12 + freshness 10 + exclusive/direct signal 6 + Canadian relevance 2; diversity only reorders within five-point bands.",
  candidates: rows.length,
  rows,
};
const outputFile = path.join(REPORTS, `ranking-simulation-${today}.json`);
await writeFile(outputFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(`Ranking simulation: ${rows.length} current/proposed opportunities as of ${today}`);
console.log(`Saved: ${outputFile}`);
console.table(rows.slice(0, 50).map(({ rank, company, role, careerPath, seniority, location, score, state }) => ({ rank, company, role, careerPath, seniority, location, score, state })));
