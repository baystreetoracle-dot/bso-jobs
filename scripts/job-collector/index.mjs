import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fetchEightfold } from "./adapters/eightfold.mjs";
import { fetchGoldman } from "./adapters/goldman.mjs";
import { fetchOfficialHtml } from "./adapters/official-html.mjs";
import { fetchPhenom } from "./adapters/phenom.mjs";
import { fetchStaticCareers } from "./adapters/static-careers.mjs";
import { fetchJibe } from "./adapters/jibe.mjs";
import { fetchTalnet } from "./adapters/talnet.mjs";
import { fetchWorkday } from "./adapters/workday.mjs";
import { classifyAndNormalize } from "./normalize.mjs";
import { deduplicateProposals, reconcile } from "./reconcile.mjs";
import { FIRMS, FIRMS_BY_KEY, INVESTMENT_BANKING_FIRMS } from "./sources/firms.mjs";
import { fetchRbcCapitalMarketsCanada } from "./sources/rbc.mjs";
import { readSupabaseSnapshot } from "./supabase-readonly.mjs";
import { readWorkbook } from "./workbook.mjs";

const REJECTION_KEYS = ["nonCanadian", "notInvestmentBanking", "corporateBanking", "markets", "research", "riskCompliance", "technologyData", "operationsSupport", "accountingFinance", "clientCommercial", "esg", "notFrontOfficeInvestment", "ambiguous", "duplicate", "parsingSourceError"];
const args = new Set(process.argv.slice(2));
if (!args.has("--dry-run")) throw new Error("This collector is dry-run-only. Pass --dry-run; no database write mode exists.");
if ([...args].some((arg) => /--write|--apply|--publish|--deploy/i.test(arg))) throw new Error("Write, publish and deployment modes are intentionally unavailable.");

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = raw.match(/^\s*([^#=]+)=(.*)$/);
    if (match && process.env[match[1].trim()] === undefined) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}
loadEnv(resolve(".env.local"));

const sourceArg = [...args].find((arg) => arg.startsWith("--source="))?.split("=", 2)[1] ?? "all";
const workbookArg = [...args].find((arg) => arg.startsWith("--workbook="))?.slice("--workbook=".length)
  ?? "C:/Users/thoma/Downloads/BSO NEWS/BSO Job Board Test.xlsx";
const selected = sourceArg === "all" ? FIRMS
  : sourceArg === "investment-banking" ? INVESTMENT_BANKING_FIRMS
    : sourceArg === "buy-side" ? FIRMS.filter((firm) => firm.universe === "buy-side")
      : sourceArg === "canadian-independent" ? FIRMS.filter((firm) => firm.cohort === "canadian-independent")
        : [FIRMS_BY_KEY.get(sourceArg)].filter(Boolean);
if (!selected.length) throw new Error(`Unknown source '${sourceArg}'.`);

const adapters = {
  workday: fetchWorkday, phenom: fetchPhenom, "official-html": fetchOfficialHtml,
  eightfold: fetchEightfold, goldman: fetchGoldman, "static-careers": fetchStaticCareers,
  jibe: fetchJibe, talnet: fetchTalnet,
};

function emptyCounts() { return Object.fromEntries(REJECTION_KEYS.map((key) => [key, 0])); }

async function collect(firm) {
  const startedAt = new Date().toISOString();
  try {
    const scan = firm.adapter === "rbc" ? await fetchRbcCapitalMarketsCanada() : await adapters[firm.adapter](firm.config, firm);
    const rawJobs = scan.jobs.map((job) => ({ ...job, firm }));
    return { firm, startedAt, endpoint: scan.endpoint, rawJobs, rawCount: scan.rawCount ?? rawJobs.length, error: null };
  } catch (error) {
    return { firm, startedAt, endpoint: null, rawJobs: [], rawCount: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

async function mapSources(items, concurrency, mapper) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() { while (next < items.length) { const index = next++; results[index] = await mapper(items[index]); } }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function workbookMismatch(candidate) {
  const declared = candidate.workbookDeclaredCompany;
  const comparableCompany = (value) => String(value).toLowerCase().replace(/[’']/g, "").replace(/\b(?:board|inc|ltd|limited|corp|corporation)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
  const firmName = comparableCompany(candidate.firm.name);
  const declaredName = comparableCompany(declared);
  if (declared && !firmName.includes(declaredName) && !declaredName.includes(firmName)) {
    return `Workbook row ${candidate.workbookRow} labels the company as ${candidate.firm.name}, but the pasted description identifies ${declared}.`;
  }
  if (!candidate.sourceUrl) return `Workbook row ${candidate.workbookRow} has no authoritative application URL.`;
  return null;
}

function markdownReport(context) {
  const { generatedAt, sourceReports, reconciliation, rejectedExamples, rejectionTotals, manualReview, workbook, snapshot, duplicates } = context;
  const lines = ["# BSO high-finance collector dry run", "", `Generated: ${generatedAt}`, "", "> Read-only run. No Supabase writes, status changes, schema changes, deployments, merges or publishing were attempted.", ""];
  const jobsSection = (title, rows, formatter) => {
    lines.push(`## ${title}`, "", `Count: ${rows.length}`, "");
    for (const row of rows) lines.push(formatter(row), "");
  };
  jobsSection("NEW JOBS TO ADD", reconciliation.newJobs, ({ job, reason, confidence }) => `- **${job.company_name} — ${job.title}**\n  - Location: ${job.location_display}\n  - Career path: ${job.category}${job.specialization ? ` / ${job.specialization}` : ""}\n  - Seniority: ${job.seniority}\n  - Requisition: ${job.external_job_id}\n  - Source: ${job.source_name}\n  - Application: ${job.application_url || "Unavailable"}\n  - Why: ${reason}\n  - Confidence: ${confidence ?? "manual seed"}`);
  jobsSection("EXISTING JOBS TO UPDATE", reconciliation.updated, ({ current, proposed, changes }) => `- **${proposed.job.company_name} — ${proposed.job.title}** (${current.id})\n${changes.map((change) => `  - ${change.field}: \`${JSON.stringify(change.existing)}\` → \`${JSON.stringify(change.proposed)}\``).join("\n")}\n  - Reason: matched existing record; authoritative metadata differs.`);
  jobsSection("JOBS PROPOSED TO CLOSE", reconciliation.closed, ({ job, reason }) => `- **${job.company_name} — ${job.title}** (${job.id})\n  - ${reason}`);
  jobsSection("AMBIGUOUS / MANUAL REVIEW", manualReview, (item) => `- **${item.firm ?? item.job?.company_name ?? "Unknown"} — ${item.title ?? item.job?.title ?? "Unknown"}**\n  - ${item.reason}`);

  lines.push("## EXCLUDED JOBS", "", ...Object.entries(rejectionTotals).map(([key, count]) => `- ${key}: ${count}`), "");
  for (const report of sourceReports) {
    const examples = rejectedExamples.filter((item) => item.firm === report.firm.name).slice(0, 3);
    if (!examples.length) continue;
    lines.push(`### ${report.firm.name}`, "", ...examples.map((item) => `- ${item.title} — ${item.reason}`), "");
  }

  lines.push("## SOURCE HEALTH", "", "| Company | Provider | Reached | Scanned | Canadian | Qualified | Errors / notes |", "|---|---|---:|---:|---:|---:|---|");
  for (const report of sourceReports) lines.push(`| ${report.firm.name.replace(/\|/g, "/")} | ${report.firm.provider} | ${report.error ? "No" : "Yes"} | ${report.rawCount} | ${report.canadian} | ${report.accepted} | ${(report.error ?? (report.rawCount ? "" : "Reached source but extracted zero job records.")).replace(/\|/g, "/")} |`);
  lines.push("", "## RECONCILIATION SUMMARY", "", `- Supabase readable: ${snapshot.available ? "yes" : `no (${snapshot.error})`}`, `- Existing jobs compared: ${snapshot.jobs.length}`, `- Workbook IB records: ${workbook.investmentBanking.length}`, `- Workbook buy-side rows: ${workbook.buySide.length}`, `- Within-run duplicates suppressed: ${duplicates.length}`, `- Unchanged existing jobs: ${reconciliation.unchanged.length}`, `- Protected closure/manual closure flags: ${reconciliation.ambiguousClosures.length}`, "");
  lines.push("## SAFETY", "", "This command has no write path. The Supabase module used by this run exposes SELECT operations only. Closure items above are proposals, not database changes.", "");
  return lines.join("\n");
}

const generatedAt = new Date().toISOString();
console.log(`BSO unified high-finance dry run started at ${generatedAt}`);
console.log(`Sources selected: ${selected.length}; workbook: ${workbookArg}`);
const [scans, snapshot] = await Promise.all([mapSources(selected, 4, collect), readSupabaseSnapshot()]);

let workbook = { investmentBanking: [], buySide: [], buySideCandidates: [], unknownCompanies: [], investmentBankingDuplicateRows: [] };
try { workbook = readWorkbook(workbookArg); } catch (error) { console.warn(`Workbook unavailable: ${error.message}`); }

const qualified = [];
const manualReview = [];
const rejectedExamples = [];
const rejectedJobs = [];
const rejectionTotals = emptyCounts();
const sourceReports = [];

for (const scan of scans) {
  const counts = emptyCounts();
  let canadian = 0;
  let accepted = 0;
  if (scan.error) {
    counts.parsingSourceError += 1; rejectionTotals.parsingSourceError += 1;
    sourceReports.push({ ...scan, canadian, accepted, counts });
    continue;
  }
  for (const candidate of scan.rawJobs) {
    try {
      const result = classifyAndNormalize(candidate, scan.startedAt);
      if (result.bucket !== "nonCanadian") canadian += 1;
      if (result.accepted) { accepted += 1; qualified.push({ ...result, origin: "collector", firm: scan.firm }); }
      else {
        const bucket = result.bucket in counts ? result.bucket : "ambiguous";
        counts[bucket] += 1; rejectionTotals[bucket] += 1;
        const rejected = { ...result.review, reason: result.reason, bucket };
        rejectedJobs.push(rejected);
        if (rejectedExamples.filter((item) => item.firm === scan.firm.name).length < 5) rejectedExamples.push(rejected);
        if (bucket === "ambiguous" || (result.plausible && ["notInvestmentBanking", "notFrontOfficeInvestment"].includes(bucket))) manualReview.push(rejected);
      }
    } catch (error) {
      counts.parsingSourceError += 1; rejectionTotals.parsingSourceError += 1;
      rejectedExamples.push({ firm: scan.firm.name, title: candidate.title ?? "Unknown", reason: error.message, bucket: "parsingSourceError" });
      rejectedJobs.push({ firm: scan.firm.name, title: candidate.title ?? "Unknown", reason: error.message, bucket: "parsingSourceError" });
    }
  }
  sourceReports.push({ ...scan, canadian, accepted, counts });
}

if (sourceArg === "all" || sourceArg === "buy-side") {
  for (const candidate of workbook.buySideCandidates) {
    const mismatch = workbookMismatch(candidate);
    if (mismatch) { manualReview.push({ firm: candidate.firm.name, title: candidate.title, reason: mismatch }); continue; }
    const result = classifyAndNormalize(candidate, generatedAt);
    if (result.accepted) qualified.push({ ...result, origin: "workbook", firm: candidate.firm });
    else {
      const bucket = result.bucket in rejectionTotals ? result.bucket : "ambiguous";
      rejectionTotals[bucket] += 1;
      manualReview.push({ ...result.review, reason: `Workbook row ${candidate.workbookRow}: ${result.reason}` });
    }
  }
}

if (sourceArg === "all" || sourceArg === "investment-banking") {
  for (const job of workbook.investmentBanking) {
    if (job.status === "closed") {
      manualReview.push({ job, reason: "Workbook explicitly marks this record closed; it is retained only as prior-job deduplication evidence and is not proposed for insertion." });
      continue;
    }
    qualified.push({ job, reason: "Manually reviewed Investment Banking workbook record.", confidence: 1, reviewFlags: [], origin: "workbook", firm: { key: job.company_id, name: job.company_name } });
  }
}
for (const unknown of workbook.unknownCompanies) manualReview.push({ firm: unknown.company, title: `Workbook row ${unknown.row}`, reason: "Company is not mapped in the source registry." });

const closedWorkbookIdentities = new Set(workbook.investmentBanking.filter((job) => job.status === "closed").flatMap((job) => [
  `${job.company_id}|${job.external_job_id}`,
  job.source_url,
  job.application_url,
].filter(Boolean)));
const eligibleQualified = [];
for (const item of qualified) {
  const job = item.job;
  if (closedWorkbookIdentities.has(`${job.company_id}|${job.external_job_id}`) || closedWorkbookIdentities.has(job.source_url) || closedWorkbookIdentities.has(job.application_url)) {
    manualReview.push({ job, reason: "Live-source candidate matches a workbook record explicitly marked closed; reopening requires manual approval." });
  } else eligibleQualified.push(item);
}

const deduped = deduplicateProposals(eligibleQualified);
rejectionTotals.duplicate += deduped.duplicates.length;
const reconciliation = reconcile(deduped.unique, snapshot.jobs, scans);
manualReview.push(...reconciliation.ambiguousClosures.map(({ job, reason }) => ({ job, reason })));
manualReview.push(...reconciliation.reopenReview.map(({ job, reason }) => ({ job, reason })));

const reportContext = { generatedAt, sourceReports, reconciliation, rejectedExamples, rejectedJobs, rejectionTotals, manualReview, workbook: { investmentBanking: workbook.investmentBanking, buySide: workbook.buySide }, snapshot: { ...snapshot, jobs: snapshot.jobs, companies: snapshot.companies }, duplicates: deduped.duplicates };
const report = markdownReport(reportContext);
const reportDir = resolve("scripts/job-collector/reports");
mkdirSync(reportDir, { recursive: true });
const reportPath = resolve(reportDir, `dry-run-${generatedAt.replace(/[:.]/g, "-")}.md`);
const jsonPath = reportPath.replace(/\.md$/, ".json");
writeFileSync(reportPath, report, "utf8");
writeFileSync(jsonPath, JSON.stringify(reportContext, null, 2), "utf8");

console.log("\nDRY-RUN SUMMARY");
console.log(`Sources: reached=${sourceReports.filter((item) => !item.error).length}, failed=${sourceReports.filter((item) => item.error).length}`);
console.log(`Proposals: new=${reconciliation.newJobs.length}, update=${reconciliation.updated.length}, close=${reconciliation.closed.length}, unchanged=${reconciliation.unchanged.length}`);
console.log(`Manual review=${manualReview.length}, excluded=${Object.values(rejectionTotals).reduce((sum, value) => sum + value, 0)}`);
console.log(`Report: ${reportPath}`);
console.log(`Machine-readable report: ${jsonPath}`);
console.log("No Supabase writes or deployment actions were attempted.");
