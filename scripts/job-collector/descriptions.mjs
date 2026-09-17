import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { decodeHtml, HEADERS } from "./adapters/shared.mjs";
import { VERIFIED_MANUAL_DESCRIPTIONS } from "./verified-manual-descriptions.mjs";

const args = new Set(process.argv.slice(2));
const writeMode = args.has("--write");
if (writeMode === args.has("--dry-run")) throw new Error("Pass exactly one of --dry-run or --write.");

function loadLocalEnv() {
  if (!fs.existsSync(".env.local")) return;
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match || process.env[match[1].trim()]) continue;
    process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

function normalizedText(value = "") {
  return decodeHtml(String(value))
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|div|section|article|h[1-6]|ul|ol)>/gi, "\n\n")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchResponse(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...HEADERS, ...options.headers },
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.text();
  return { response, body, finalUrl: response.url };
}

function workdayEndpoint(sourceUrl) {
  const url = new URL(sourceUrl);
  const segments = url.pathname.split("/").filter(Boolean);
  const jobIndex = segments.indexOf("job");
  if (jobIndex < 1) return null;
  const site = segments[jobIndex - 1];
  const tenant = url.hostname.split(".")[0];
  const path = segments.slice(jobIndex).join("/");
  return `${url.origin}/wday/cxs/${tenant}/${site}/${path}`;
}

function titleTokens(value) {
  return new Set(String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((token) => token.length > 2));
}

function titleMatch(expected, actual) {
  const left = titleTokens(expected);
  const right = titleTokens(actual);
  if (!left.size || !right.size) return false;
  const overlap = [...left].filter((token) => right.has(token)).length;
  return overlap / Math.min(left.size, right.size) >= 0.6;
}

function jsonLdJobs(html) {
  const records = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1]).trim());
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const value = queue.shift();
        if (!value || typeof value !== "object") continue;
        if (Array.isArray(value["@graph"])) queue.push(...value["@graph"]);
        if (value["@type"] === "JobPosting") records.push(value);
      }
    } catch {
      // Ignore malformed analytics blocks; never treat them as verified content.
    }
  }
  return records;
}

function extractElement(html, startPattern) {
  const match = startPattern.exec(html);
  startPattern.lastIndex = 0;
  if (!match) return "";
  const start = match.index;
  const opening = html.slice(start).match(/^<([a-z0-9-]+)\b[^>]*>/i);
  if (!opening) return "";
  const tag = opening[1].toLowerCase();
  const token = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
  token.lastIndex = start;
  let depth = 0;
  let current;
  while ((current = token.exec(html))) {
    if (/^<\//.test(current[0])) depth -= 1;
    else if (!/\/>$/.test(current[0])) depth += 1;
    if (depth === 0) return html.slice(start, token.lastIndex);
  }
  return "";
}

function balancedJsonAfter(html, marker) {
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return null;
  const start = html.indexOf("{", markerIndex + marker.length);
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < html.length; index += 1) {
    const character = html[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) return html.slice(start, index + 1);
  }
  return null;
}

function embeddedPhenom(html) {
  const raw = html.match(/phApp\.ddo\s*=\s*(\{[\s\S]*?\});\s*phApp\.experimentData/)?.[1];
  if (!raw) return null;
  try {
    const job = JSON.parse(raw)?.jobDetail?.data?.job;
    if (!job?.title || !(job.description ?? job.structureData?.description)) return null;
    return {
      title: normalizedText(job.title),
      description: normalizedText(job.description ?? job.structureData.description),
      externalId: String(job.jobId ?? job.reqId ?? ""),
      datePosted: job.structureData?.datePosted ?? null,
      deadline: job.postingEndDate ?? null,
      method: "Phenom structured job detail",
    };
  } catch {
    return null;
  }
}

async function extractWorkday(job) {
  const endpoint = workdayEndpoint(job.source_url);
  if (!endpoint) throw new Error("Could not derive the Workday public detail endpoint.");
  const { response, body } = await fetchResponse(endpoint, { headers: { accept: "application/json", "accept-language": "en-US,en;q=0.9", "user-agent": "Mozilla/5.0 (compatible; BSOJobs/1.0; +https://baystreetoracle.ca)" } });
  if (!response.ok) return { status: response.status === 404 ? "closed" : "error", error: `HTTP ${response.status}`, endpoint };
  const detail = JSON.parse(body)?.jobPostingInfo;
  if (!detail?.title || !detail?.jobDescription) return { status: "error", error: "Incomplete Workday detail payload.", endpoint };
  return {
    status: "verified",
    endpoint,
    title: normalizedText(detail.title),
    externalId: String(detail.jobReqId ?? ""),
    description: normalizedText(detail.jobDescription),
    datePosted: detail.startDate ?? null,
    deadline: detail.endDate ?? null,
    method: "Workday public JSON detail",
  };
}

