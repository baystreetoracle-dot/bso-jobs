import { createClient } from "@supabase/supabase-js";
import { verifyJobSource, type VerifiableJob, type VerificationResult } from "./source-verification";

type ActiveJob = VerifiableJob & {
  id: string;
  application_deadline: string | null;
  data_quality_notes: string | null;
};

type Action = "closed" | "deadline-updated" | "verified" | "preserved";

function torontoDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function replaceVerificationNote(notes: string | null, note: string): string {
  const prior = (notes ?? "")
    .replace(/\s*(?:Deadline|Availability) verified from official [^.]+ source on \d{4}-\d{2}-\d{2}\./gi, "")
    .replace(/\s*Automatically closed on \d{4}-\d{2}-\d{2}[^.]*\./gi, "")
    .trim();
  return [prior, note].filter(Boolean).join(" ");
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
    .select("id,external_job_id,title,company_name,application_deadline,application_url,source_url,data_quality_notes")
    .eq("status", "active");
  if (error) throw error;

  const today = torontoDate();
  const verifiedAt = new Date().toISOString();
  const outcomes = await mapWithConcurrency((data ?? []) as ActiveJob[], 10, async (job) => {
    if (job.application_deadline && job.application_deadline < today) {
      const note = `Automatically closed on ${today} because the stored application deadline (${job.application_deadline}) passed.`;
      const { error: updateError } = await supabase.from("jobs").update({
        status: "closed", last_verified_at: verifiedAt, updated_at: verifiedAt,
        data_quality_notes: replaceVerificationNote(job.data_quality_notes, note),
      }).eq("id", job.id);
      if (updateError) throw updateError;
      return { job, source: null, action: "closed" as Action, reason: note };
    }

    const source = await verifyJobSource(job);
    if (source.state === "inconclusive") return { job, source, action: "preserved" as Action, reason: source.reason };

    if (source.state === "closed") {
      const note = `Automatically closed on ${today} after official source verification: ${source.reason}`;
      const { error: updateError } = await supabase.from("jobs").update({
        status: "closed", last_verified_at: verifiedAt, updated_at: verifiedAt,
        data_quality_notes: replaceVerificationNote(job.data_quality_notes, note),
      }).eq("id", job.id);
      if (updateError) throw updateError;
      return { job, source, action: "closed" as Action, reason: source.reason };
    }

    const nextDeadline = source.deadline ?? job.application_deadline;
    const deadlineChanged = Boolean(source.deadline && source.deadline !== job.application_deadline);
    const note = `Availability verified from official ${source.source} source on ${today}.`;
    const { error: updateError } = await supabase.from("jobs").update({
      application_deadline: nextDeadline, last_verified_at: verifiedAt, updated_at: verifiedAt,
      data_quality_notes: replaceVerificationNote(job.data_quality_notes, note),
    }).eq("id", job.id);
    if (updateError) throw updateError;
    return { job, source, action: deadlineChanged ? "deadline-updated" as Action : "verified" as Action, reason: source.reason };
  });

  const sourceResults = outcomes.map(({ source }) => source).filter((value): value is VerificationResult => value !== null);
  return {
    date: today,
    activeJobsScanned: outcomes.length,
    sourceChecksSucceeded: sourceResults.filter(({ state }) => state !== "inconclusive").length,
    confirmedLive: sourceResults.filter(({ state }) => state === "live").length,
    deadlinesUpdated: outcomes.filter(({ action }) => action === "deadline-updated").length,
    jobsClosed: outcomes.filter(({ action }) => action === "closed").length,
    jobsVerified: outcomes.filter(({ action }) => action === "verified").length,
    jobsPreservedAfterIncompleteCheck: outcomes.filter(({ action }) => action === "preserved").length,
    closed: outcomes.filter(({ action }) => action === "closed").map(({ job, reason }) => ({
      company: job.company_name, title: job.title, externalJobId: job.external_job_id, reason,
    })),
    errors: outcomes.filter(({ action }) => action === "preserved").map(({ job, reason }) => ({
      company: job.company_name, title: job.title, externalJobId: job.external_job_id, error: reason,
    })),
  };
}
