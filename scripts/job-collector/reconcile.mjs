import { canonicalCompanyId, normalizedCompanyName } from "./normalization/companies.mjs";

const TRACKING = /^(?:utm_[^=]+|source|src|gh_src|feedId|campaign|ref)$/i;
const COMPARE_FIELDS = ["company_name", "title", "location_display", "city", "province", "country", "category", "specialization", "seniority", "employment_type", "program_type", "date_posted", "application_deadline", "application_url", "source_url", "status"];

function canonicalUrl(value = "") {
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) if (TRACKING.test(key)) url.searchParams.delete(key);
    url.hash = "";
    url.pathname = url.pathname.replace(/^\/en-(?:US|CA)(?=\/)/i, "");
    return url.href.replace(/\/$/, "");
  } catch { return String(value).trim(); }
}

function normalizedText(value = "") {
  return String(value).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
}

function composite(job) {
  return [normalizedCompanyName(job.company_name), normalizedText(job.title), normalizedText(job.location_display)].join("|");
}

function indexExisting(existing) {
  const indexes = { identity: new Map(), record: new Map(), url: new Map(), composite: new Map() };
  for (const job of existing) {
    indexes.identity.set(`${job.company_id}|${job.external_job_id}`, job);
    if (job.source_record_id) indexes.record.set(job.source_record_id, job);
    for (const url of [job.source_url, job.application_url]) if (url) indexes.url.set(canonicalUrl(url), job);
    indexes.composite.set(composite(job), job);
  }
  return indexes;
}

function findExisting(job, indexes) {
  return indexes.identity.get(`${job.company_id}|${job.external_job_id}`)
    ?? indexes.record.get(job.source_record_id)
    ?? indexes.url.get(canonicalUrl(job.source_url))
    ?? indexes.url.get(canonicalUrl(job.application_url))
    ?? indexes.composite.get(composite(job));
}

function changes(existing, proposed) {
  return COMPARE_FIELDS.flatMap((field) => {
    const before = existing[field] ?? null;
    const after = proposed[field] ?? null;
    return JSON.stringify(before) === JSON.stringify(after) ? [] : [{ field, existing: before, proposed: after }];
  });
}

export function deduplicateProposals(items) {
  const chosen = new Map();
  const duplicates = [];
  for (const item of items) {
    const job = item.job ?? item;
    const keys = [
      `${job.company_id}|${job.external_job_id}`,
      canonicalUrl(job.source_url),
      composite(job),
    ].filter(Boolean);
    const match = keys.map((key) => chosen.get(key)).find(Boolean);
    if (match) {
      const currentIsWorkbook = /curated workbook/i.test(match.job.source_name ?? "");
      const incomingIsOfficial = !/curated workbook/i.test(job.source_name ?? "");
      if (currentIsWorkbook && incomingIsOfficial) {
        duplicates.push(match);
        for (const [key, value] of chosen) if (value === match) chosen.delete(key);
      } else {
        duplicates.push(item);
        continue;
      }
    }
    for (const key of keys) chosen.set(key, item);
  }
  return { unique: [...new Set(chosen.values())], duplicates };
}

export function reconcile(items, existingJobs, scans) {
  const indexes = indexExisting(existingJobs);
  const result = { newJobs: [], updated: [], unchanged: [], closed: [], ambiguousClosures: [], reopenReview: [] };
  const matchedIds = new Set();
  for (const item of items) {
    const current = findExisting(item.job, indexes);
    if (!current) result.newJobs.push(item);
    else {
      matchedIds.add(current.id);
      const delta = changes(current, item.job);
      if (current.status === "closed" && item.job.status === "active") {
        result.reopenReview.push({ job: current, proposed: item.job, reason: "Candidate matches a closed database record; reopening requires explicit human approval." });
      }
      else if (delta.length) result.updated.push({ current, proposed: item, changes: delta });
      else result.unchanged.push({ current, proposed: item });
    }
  }

  const completeKeys = new Set(scans.filter((scan) => !scan.error && scan.rawCount > 0 && ["workday", "rbc", "phenom", "eightfold", "goldman"].includes(scan.firm.adapter)).map((scan) => scan.firm.key));
  const companyIds = new Map(scans.map((scan) => [canonicalCompanyId(scan.firm), scan.firm.key]));
  for (const job of existingJobs.filter((row) => row.status === "active" && !matchedIds.has(row.id))) {
    const firmKey = companyIds.get(job.company_id);
    if (!firmKey || !completeKeys.has(firmKey)) continue;
    if (/curated workbook|manual|employer|exclusive/i.test(`${job.source_name} ${job.data_quality_notes}`)) {
      result.ambiguousClosures.push({ job, reason: "Protected manual/employer-supplied record; never auto-close." });
      continue;
    }
    result.closed.push({ job, reason: "Absent from a completed authoritative structured-source scan." });
  }
  return result;
}
