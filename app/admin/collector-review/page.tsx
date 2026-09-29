import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { rankJobs, type RankableJob } from "@/lib/jobs/ranking";
import { CollectorReview } from "./review-client";
import "./collector-review.css";
import "./ranking.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collector Review — Local BSO Tool",
  robots: { index: false, follow: false },
};

const REPORT_FILE = "dry-run-2026-09-29T02-31-18-723Z.json";
const ADDITIONS_FILE = "local-review-additions-2026-09-29.json";
const EXCLUSIONS_FILE = "local-review-exclusions-2026-09-29.json";
const REVIEW_DATA_FILE = "review-data-2026-09-29T02-31-18-723Z.json";

// The report is generated outside TypeScript and intentionally contains
// heterogeneous source payloads from many ATS providers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;
type RankingCandidate = RankableJob & { id?: string; reviewId: string | null; reviewState: string };

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function excerpt(value: unknown, limit = 950) {
  const normalized = text(value).replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, limit).trim()}…` : normalized;
}

function stableId(prefix: string, ...values: unknown[]) {
  const source = values.map((value) => text(value)).join("|");
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}-${(hash >>> 0).toString(36)}`;
}

function failureDetails(error: string, adapter: string) {
  if (/HTTP 403/i.test(error)) return { category: "HTTP BLOCKED", action: "Find an official structured feed or maintain a manual source until access is supported." };
  if (/HTTP 404/i.test(error)) return { category: "SOURCE NOT FOUND", action: "Verify the current careers URL and identify the employer's active ATS." };
  if (/fetch failed|network|timeout|ECONN/i.test(error)) return { category: "TEMPORARY NETWORK FAILURE", action: "Retry, then verify whether the host blocks automated requests." };
  if (/No public job records could be extracted/i.test(error)) {
    return adapter === "static-careers"
      ? { category: "NO STRUCTURED JOB FEED", action: "Inspect the public careers page and add a supported structured or static parser." }
      : { category: "CAREERS PAGE AVAILABLE BUT UNSUPPORTED", action: "Update or replace the adapter for the employer's current careers platform." };
  }
  return { category: "OTHER", action: "Inspect the source response and update the source configuration." };
}

function rawCandidate(report: AnyRecord, item: AnyRecord) {
  const firm = text(item.firm ?? item.job?.company_name ?? item.proposed?.company_name);
  const title = text(item.title ?? item.job?.title ?? item.proposed?.title);
  const source = report.sourceReports.find((entry: AnyRecord) => entry.firm?.name === firm);
  return source?.rawJobs?.find((candidate: AnyRecord) => candidate.title === title)
    ?? source?.rawJobs?.find((candidate: AnyRecord) => text(candidate.title).toLowerCase() === title.toLowerCase());
}

function toReviewItem(report: AnyRecord, item: AnyRecord, prefix: string) {
  const raw = rawCandidate(report, item);
  const job = item.job ?? item.proposed ?? {};
  const company = text(item.firm ?? job.company_name ?? raw?.firm?.name) || "Unknown company";
  const title = text(item.title ?? job.title ?? raw?.title) || "Unknown role";
  return {
    id: stableId(prefix, company, title, job.external_job_id, item.reason),
    company,
    title,
    location: text(item.location ?? job.location_display ?? raw?.locations?.join(" / ")) || "Location unavailable",
    careerPath: text(job.category),
    seniority: text(job.seniority),
    confidence: typeof item.confidence === "number" ? item.confidence : null,
    reason: text(item.reason) || "Manual review requested.",
    description: excerpt(job.description_text ?? job.summary ?? raw?.description),
    url: text(job.application_url ?? job.source_url ?? raw?.applicationUrl ?? raw?.sourceUrl),
    source: text(job.source_name ?? raw?.firm?.provider ?? raw?.firm?.name),
  };
}

