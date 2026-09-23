export type VerifiableJob = {
  external_job_id: string;
  title: string;
  company_name: string;
  application_url: string;
  source_url: string;
};

export type VerificationResult = {
  state: "live" | "closed" | "inconclusive";
  source: "workday" | "eightfold" | "oracle" | "ukg" | "jibe" | "html" | "pdf";
  deadline: string | null;
  reason: string;
  checkedUrl: string;
};

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

const CLOSED_TEXT = /(?:the|this|requested)\s+(?:job|position|posting|opportunity|requisition)(?:\s+you(?:'|’)re\s+looking\s+for)?\s+(?:is|has been|was)?\s*(?:no longer available|not available|expired|filled|closed)|no longer accepting applications|applications (?:are|have been) closed|requested job (?:could not be found|was not found)/i;

export function normalizeSourceDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const iso = value.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const numeric = value.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/);
  if (numeric) return `${numeric[3]}-${numeric[1].padStart(2, "0")}-${numeric[2].padStart(2, "0")}`;
  const words = value.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(20\d{2})\b/i);
  if (!words) return null;
  return `${words[3]}-${MONTHS[words[1].toLowerCase()]}-${words[2].padStart(2, "0")}`;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#(?:39|x27);|&apos;/gi, "'")
    .replace(/&nbsp;|&#160;/gi, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function torontoDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function titleTokens(value: string): Set<string> {
  return new Set(value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((token) => token.length > 2));
}

function titleMatches(expected: string, actual: string): boolean {
  const left = titleTokens(expected), right = titleTokens(actual);
  if (!left.size || !right.size) return false;
  return [...left].filter((token) => right.has(token)).length / Math.min(left.size, right.size) >= 0.55;
}

async function fetchSource(url: string, accept = "text/html,application/xhtml+xml", language = "en-CA,en;q=0.9"): Promise<{ response: Response; body: string }> {
  const response = await fetch(url, {
    headers: { accept, "accept-language": language, "user-agent": "BSO-Jobs-Availability-Verifier/1.0 (+https://www.baystreetoracle.ca)" },
    redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(8_000),
  });
  return { response, body: await response.text() };
}

function result(state: VerificationResult["state"], source: VerificationResult["source"], checkedUrl: string, reason: string, deadline: string | null = null): VerificationResult {
  return { state, source, checkedUrl, reason, deadline };
}

function httpFailure(response: Response, source: VerificationResult["source"]): VerificationResult | null {
  if ([404, 410].includes(response.status)) return result("closed", source, response.url, `Official source returned HTTP ${response.status}.`);
  if (!response.ok) return result("inconclusive", source, response.url, `Official source returned HTTP ${response.status}.`);
  return null;
}

function workdayEndpoint(sourceUrl: string): string | null {
  const url = new URL(sourceUrl);
  if (!/\.myworkdayjobs\.com$/i.test(url.hostname)) return null;
  const segments = url.pathname.split("/").filter(Boolean), jobIndex = segments.indexOf("job");
  if (jobIndex < 1) return null;
  const jobPath = segments.slice(jobIndex);
  if (jobPath.at(-1) === "apply") jobPath.pop();
  return `${url.origin}/wday/cxs/${url.hostname.split(".")[0]}/${segments[jobIndex - 1]}/${jobPath.join("/")}`;
}

async function verifyWorkday(job: VerifiableJob, endpoint: string): Promise<VerificationResult> {
  const { response, body } = await fetchSource(endpoint, "application/json");
  const failed = httpFailure(response, "workday");
  if (failed) return failed;
  let payload: { jobPostingInfo?: { title?: string; jobReqId?: string; endDate?: string } };
  try { payload = JSON.parse(body); } catch { return result("inconclusive", "workday", endpoint, "Workday returned malformed JSON."); }
  const detail = payload.jobPostingInfo;
  if (!detail?.title) return result("closed", "workday", endpoint, "Workday returned no public requisition detail.");
  if (!titleMatches(job.title, normalizeText(detail.title))) return result("inconclusive", "workday", endpoint, "Workday returned a different job title.");
  const returnedId = String(detail.jobReqId ?? "").trim();
  if (returnedId && returnedId !== job.external_job_id && !endpoint.includes(job.external_job_id)) return result("inconclusive", "workday", endpoint, `Workday returned a different requisition ID (${returnedId}).`);
  return result("live", "workday", endpoint, "Workday public detail is active.", normalizeSourceDate(detail.endDate));
}

