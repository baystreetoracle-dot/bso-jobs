import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const REPORT = "dry-run-2026-09-29T02-31-18-723Z.json";
const ADDITIONS = "local-review-additions-2026-09-29.json";
const OUTPUT = "20260929043000_publish_high_finance_jobs.sql";
const TODAY = "2026-09-29";

const reportsDirectory = path.join(process.cwd(), "scripts", "job-collector", "reports");
const [report, additions] = await Promise.all([
  readFile(path.join(reportsDirectory, REPORT), "utf8").then(JSON.parse),
  readFile(path.join(reportsDirectory, ADDITIONS), "utf8").then(JSON.parse),
]);

function cleanText(value = "") {
  return String(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>|<\/li>|<\/h\d>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const locationNames = new Map([
  ["toronto", "Toronto, ON"], ["toronto, on", "Toronto, ON"], ["toronto, ontario", "Toronto, ON"], ["toronto, ontario, canada", "Toronto, ON"], ["toronto, canada", "Toronto, ON"],
  ["calgary", "Calgary, AB"], ["calgary, ab", "Calgary, AB"], ["calgary, alberta", "Calgary, AB"], ["calgary, alberta, canada", "Calgary, AB"], ["calgary, canada", "Calgary, AB"],
  ["vancouver", "Vancouver, BC"], ["vancouver, bc", "Vancouver, BC"], ["vancouver, british columbia", "Vancouver, BC"], ["vancouver, british columbia, canada", "Vancouver, BC"], ["vancouver, canada", "Vancouver, BC"],
  ["montreal", "Montreal, QC"], ["montréal", "Montreal, QC"], ["montreal, qc", "Montreal, QC"], ["montréal, quebec", "Montreal, QC"], ["montréal, québec", "Montreal, QC"], ["montreal, canada", "Montreal, QC"],
  ["victoria", "Victoria, BC"], ["victoria, bc", "Victoria, BC"], ["victoria bc", "Victoria, BC"],
  ["edmonton", "Edmonton, AB"], ["edmonton, ab", "Edmonton, AB"], ["edmonton ab", "Edmonton, AB"], ["edmonton, alberta", "Edmonton, AB"],
  ["winnipeg", "Winnipeg, MB"], ["winnipeg, mb", "Winnipeg, MB"], ["winnipeg mb", "Winnipeg, MB"],
]);

function normalizeLocation(value = "") {
  const parts = String(value).split("/").map((part) => part.trim()).filter(Boolean);
  const normalized = parts.map((part) => {
    const stripped = part.replace(/\s+-\s+.+$/, "").replace(/,?\s*Canada$/i, "").trim();
    const key = stripped.toLocaleLowerCase("en-CA");
    return locationNames.get(key)
      ?? stripped.replace(/,\s*Ontario$/i, ", ON").replace(/,\s*Alberta$/i, ", AB").replace(/,\s*Quebec$/i, ", QC").replace(/,\s*British Columbia$/i, ", BC");
  });
  return [...new Set(normalized)].join(" / ") || "Canada";
}

function locationParts(display, existingCity, existingProvince) {
  const first = display.split(" / ")[0];
  const match = first.match(/^(.+?),\s*(ON|QC|BC|AB|MB|NS|NB|SK|NL|PE)$/i);
  return {
    city: match?.[1] ?? (existingCity ? String(existingCity).toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : null),
    province: match?.[2]?.toUpperCase() ?? existingProvince ?? null,
  };
}

function normalizeEmployment(value) {
  if (!value) return null;
  if (/full[ -]?time|regular/i.test(value)) return "Full-time";
  if (/part[ -]?time/i.test(value)) return "Part-time";
  if (/contract|temporary|fixed term/i.test(value)) return "Contract";
  return value;
}

function normalizeProgram(value) {
  if (!value || /^unspecified$/i.test(value)) return null;
  if (/co-?op/i.test(value)) return "Co-op";
  if (/intern/i.test(value)) return "Internship";
  if (/new grad/i.test(value)) return "New Graduate Program";
  if (/full[ -]?time/i.test(value)) return "Full-time";
  if (/contract/i.test(value)) return "Contract";
  return value;
}

function rawExternalId(raw) {
  return String(raw?.externalId ?? raw?.listing?.reqId ?? raw?.listing?.jobId ?? raw?.requisitionId ?? raw?.id ?? "");
}

function rawDescription(raw) {
  return cleanText(raw?.description ?? raw?.detail?.structureData?.description ?? raw?.detail?.jobDescription ?? raw?.listing?.descriptionTeaser ?? "");
}

function findRaw(item) {
  const source = report.sourceReports.find((entry) => entry.firm.key === item.firm?.key)
    ?? report.sourceReports.find((entry) => entry.firm.name === item.job.company_name);
  if (!source) return null;
  return source.rawJobs.find((raw) => rawExternalId(raw) === String(item.job.external_job_id))
    ?? source.rawJobs.find((raw) => String(raw.title ?? raw.listing?.title ?? "").trim().toLowerCase() === item.job.title.trim().toLowerCase())
    ?? null;
}

function salaryFrom(description) {
  const lines = description.split(/\n|\.(?=\s+[A-Z])/).filter((line) => /salary|compensation|base pay|pay range/i.test(line));
  for (const line of lines) {
    const range = line.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(?:-|–|—|to)\s*\$?\s*([\d,]+(?:\.\d+)?)/i);
    const single = line.match(/\$\s*([\d,]+(?:\.\d+)?)/);
    if (!range && !single) continue;
    let minimum = Number((range?.[1] ?? single?.[1] ?? "").replace(/,/g, ""));
    let maximum = range ? Number(range[2].replace(/,/g, "")) : null;
    if (!Number.isFinite(minimum) || minimum <= 0 || (maximum !== null && maximum < minimum)) continue;
    const biweekly = /bi[ -]?weekly/i.test(line);
    if (biweekly) {
      minimum *= 26;
      if (maximum !== null) maximum *= 26;
    }
    const annual = biweekly || /annual|annualized|per year|yearly/i.test(line);
    const hourly = !annual && /per hour|hourly|\/\s*hour/i.test(line);
    return { salary_min: minimum, salary_max: maximum, salary_currency: "CAD", salary_period: hourly ? "hour" : "year" };
  }
  return {};
}

function conciseSummary(job) {
  const level = job.seniority && job.seniority !== "Unspecified" ? `${job.seniority} ` : "";
  const program = job.program_type && !["Full-time", "Unspecified"].includes(job.program_type) ? `${job.program_type} ` : "";
  const focus = job.specialization ? ` focused on ${job.specialization}` : "";
  return `${program}${level}${job.category} opportunity with ${job.company_name} in ${job.location_display}${focus}.`.replace(/\s+/g, " ");
}

const proposals = [...report.reconciliation.newJobs, ...additions]
  .filter((item) => !/\bCPA\b/i.test(item.job.title))
  .filter((item) => !item.job.application_deadline || String(item.job.application_deadline).slice(0, 10) >= TODAY);

const jobs = proposals.map((item) => {
  const raw = findRaw(item);
  const description = cleanText(item.job.description_text) || rawDescription(raw);
  const location_display = normalizeLocation(item.job.location_display);
  const location = locationParts(location_display, item.job.city, item.job.province);
  const normalized = {
    ...item.job,
    location_display,
    ...location,
    employment_type: normalizeEmployment(item.job.employment_type),
    program_type: normalizeProgram(item.job.program_type),
    date_posted: item.job.date_posted ? String(item.job.date_posted).slice(0, 10) : null,
    application_deadline: item.job.application_deadline ? String(item.job.application_deadline).slice(0, 10) : null,
    summary: "",
    description_text: description || null,
    description_status: description.length >= 400 ? "verified" : description ? "partial" : "missing",
    description_verified_at: description.length >= 400 ? report.generatedAt : null,
    status: "active",
    last_verified_at: report.generatedAt,
    updated_at: report.generatedAt,
  };
  normalized.summary = item.origin === "bso-exclusive" || item.origin?.startsWith("user-supplied") || item.origin === "curated-workbook"
    ? item.job.summary
    : conciseSummary(normalized);
  if (normalized.salary_min == null) Object.assign(normalized, salaryFrom(description));
  return normalized;
});

const companyTypes = {
  "Investment Banking": "Investment Bank",
  "Private Equity": "Private Equity",
  "Private Credit": "Private Credit",
  "Institutional Investing": "Institutional Investor",
  "Asset Management": "Asset Manager",
  "Real Estate Investing": "Real Estate Investor",
  "Hedge Fund": "Hedge Fund",
};
const companies = [...new Map(jobs.map((job) => [job.company_name, {
  company_id: job.company_id,
  name: job.company_name,
  company_type: companyTypes[job.category] ?? "Financial Services",
  headquarters_country: null,
  status: "active",
}])).values()];

const columns = [
  "external_job_id", "company_id", "company_name", "title", "location_display", "city", "province", "country",
  "workplace_type", "category", "specialization", "seniority", "employment_type", "program_type", "term_start", "term_end",
  "term_length_months", "date_posted", "application_deadline", "salary_min", "salary_max", "salary_currency", "salary_period",
  "application_url", "source_url", "source_name", "status", "summary", "description_text", "description_status",
  "description_verified_at", "source_record_id", "data_quality_notes", "last_verified_at", "updated_at",
];
const jobJson = jobs.map((job) => Object.fromEntries(columns.map((column) => [column, job[column] ?? null])));

const sql = `-- Publish the locally reviewed 2026-09-29 Canadian high-finance job set.
-- This migration adds new roles only. It does not reopen closed jobs, apply metadata diffs,
-- alter the schema, or change editorially controlled featured values on existing records.

WITH incoming AS (
  SELECT * FROM jsonb_to_recordset($companies$${JSON.stringify(companies)}$companies$::jsonb)
  AS company(company_id text, name text, company_type text, headquarters_country text, status text)
)
INSERT INTO public.companies (company_id, name, company_type, headquarters_country, status, updated_at)
SELECT company_id, name, company_type, headquarters_country, status, now()
FROM incoming
ON CONFLICT DO NOTHING;

WITH incoming AS (
  SELECT * FROM jsonb_to_recordset($jobs$${JSON.stringify(jobJson)}$jobs$::jsonb)
  AS job(
    external_job_id text, company_id text, company_name text, title text, location_display text, city text, province text,
    country text, workplace_type text, category text, specialization text, seniority text, employment_type text,
    program_type text, term_start text, term_end text, term_length_months integer, date_posted text,
    application_deadline text, salary_min numeric, salary_max numeric, salary_currency text, salary_period text,
    application_url text, source_url text, source_name text, status text, summary text, description_text text,
    description_status text, description_verified_at text, source_record_id text, data_quality_notes text,
    last_verified_at text, updated_at text
  )
)
INSERT INTO public.jobs (${columns.join(", ")})
SELECT
  job.external_job_id,
  COALESCE((SELECT company_id FROM public.companies WHERE name = job.company_name), job.company_id),
  job.company_name, job.title, job.location_display, job.city, job.province, job.country, job.workplace_type,
  job.category, job.specialization, job.seniority, job.employment_type, job.program_type,
  NULLIF(job.term_start, '')::date, NULLIF(job.term_end, '')::date, job.term_length_months,
  NULLIF(job.date_posted, '')::date, NULLIF(job.application_deadline, '')::date,
  job.salary_min, job.salary_max, job.salary_currency, job.salary_period,
  job.application_url, job.source_url, job.source_name, job.status, job.summary, job.description_text,
  job.description_status, NULLIF(job.description_verified_at, '')::timestamptz, job.source_record_id,
  job.data_quality_notes, NULLIF(job.last_verified_at, '')::timestamptz, now()
FROM incoming AS job
ON CONFLICT (source_record_id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  title = EXCLUDED.title,
  location_display = EXCLUDED.location_display,
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  country = EXCLUDED.country,
  workplace_type = EXCLUDED.workplace_type,
  category = EXCLUDED.category,
  specialization = EXCLUDED.specialization,
  seniority = EXCLUDED.seniority,
  employment_type = EXCLUDED.employment_type,
  program_type = EXCLUDED.program_type,
  term_start = EXCLUDED.term_start,
  term_end = EXCLUDED.term_end,
  term_length_months = EXCLUDED.term_length_months,
  date_posted = EXCLUDED.date_posted,
  application_deadline = EXCLUDED.application_deadline,
  salary_min = EXCLUDED.salary_min,
  salary_max = EXCLUDED.salary_max,
  salary_currency = EXCLUDED.salary_currency,
  salary_period = EXCLUDED.salary_period,
  application_url = EXCLUDED.application_url,
  source_url = EXCLUDED.source_url,
  source_name = EXCLUDED.source_name,
  status = EXCLUDED.status,
  summary = EXCLUDED.summary,
  description_text = EXCLUDED.description_text,
  description_status = EXCLUDED.description_status,
  description_verified_at = EXCLUDED.description_verified_at,
  data_quality_notes = EXCLUDED.data_quality_notes,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();
`;

const outputPath = path.join(process.cwd(), "supabase", "migrations", OUTPUT);
await writeFile(outputPath, sql, "utf8");
console.log(JSON.stringify({ outputPath, jobs: jobs.length, companies: companies.length, verifiedDescriptions: jobs.filter((job) => job.description_status === "verified").length, salaryRows: jobs.filter((job) => job.salary_min != null).length }, null, 2));