async function loadReport() {
  const reportsDirectory = path.join(process.cwd(), "scripts", "job-collector", "reports");
  const [report, manualAdditions, manualExclusions, reviewData] = await Promise.all([
    readFile(path.join(reportsDirectory, REPORT_FILE), "utf8").then(JSON.parse),
    readFile(path.join(reportsDirectory, ADDITIONS_FILE), "utf8").then(JSON.parse),
    readFile(path.join(reportsDirectory, EXCLUSIONS_FILE), "utf8").then(JSON.parse),
    readFile(path.join(reportsDirectory, REVIEW_DATA_FILE), "utf8").then(JSON.parse),
  ]);

  const proposedNewJobs = [...report.reconciliation.newJobs, ...manualAdditions].map((item: AnyRecord) => ({
    id: stableId("new", item.job.company_id, item.job.external_job_id, item.job.source_record_id),
    company: item.job.company_name,
    title: item.job.title,
    location: item.job.location_display,
    careerPath: item.job.category,
    specialization: item.job.specialization,
    seniority: item.job.seniority,
    programType: item.job.program_type,
    datePosted: item.job.date_posted,
    source: item.job.source_name,
    confidence: item.confidence ?? null,
    reason: item.reason,
    description: excerpt(item.job.description_text ?? item.job.summary),
    url: item.job.application_url ?? item.job.source_url,
    requisition: item.job.external_job_id,
    origin: item.origin,
    exclusive: Boolean(item.exclusive),
  }));
  const excludedCpaJobs = proposedNewJobs.filter((job: AnyRecord) => /\bCPA\b/i.test(job.title));
  const newJobs = proposedNewJobs.filter((job: AnyRecord) => !/\bCPA\b/i.test(job.title));

  const rankingDate = text(report.generatedAt).slice(0, 10);
  const rankingCandidates: RankingCandidate[] = [
    ...report.snapshot.jobs
      .filter((job: AnyRecord) => job.status === "active" && (!job.application_deadline || job.application_deadline >= rankingDate))
      .map((job: AnyRecord) => ({ ...job, reviewState: "Production active", reviewId: null }) as RankingCandidate),
    ...[...report.reconciliation.newJobs, ...manualAdditions]
      .filter((item: AnyRecord) => !/\bCPA\b/i.test(item.job?.title ?? ""))
      .map((item: AnyRecord) => ({
        ...item.job,
        origin: item.origin,
        exclusive: Boolean(item.exclusive),
        reviewState: "Proposed — not approved",
        reviewId: stableId("new", item.job.company_id, item.job.external_job_id, item.job.source_record_id),
      }) as RankingCandidate),
  ];
  const uniqueRankingCandidates = [...new Map<string, RankingCandidate>(rankingCandidates.map((job) => [`${text((job as AnyRecord).company_id)}|${job.external_job_id}`, job])).values()];
  const ranking = rankJobs(uniqueRankingCandidates, { today: rankingDate, diversity: true }).map((item) => ({
    rank: item.rank,
    id: item.job.id ?? `${item.job.company_name}:${item.job.external_job_id}`,
    reviewId: item.job.reviewId,
    reviewState: item.job.reviewState,
    company: item.job.company_name,
    title: item.job.title,
    location: item.job.location_display,
    careerPath: item.job.category,
    seniority: item.job.seniority,
    datePosted: item.job.date_posted ?? null,
    score: item.score,
    baseScore: item.baseScore,
    band: item.band,
    components: item.components,
    why: item.why,
  }));
  const previewRole = (company: RegExp, title?: RegExp) => ranking.find((item) => company.test(item.company) && (!title || title.test(item.title))) ?? null;
  const compactPreview = (items: Array<(typeof ranking)[number] | null>) => items.filter((item): item is (typeof ranking)[number] => item !== null);
  const editorialPreview = {
    featured: compactPreview([
      previewRole(/^Anson Funds$/i, /^Investment Analyst$/i),
      previewRole(/^Brookfield Asset Management$/i, /Investment Associate, Private Equity/i),
      previewRole(/^Rothschild & Co\.?$/i, /Metals & Mining, Junior Associate/i),
    ]),
    trending: compactPreview([
      previewRole(/^Point72$/i, /Entry-Level Quantitative Researcher/i),
      previewRole(/^BCI$/i, /Private Equity.*Consumer and TMT/i),
      previewRole(/^Ontario Teachers/i, /Private Capital - Financial Services/i),
      previewRole(/^J\.P\. Morgan$/i, /Investment Banking Analyst - Natural Resources/i),
      previewRole(/^Morgan Stanley$/i, /Canada Investment Banking Analyst/i),
      previewRole(/^Mizuho \/ Greenhill$/i, /Investment Banking M&A Associate/i),
    ]),
  };

  const updates = report.reconciliation.updated.map((item: AnyRecord) => ({
    id: stableId("update", item.current.id, item.proposed?.job?.external_job_id),
    company: item.proposed.job.company_name,
    title: item.proposed.job.title,
    location: item.proposed.job.location_display,
    reason: item.proposed.reason,
    confidence: item.proposed.confidence ?? null,
    url: item.proposed.job.application_url ?? item.proposed.job.source_url,
    changes: item.changes,
  }));

  const reopening = report.reconciliation.reopenReview.map((item: AnyRecord) => ({
    ...toReviewItem(report, { ...item, job: item.job }, "reopen"),
    proposedStatus: item.proposed?.status ?? "active",
    currentStatus: item.job?.status ?? "closed",
  }));
  const reopeningKeys = new Set(report.reconciliation.reopenReview.map((item: AnyRecord) =>
    text(item.job?.id ?? item.job?.external_job_id ?? item.job?.source_record_id),
  ).filter(Boolean));
  const manualReviewItems = report.manualReview.filter((item: AnyRecord) => {
    const key = text(item.job?.id ?? item.job?.external_job_id ?? item.job?.source_record_id);
    return !key || !reopeningKeys.has(key);
  });

  const manualCounts = new Map<string, number>();
  for (const item of manualReviewItems) {
    const company = text(item.firm ?? item.job?.company_name);
    manualCounts.set(company, (manualCounts.get(company) ?? 0) + 1);
  }
  const sources = report.sourceReports.map((item: AnyRecord) => {
    const error = text(item.error);
    const failure = failureDetails(error, text(item.firm.adapter));
    const attempts = item.firm.config?.searchUrls ?? item.firm.config?.pageUrls ?? [];
    const rejected = Object.entries(item.counts ?? {}).reduce((sum, [key, value]) => key === "parsingSourceError" || key === "duplicate" ? sum : sum + Number(value), 0);
    return {
      company: item.firm.name,
      source: item.firm.provider,
      sourceType: item.firm.adapter,
      careersUrl: item.firm.careersUrl,
      endpoint: item.endpoint ?? item.firm.careersUrl,
      success: !item.error,
      status: item.error ? "failed" : item.rawCount === 0 ? "success-zero" : "success",
      scanned: item.rawCount,
      canadian: item.canadian,
      qualifying: item.accepted,
      rejected,
      manualReview: manualCounts.get(item.firm.name) ?? 0,
      notes: item.error ?? (item.rawCount === 0 ? "Reached source successfully; no job records were available." : "Healthy"),
      failureCategory: item.error ? failure.category : null,
      httpStatus: error.match(/HTTP\s+(\d{3})/i)?.[1] ?? null,
      alternativeAttempted: attempts.length > 1,
      lastAttempted: item.startedAt,
      lastSuccessful: item.error ? null : item.startedAt,
      recommendedAction: item.error ? failure.action : null,
    };
  });

  return {
    generatedAt: report.generatedAt,
    reportFile: REPORT_FILE,
    manualAdditions: manualAdditions.length,
    excludedCpaJobs: excludedCpaJobs.length,
    newJobs,
    ranking,
    editorialPreview,
    updates,
    rejected: [...manualExclusions, ...reviewData.rejected],
    rejectionTotals: report.rejectionTotals,
    manualReview: manualReviewItems.map((item: AnyRecord) => toReviewItem(report, item, "review")),
    reopening,
    duplicates: report.duplicates.map((item: AnyRecord) => toReviewItem(report, item, "duplicate")),
    sources,
  };
}

export default async function CollectorReviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const report = await loadReport();
  return <CollectorReview report={report} />;
}