async function verifyEightfold(job: VerifiableJob, sourceUrl: string): Promise<VerificationResult> {
  const url = new URL(sourceUrl);
  const positionId = url.pathname.match(/\/careers\/job\/(\d+)/)?.[1];
  if (!positionId) return result("inconclusive", "eightfold", sourceUrl, "Eightfold position identifier could not be derived.");
  const endpoint = `${url.origin}/api/apply/v2/jobs/${positionId}`;
  const { response, body } = await fetchSource(endpoint, "application/json");
  const failed = httpFailure(response, "eightfold");
  if (failed) return failed;
  try {
    const detail = JSON.parse(body);
    if (!detail?.name) return result("closed", "eightfold", endpoint, "Eightfold returned no public position detail.");
    if (!titleMatches(job.title, normalizeText(detail.posting_name ?? detail.name))) return result("inconclusive", "eightfold", endpoint, "Eightfold returned a different job title.");
    const identities = [detail.id, detail.display_job_id, detail.ats_job_id].map((value) => String(value ?? "").trim()).filter(Boolean);
    if (!identities.includes(job.external_job_id) && !identities.includes(positionId)) return result("inconclusive", "eightfold", endpoint, `Eightfold returned different identifiers (${identities.join(", ")}).`);
    const applyByValue = detail.custom_JD?.data_fields?.applyByDate?.[0];
    const deadline = normalizeSourceDate(applyByValue);
    if (deadline && deadline <= torontoDate()) {
      return result("closed", "eightfold", endpoint, `Eightfold application deadline (${deadline}) has been reached.`, deadline);
    }
    const detailText = normalizeText(`${detail.job_description ?? ""} ${JSON.stringify(detail.preApplyInfoBanner ?? {})}`);
    if (CLOSED_TEXT.test(detailText)) return result("closed", "eightfold", endpoint, "Eightfold states that applications are no longer being accepted.", deadline);
    return result("live", "eightfold", endpoint, "Eightfold public position detail is active.", deadline);
  } catch { return result("inconclusive", "eightfold", endpoint, "Eightfold returned malformed JSON."); }
}

async function verifyOracle(job: VerifiableJob, sourceUrl: string): Promise<VerificationResult> {
  const url = new URL(sourceUrl), site = url.pathname.match(/\/sites\/([^/]+)\/job\//)?.[1];
  if (!site) return result("inconclusive", "oracle", sourceUrl, "Oracle site identifier could not be derived.");
  const endpoint = `${url.origin}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?finder=findReqs;siteNumber=${encodeURIComponent(site)},keyword=${encodeURIComponent(job.external_job_id)}&expand=requisitionList&onlyData=true`;
  const { response, body } = await fetchSource(endpoint, "application/json");
  const failed = httpFailure(response, "oracle");
  if (failed) return failed;
  try {
    const rows = JSON.parse(body)?.items?.[0]?.requisitionList ?? [];
    const exact = rows.find((row: { Id?: unknown }) => String(row.Id ?? "") === job.external_job_id);
    if (!exact) return result("closed", "oracle", endpoint, "Requisition is absent from the official Oracle search response.");
    const title = normalizeText(exact.Title ?? exact.JobTitle ?? "");
    if (title && !titleMatches(job.title, title)) return result("inconclusive", "oracle", endpoint, "Oracle returned a different title for the requisition.");
    return result("live", "oracle", endpoint, "Oracle public requisition is active.", normalizeSourceDate(exact.PostingEndDate));
  } catch { return result("inconclusive", "oracle", endpoint, "Oracle returned malformed JSON."); }
}

function balancedJsonAfter(html: string, marker: string): string | null {
  const markerIndex = html.indexOf(marker), start = html.indexOf("{", markerIndex + marker.length);
  if (markerIndex < 0 || start < 0) return null;
  let depth = 0, inString = false, escaped = false;
  for (let index = start; index < html.length; index += 1) {
    const character = html[index];
    if (inString) { if (escaped) escaped = false; else if (character === "\\") escaped = true; else if (character === '"') inString = false; continue; }
    if (character === '"') inString = true; else if (character === "{") depth += 1; else if (character === "}" && --depth === 0) return html.slice(start, index + 1);
  }
  return null;
}

async function verifyUkg(job: VerifiableJob, sourceUrl: string): Promise<VerificationResult> {
  const { response, body } = await fetchSource(sourceUrl);
  const failed = httpFailure(response, "ukg");
  if (failed) return failed;
  const raw = balancedJsonAfter(body, "CandidateOpportunityDetail(");
  if (!raw) return CLOSED_TEXT.test(normalizeText(body)) ? result("closed", "ukg", response.url, "Official UKG page states that the opportunity is unavailable.") : result("inconclusive", "ukg", response.url, "UKG opportunity detail could not be parsed.");
  try {
    const detail = JSON.parse(raw), returnedId = String(detail.RequisitionNumber ?? "").trim();
    if (returnedId && returnedId !== job.external_job_id) return result("inconclusive", "ukg", response.url, `UKG returned a different requisition ID (${returnedId}).`);
    if (!titleMatches(job.title, normalizeText(detail.Title))) return result("inconclusive", "ukg", response.url, "UKG returned a different job title.");
    return result("live", "ukg", response.url, "UKG public opportunity detail is active.", normalizeSourceDate(detail.ClosingDate));
  } catch { return result("inconclusive", "ukg", response.url, "UKG returned malformed opportunity data."); }
}

async function verifyStifel(job: VerifiableJob): Promise<VerificationResult> {
  const endpoint = "https://join.stifel.com/api/jobs?country=Canada", { response, body } = await fetchSource(endpoint, "application/json", "en-US,en;q=0.9");
  const failed = httpFailure(response, "jibe");
  if (failed) return failed;
  try {
    const rows = JSON.parse(body)?.jobs ?? [];
    const exact = rows.map((row: { data?: unknown }) => row.data ?? row).find((row: { req_id?: unknown; slug?: unknown }) => String(row.req_id ?? row.slug ?? "").trim() === job.external_job_id);
    return exact ? result("live", "jibe", endpoint, "Official employer jobs feed contains the requisition.") : result("closed", "jibe", endpoint, "Requisition is absent from the official employer jobs feed.");
  } catch { return result("inconclusive", "jibe", endpoint, "Employer jobs feed returned malformed JSON."); }
}

function jsonLdJobs(html: string): Array<Record<string, unknown>> {
  const records: Array<Record<string, unknown>> = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1].trim()), queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) { const value = queue.shift(); if (!value || typeof value !== "object") continue; if (Array.isArray(value["@graph"])) queue.push(...value["@graph"]); if (value["@type"] === "JobPosting") records.push(value); }
    } catch { /* Malformed analytics blocks are never closure evidence. */ }
  }
  return records;
}

