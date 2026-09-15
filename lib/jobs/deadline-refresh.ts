import { createClient } from "@supabase/supabase-js";

type ActiveJob = {
  id: string;
  title: string;
  company_name: string;
  application_deadline: string | null;
  application_url: string;
  source_url: string;
  data_quality_notes: string | null;
};

type SourceResult = {
  checked: boolean;
  deadline: string | null;
  source: "workday" | "html" | "unsupported";
  error?: string;
};

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

function torontoDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const iso = value.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const words = value.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(20\d{2})\b/i);
  if (!words) return null;
  return `${words[3]}-${MONTHS[words[1].toLowerCase()]}-${words[2].padStart(2, "0")}`;
}

function workdayEndpoint(sourceUrl: string): string | null {
  const url = new URL(sourceUrl);
  if (!/\.myworkdayjobs\.com$/i.test(url.hostname)) return null;
  const segments = url.pathname.split("/").filter(Boolean);
  const jobIndex = segments.indexOf("job");
  if (jobIndex < 1) return null;
  const site = segments[jobIndex - 1];
  const tenant = url.hostname.split(".")[0];
  const externalSegments = segments.slice(jobIndex);
  if (externalSegments.at(-1) === "apply") externalSegments.pop();
  return `${url.origin}/wday/cxs/${tenant}/${site}/${externalSegments.join("/")}`;
}

async function fetchWithTimeout(url: string, accept: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    return await fetch(url, {
      headers: { accept, "user-agent": "BSO-Jobs-Deadline-Verifier/1.0" },
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function inspectSource(job: ActiveJob): Promise<SourceResult> {
  const sourceUrl = job.source_url || job.application_url;
  const endpoint = workdayEndpoint(sourceUrl);
  try {
    if (endpoint) {
      const response = await fetchWithTimeout(endpoint, "application/json");
      if (!response.ok) return { checked: false, deadline: null, source: "workday", error: `HTTP ${response.status}` };
      const payload = await response.json();
      const info = payload?.jobPostingInfo;
      if (!info?.title) return { checked: false, deadline: null, source: "workday", error: "Incomplete Workday detail" };
      return { checked: true, deadline: normalizeDate(info.endDate), source: "workday" };
    }

    // Generic HTML verification is limited to jobs that already have a known
    // deadline. Missing deadlines are never interpreted as closed postings.
    if (!job.application_deadline || sourceUrl.toLowerCase().endsWith(".pdf")) {
      return { checked: false, deadline: null, source: "unsupported" };
    }
    const response = await fetchWithTimeout(sourceUrl, "text/html,application/xhtml+xml");
    if (!response.ok) return { checked: false, deadline: null, source: "html", error: `HTTP ${response.status}` };
    const html = await response.text();
    const candidates = [
      html.match(/["']validThrough["']\s*:\s*["']([^"']+)/i)?.[1],
      html.match(/(?:End Date|Application Deadline|Apply by)\s*:?[^A-Za-z0-9]{0,80}((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?[,]?\s+20\d{2}|20\d{2}-\d{2}-\d{2})/i)?.[1],
    ];
    const deadline = candidates.map(normalizeDate).find(Boolean) ?? null;
    return deadline
      ? { checked: true, deadline, source: "html" }
      : { checked: false, deadline: null, source: "html", error: "No structured deadline found" };
  } catch (error) {
    return {
      checked: false, deadline: null, source: endpoint ? "workday" : "html",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function mapWithConcurrency<T, U>(items: T[], concurrency: number, mapper: (item: T) => Promise<U>): Promise<U[]> {
  const results = new Array<U>(items.length);
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

export async function refreshJobDeadlines() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new Error("Server-side Supabase credentials are not configured.");
  const supabase = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase
    .from("jobs")
    .select("id,title,company_name,application_deadline,application_url,source_url,data_quality_notes")
    .eq("status", "active");
  if (error) throw error;

  const today = torontoDate();
  const verifiedAt = new Date().toISOString();
  const outcomes = await mapWithConcurrency((data ?? []) as ActiveJob[], 5, async (job) => {
    const source = await inspectSource(job);
    if (!source.checked || !source.deadline) return { job, source, action: "preserved" as const };
    const status = source.deadline < today ? "closed" : "active";
    const changed = source.deadline !== job.application_deadline;
    const note = `Deadline verified from official ${source.source} source on ${today}.`;
    const priorNotes = (job.data_quality_notes ?? "")
      .replace(/\s*Deadline verified from official (?:workday|html) source on \d{4}-\d{2}-\d{2}\./gi, "")
      .trim();
    const { error: updateError } = await supabase.from("jobs").update({
      application_deadline: source.deadline,
      status,
      last_verified_at: verifiedAt,
      updated_at: verifiedAt,
      data_quality_notes: [priorNotes, note].filter(Boolean).join(" "),
    }).eq("id", job.id);
    if (updateError) throw updateError;
    return { job, source, action: status === "closed" ? "closed" as const : changed ? "deadline-updated" as const : "verified" as const };
  });

  return {
    date: today,
    activeJobsScanned: outcomes.length,
    sourceChecksSucceeded: outcomes.filter(({ source }) => source.checked).length,
    deadlinesUpdated: outcomes.filter(({ action }) => action === "deadline-updated").length,
    jobsClosed: outcomes.filter(({ action }) => action === "closed").length,
    jobsVerified: outcomes.filter(({ action }) => action === "verified").length,
    jobsPreservedAfterIncompleteCheck: outcomes.filter(({ action }) => action === "preserved").length,
    errors: outcomes.filter(({ source }) => source.error).map(({ job, source }) => ({
      company: job.company_name, title: job.title, error: source.error,
    })),
  };
}