async function extractOracle(job) {
  const url = new URL(job.source_url);
  const site = url.pathname.match(/\/sites\/([^/]+)\/job\//)?.[1];
  if (!site) return { status: "error", error: "Oracle site number was missing from the public URL." };
  const searchUrl = `${url.origin}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?finder=findReqs;siteNumber=${encodeURIComponent(site)},keyword=${encodeURIComponent(job.external_job_id)}&expand=requisitionList&onlyData=true`;
  const search = await fetchResponse(searchUrl, { headers: { accept: "application/json" } });
  if (!search.response.ok) return { status: "error", error: `Oracle search returned HTTP ${search.response.status}.`, endpoint: searchUrl };
  const rows = JSON.parse(search.body)?.items?.[0]?.requisitionList ?? [];
  const row = rows.find((item) => String(item.Id) === job.external_job_id) ?? rows[0];
  if (!row?.Id) return { status: "closed", error: "The requisition was not returned by the public Oracle search.", endpoint: searchUrl };
  const detailUrl = `${url.origin}/hcmRestApi/resources/latest/recruitingCEJobRequisitionDetails/${encodeURIComponent(row.Id)}?expand=all&onlyData=true`;
  const detailResponse = await fetchResponse(detailUrl, { headers: { accept: "application/json" } });
  if (!detailResponse.response.ok) return { status: "error", error: `Oracle detail returned HTTP ${detailResponse.response.status}.`, endpoint: detailUrl };
  const detail = JSON.parse(detailResponse.body);
  const description = [detail.ExternalDescriptionStr, detail.ExternalResponsibilitiesStr, detail.ExternalQualificationsStr]
    .filter(Boolean).map(normalizedText).filter((value, index, values) => values.indexOf(value) === index).join("\n\n");
  return {
    status: "verified", endpoint: detailUrl, title: normalizedText(detail.Title), externalId: String(detail.Id), description,
    datePosted: detail.ExternalPostedStartDate ?? row.PostedDate ?? null,
    deadline: detail.ExternalPostedEndDate ?? row.PostingEndDate ?? null,
    method: "Oracle public requisition detail",
  };
}

async function extractUkg(job) {
  const { response, body, finalUrl } = await fetchResponse(job.source_url);
  if (!response.ok) return { status: [404, 410].includes(response.status) ? "closed" : "error", error: `HTTP ${response.status}`, endpoint: finalUrl };
  const raw = balancedJsonAfter(body, "CandidateOpportunityDetail(");
  if (!raw) return { status: "closed", error: "UKG returned no public opportunity detail.", endpoint: finalUrl };
  const detail = JSON.parse(raw);
  return {
    status: "verified", endpoint: finalUrl, title: normalizedText(detail.Title), externalId: String(detail.RequisitionNumber ?? ""),
    description: normalizedText(detail.Description), datePosted: detail.PostedDate ?? null, deadline: detail.ClosingDate ?? null,
    method: "UKG public embedded opportunity detail",
  };
}

async function extractJibe(job) {
  const host = job.company_name === "Stifel Canada" ? "https://join.stifel.com" : null;
  if (!host) return extractHtml(job);
  const endpoint = `${host}/api/jobs?country=Canada`;
  const { response, body } = await fetchResponse(endpoint, { headers: { accept: "application/json", "accept-language": "en-US,en;q=0.9", "user-agent": "Mozilla/5.0 (compatible; BSOJobs/1.0; +https://baystreetoracle.ca)" } });
  if (!response.ok) return { status: "error", error: `Jibe returned HTTP ${response.status}.`, endpoint };
  const rows = JSON.parse(body)?.jobs ?? [];
  const expectedId = String(job.external_job_id).trim();
  const detail = rows.map((row) => row.data ?? row).find((row) => String(row.req_id ?? row.slug).trim() === expectedId);
  if (!detail) return { status: "closed", error: `The requisition was not returned by the employer's public Jibe feed (IDs: ${rows.map((row) => row.data ?? row).map((row) => row.req_id ?? row.slug).join(", ") || "none"}).`, endpoint };
  return {
    status: "verified", endpoint, title: normalizedText(detail.title), externalId: String(detail.req_id ?? detail.slug),
    description: normalizedText(detail.description), datePosted: detail.posted_date ?? null, deadline: null,
    method: "Employer Jibe public jobs feed",
  };
}

async function extractSapHtml(job) {
  const { response, body, finalUrl } = await fetchResponse(job.source_url);
  if (!response.ok) return { status: [404, 410].includes(response.status) ? "closed" : "error", error: `HTTP ${response.status}`, endpoint: finalUrl };
  const element = extractElement(body, /<(?:span|div)\b[^>]*(?:itemprop=["']description["']|class=["'][^"']*jobdescription[^"']*["'])[^>]*>/i);
  if (!element) return extractHtml(job);
  const title = normalizedText(body.match(/<meta\b[^>]*(?:property=["']og:title["']|name=["']twitter:title["'])[^>]*content=["']([^"']+)["']/i)?.[1]
    ?? body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? job.title);
  return {
    status: "verified", endpoint: finalUrl, title, externalId: job.external_job_id,
    description: normalizedText(element), datePosted: null, deadline: null,
    method: "Employer-rendered job description",
  };
}

async function extractHtml(job) {
  const { response, body, finalUrl } = await fetchResponse(job.source_url);
  if (!response.ok) return { status: [404, 410].includes(response.status) ? "closed" : "error", error: `HTTP ${response.status}`, endpoint: finalUrl };
  const phenom = embeddedPhenom(body);
  if (phenom) return { status: "verified", endpoint: finalUrl, ...phenom };
  const candidates = jsonLdJobs(body);
  const record = candidates.find((value) => titleMatch(job.title, value.title)) ?? candidates[0];
  if (record?.title && record?.description) {
    const identifier = typeof record.identifier === "object" ? record.identifier?.value : record.identifier;
    return {
      status: "verified",
      endpoint: finalUrl,
      title: normalizedText(record.title),
      externalId: String(identifier ?? ""),
      description: normalizedText(record.description),
      datePosted: record.datePosted ?? null,
      deadline: record.validThrough ?? null,
      method: "Employer JobPosting structured data",
    };
  }
  const pageTitle = normalizedText(body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  return {
    status: "partial",
    endpoint: finalUrl,
    title: pageTitle,
    description: "",
    error: "The public page did not expose a complete structured description.",
    method: "HTML identity check only",
  };
}

async function auditJob(job) {
  let extracted;
  try {
    if (job.external_job_id === "R_1509729") {
      return { ...job, status: "closed", error: "TD's public employer page states that this posting has expired.", method: "Manual employer-page verification" };
    }
    const manual = VERIFIED_MANUAL_DESCRIPTIONS.get(job.external_job_id);
    if (manual) {
      extracted = {
        status: "verified", title: manual.title, externalId: manual.externalId ?? job.external_job_id,
        description: manual.description, endpoint: manual.sourceUrl ?? job.source_url,
        method: "Manual employer-page/PDF verification", sourceCorrection: manual.sourceUrl ?? null,
        externalIdCorrection: manual.externalId ?? null,
      };
    } else if (/\.pdf(?:$|\?)/i.test(job.source_url)) {
      return { ...job, status: "manual-pdf", error: "PDF requires text extraction and visual verification." };
    } else extracted = /\.myworkdayjobs\.com/i.test(job.source_url)
      ? await extractWorkday(job)
      : /\.fa\.(?:us\d\.)?oraclecloud\.com/i.test(job.source_url)
        ? await extractOracle(job)
        : /recruiting\d*\.ultipro\.(?:ca|com)/i.test(job.source_url)
          ? await extractUkg(job)
          : job.company_name === "Stifel Canada"
            ? await extractJibe(job)
            : /careers\.(?:deloitte\.ca|ey\.com)|jobs\.scotiabank\.com/i.test(job.source_url)
              ? await extractSapHtml(job)
              : await extractHtml(job);
  } catch (error) {
    return { ...job, status: "error", error: error instanceof Error ? error.message : String(error) };
  }
  const titleVerified = extracted.title ? titleMatch(job.title, extracted.title) : false;
  const idVerified = !extracted.externalId
    || extracted.externalId === job.external_job_id
    || extracted.endpoint?.includes(job.external_job_id)
    || job.source_url.includes(job.external_job_id)
    || Boolean(extracted.externalIdCorrection);
  const complete = (extracted.description?.length ?? 0) >= 500;
  const status = extracted.status === "verified" && titleVerified && idVerified && complete
    ? "verified"
    : extracted.status === "closed"
      ? "closed"
      : extracted.status === "error"
        ? "error"
        : "review";
  return { ...job, ...extracted, status, titleVerified, idVerified, complete, descriptionLength: extracted.description?.length ?? 0 };
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const output = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      output[index] = await mapper(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return output;
}

loadLocalEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Public Supabase environment variables are required for the read-only audit.");

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await client
  .from("jobs")
  .select("id,external_job_id,company_id,company_name,title,source_url,application_url,date_posted,application_deadline,source_record_id,data_quality_notes")
  .eq("status", "active")
  .order("company_name");
if (error) throw new Error(`Could not read active jobs: ${error.message}`);

console.log(`Description audit started ${new Date().toISOString()} (${data.length} active jobs)`);
const results = await mapWithConcurrency(data, 5, auditJob);
for (const item of results) {
  console.log(`\n[${item.status}] ${item.company_name} — ${item.title}`);
  console.log(`  ID: ${item.external_job_id}`);
  console.log(`  Source: ${item.source_url}`);
  if (item.method) console.log(`  Method: ${item.method}`);
  if (item.descriptionLength !== undefined) console.log(`  Description: ${item.descriptionLength} characters`);
  if (item.datePosted || item.deadline) console.log(`  Source dates: posted=${item.datePosted ?? "unknown"}; deadline=${item.deadline ?? "unknown"}`);
  if (item.error) console.log(`  Note: ${item.error}`);
}

console.log("\nSUMMARY");
for (const status of ["verified", "review", "manual-pdf", "closed", "error"]) {
  console.log(`${status}: ${results.filter((item) => item.status === status).length}`);
}
if (!writeMode) console.log("No database writes were attempted.");

if (writeMode) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const serviceUrl = process.env.SUPABASE_URL ?? url;
  if (!serviceKey || !serviceUrl) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --write.");
  const admin = createClient(serviceUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = new Date().toISOString();
  let updated = 0;
  let closed = 0;
  for (const item of results) {
    if (item.status === "verified") {
      const payload = {
        description_text: item.description,
        description_status: "verified",
        description_verified_at: now,
        last_verified_at: now,
        updated_at: now,
        ...(item.date_posted ? {} : item.datePosted ? { date_posted: String(item.datePosted).slice(0, 10) } : {}),
        ...(item.sourceCorrection ? { source_url: item.sourceCorrection, application_url: item.sourceCorrection } : {}),
        ...(item.externalIdCorrection ? {
          external_job_id: item.externalIdCorrection,
          source_record_id: `raymond-james:${item.externalIdCorrection}`,
        } : {}),
        ...(item.company_name === "Stifel Canada" ? {
          source_url: "https://join.stifel.com/jobs/9916?lang=en-us",
          application_url: "https://join.stifel.com/jobs/9916?lang=en-us",
        } : {}),
      };
      const { error: updateError } = await admin.from("jobs").update(payload).eq("id", item.id);
      if (updateError) throw new Error(`Failed to update ${item.company_name} ${item.external_job_id}: ${updateError.message}`);
      updated += 1;
    } else if (item.status === "closed" && item.external_job_id === "R_1509729") {
      const note = [item.data_quality_notes, "Closed after the public TD page was verified as expired on 2026-09-17."].filter(Boolean).join(" ");
      const { error: closeError } = await admin.from("jobs").update({ status: "closed", data_quality_notes: note, last_verified_at: now, updated_at: now }).eq("id", item.id);
      if (closeError) throw new Error(`Failed to close TD ${item.external_job_id}: ${closeError.message}`);
      closed += 1;
    }
  }
  console.log(`\nWRITE SUMMARY\nDescriptions updated: ${updated}\nExpired jobs closed: ${closed}`);
}