function htmlDeadline(html: string): string | null {
  const candidates = [html.match(/["']validThrough["']\s*:\s*["']([^"']+)/i)?.[1], html.match(/(?:End Date|Application Deadline|Apply by)\s*:?[^A-Za-z0-9]{0,80}((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?[,]?\s+20\d{2}|20\d{2}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/20\d{2})/i)?.[1]];
  return candidates.map(normalizeSourceDate).find(Boolean) ?? null;
}

async function verifyHtml(job: VerifiableJob, sourceUrl: string): Promise<VerificationResult> {
  const isPdf = /\.pdf(?:$|\?)/i.test(sourceUrl), source = isPdf ? "pdf" : "html";
  const { response, body } = await fetchSource(sourceUrl, isPdf ? "application/pdf" : "text/html,application/xhtml+xml");
  const failed = httpFailure(response, source);
  if (failed) return failed;
  if (isPdf) return result("live", "pdf", response.url, "Official employer PDF remains available.");
  const text = normalizeText(body);
  if (CLOSED_TEXT.test(text)) return result("closed", "html", response.url, "Official employer page states that the posting is unavailable.");
  const matchingRecord = jsonLdJobs(body).find((record) => titleMatches(job.title, normalizeText(record.title)));
  if (matchingRecord) return result("live", "html", response.url, "Matching JobPosting structured data remains available.", normalizeSourceDate(matchingRecord.validThrough));
  const pageTitle = normalizeText(body.match(/<meta\b[^>]*(?:property=["']og:title["']|name=["']twitter:title["'])[^>]*content=["']([^"']+)["']/i)?.[1] ?? body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  if (pageTitle && titleMatches(job.title, pageTitle)) return result("live", "html", response.url, "Employer page title matches the stored posting.", htmlDeadline(body));
  if (text.includes(job.external_job_id) && [...titleTokens(job.title)].filter((token) => text.toLowerCase().includes(token)).length >= 3) return result("live", "html", response.url, "Employer page contains the requisition ID and matching title terms.", htmlDeadline(body));
  return result("inconclusive", "html", response.url, "Page loaded, but the stored requisition could not be verified safely.");
}

export async function verifyJobSource(job: VerifiableJob): Promise<VerificationResult> {
  const sourceUrl = job.source_url || job.application_url;
  try {
    const workday = workdayEndpoint(sourceUrl);
    if (workday) return await verifyWorkday(job, workday);
    if (/\/careers\/job\/\d+/i.test(sourceUrl) && /(?:\.eightfold\.ai|careers\.atb\.com)/i.test(sourceUrl)) return await verifyEightfold(job, sourceUrl);
    if (/\.fa\.(?:us\d\.)?oraclecloud\.com/i.test(sourceUrl)) return await verifyOracle(job, sourceUrl);
    if (/recruiting\d*\.ultipro\.(?:ca|com)/i.test(sourceUrl)) return await verifyUkg(job, sourceUrl);
    if (job.company_name === "Stifel Canada") return await verifyStifel(job);
    return await verifyHtml(job, sourceUrl);
  } catch (error) {
    return result("inconclusive", /\.myworkdayjobs\.com/i.test(sourceUrl) ? "workday" : "html", sourceUrl, error instanceof Error ? error.message : String(error));
  }
}
