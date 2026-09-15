import { fetchEightfold } from "./adapters/eightfold.mjs";
import { fetchGoldman } from "./adapters/goldman.mjs";
import { fetchOfficialHtml } from "./adapters/official-html.mjs";
import { fetchPhenom } from "./adapters/phenom.mjs";
import { fetchStaticCareers } from "./adapters/static-careers.mjs";
import { fetchJibe } from "./adapters/jibe.mjs";
import { fetchTalnet } from "./adapters/talnet.mjs";
import { fetchWorkday } from "./adapters/workday.mjs";
import { classifyAndNormalize } from "./normalize.mjs";
import { FIRMS, FIRMS_BY_KEY } from "./sources/firms.mjs";
import { fetchRbcCapitalMarketsCanada } from "./sources/rbc.mjs";

const SENIORITIES = ["Student", "Intern", "Analyst", "Associate", "Vice President", "Director", "Managing Director", "Executive / Group Head", "Unspecified"];
const REJECTIONS = ["nonCanadian", "notInvestmentBanking", "corporateBanking", "markets", "research", "riskCompliance", "technologyData", "operationsSupport", "duplicate", "parsingSourceError"];
const args = new Set(process.argv.slice(2));
if (!args.has("--dry-run")) throw new Error("This collector is dry-run-only. Pass --dry-run; no database write mode is available.");
const sourceArg = [...args].find((arg) => arg.startsWith("--source="))?.split("=", 2)[1] ?? "all";
if (![...args].every((arg) => arg === "--dry-run" || arg.startsWith("--source="))) throw new Error("Usage: node scripts/job-collector/index.mjs --dry-run [--source=all|firm-key]");
const selected = sourceArg === "all"
  ? FIRMS
  : sourceArg === "canadian-independent"
    ? FIRMS.filter((firm) => firm.cohort === "canadian-independent")
    : [FIRMS_BY_KEY.get(sourceArg)].filter(Boolean);
if (!selected.length) throw new Error(`Unknown source '${sourceArg}'. Available: ${FIRMS.map((firm) => firm.key).join(", ")}`);

const adapters = {
  workday: fetchWorkday, phenom: fetchPhenom, "official-html": fetchOfficialHtml,
  eightfold: fetchEightfold, goldman: fetchGoldman, "static-careers": fetchStaticCareers, jibe: fetchJibe, talnet: fetchTalnet,
};

function emptyCounts() {
  return Object.fromEntries(REJECTIONS.map((key) => [key, 0]));
}

async function collect(firm) {
  const startedAt = new Date().toISOString();
  try {
    const scan = firm.adapter === "rbc"
      ? await fetchRbcCapitalMarketsCanada()
      : await adapters[firm.adapter](firm.config, firm);
    const rawJobs = scan.jobs.map((job) => ({ ...job, firm }));
    return { firm, startedAt, endpoint: scan.endpoint, rawJobs, rawCount: scan.rawCount ?? rawJobs.length, error: null };
  } catch (error) {
    return { firm, startedAt, endpoint: null, rawJobs: [], rawCount: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

async function mapSources(items, concurrency, mapper) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await mapper(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

console.log(`BSO multi-firm collector dry run started at ${new Date().toISOString()}`);
console.log(`Sources: ${selected.map((firm) => firm.name).join(", ")}`);
const scans = await mapSources(selected, 3, collect);
const seen = new Set();
const qualified = [];
const plausible = [];
const sourceReports = [];
const totalRejections = emptyCounts();

for (const scan of scans) {
  const counts = emptyCounts();
  let canadian = 0;
  let accepted = 0;
  console.log(`\n=== ${scan.firm.name} (${scan.firm.provider}) ===`);
  if (scan.error) {
    counts.parsingSourceError += 1;
    totalRejections.parsingSourceError += 1;
    console.log(`[source-error] ${scan.error}`);
    sourceReports.push({ ...scan, canadian, accepted, rejected: 0, counts });
    continue;
  }
  console.log(`Endpoint: ${scan.endpoint}`);
  for (const candidate of scan.rawJobs) {
    let result;
    try {
      result = classifyAndNormalize(candidate, scan.startedAt);
    } catch (error) {
      counts.parsingSourceError += 1;
      totalRejections.parsingSourceError += 1;
      console.log(`[reject:parsingSourceError] ${candidate.title ?? "Unknown title"} | ${error.message}`);
      continue;
    }
    if (result.bucket !== "nonCanadian") canadian += 1;
    if (!result.accepted) {
      counts[result.bucket] += 1;
      totalRejections[result.bucket] += 1;
      console.log(`[reject:${result.bucket}] ${result.review.title} | ${result.review.location} | ${result.reason}`);
      if (result.plausible) plausible.push({ ...result.review, reason: result.reason });
      continue;
    }
    if (seen.has(result.job.source_record_id)) {
      counts.duplicate += 1;
      totalRejections.duplicate += 1;
      console.log(`[reject:duplicate] ${result.job.title} | ${result.job.location_display} | ${result.job.source_record_id}`);
      continue;
    }
    seen.add(result.job.source_record_id);
    accepted += 1;
    qualified.push({ ...result, firm: scan.firm });
    console.log("[qualified]");
    console.log(`  Company: ${result.job.company_name}`);
    console.log(`  Title: ${result.job.title}`);
    console.log(`  Location: ${result.job.location_display}`);
    console.log(`  Seniority: ${result.job.seniority}`);
    console.log(`  Program type: ${result.job.program_type}`);
    console.log(`  Requisition: ${result.job.external_job_id}`);
    console.log(`  Application: ${result.job.application_url}`);
    console.log(`  Reason: ${result.reason}`);
  }
  const rejected = Object.values(counts).reduce((sum, value) => sum + value, 0);
  sourceReports.push({ ...scan, canadian, accepted, rejected, counts });
}

console.log("\n\nSOURCE COVERAGE");
for (const report of sourceReports) {
  console.log(`${report.firm.name} | ${report.error ? "FAILED" : "reached"} | ${report.firm.provider} | raw=${report.rawCount} | Canadian=${report.canadian} | qualified=${report.accepted} | rejected=${report.rejected}${report.error ? ` | ${report.error}` : ""}`);
}

console.log("\nQUALIFIED ROLES BY FIRM");
for (const firm of selected) {
  const jobs = qualified.filter((result) => result.firm.key === firm.key);
  console.log(`\n${firm.name} (${jobs.length})`);
  for (const { job, reason } of jobs) console.log(`- ${job.title} | ${job.location_display} | ${job.seniority} | ${job.program_type} | ${job.external_job_id} | ${job.application_url} | ${reason}`);
}

console.log("\nSENIORITY BREAKDOWN");
for (const seniority of SENIORITIES) {
  const jobs = qualified.filter(({ job }) => job.seniority === seniority);
  console.log(`\n${seniority}: ${jobs.length}`);
  for (const { job } of jobs) console.log(`- ${job.company_name}: ${job.title} (${job.location_display})`);
}

console.log("\nREJECTION ANALYSIS");
for (const key of REJECTIONS) console.log(`${key}: ${totalRejections[key]}`);

console.log("\nMANUAL REVIEW FLAGS");
const flaggedQualified = qualified.filter((result) => result.reviewFlags.length);
console.log(`Qualified roles flagged: ${flaggedQualified.length}`);
for (const { job, reviewFlags } of flaggedQualified) console.log(`- ${job.company_name}: ${job.title} | ${reviewFlags.join(" ")}`);
console.log(`Plausible rejected roles: ${plausible.length}`);
for (const item of plausible) console.log(`- ${item.firm}: ${item.title} | ${item.location} | ${item.reason}`);

console.log("\nDRY-RUN SAFETY");
console.log("No Supabase client was imported. No inserts, updates, closures, or other database writes were attempted.");
