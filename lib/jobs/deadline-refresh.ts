import { createClient } from "@supabase/supabase-js";
import { verifyJobSource, type VerifiableJob, type VerificationResult } from "./source-verification";

type ActiveJob = VerifiableJob & {
  id: string;
  application_deadline: string | null;
  data_quality_notes: string | null;
  source_name: string | null;
};

type Action = "closed" | "pending-close" | "needs-person" | "deadline-updated" | "verified" | "preserved";

/**
 * A source that says "closed" must say it on two different days before the job closes. The first sighting
 * is kept in the notes as "[Dead-link check 1 of 2 on <date>: <reason>]". Records BSO curated by hand or got
 * from an employer are never closed by a source check; they are marked "[Needs a person since <date>: …]"
 * for Hunter to raise in Agent HQ. A passed application deadline still closes a job the same day.
 */
export const FIRST_STRIKE = /\[Dead-link check 1 of 2 on (\d{4}-\d{2}-\d{2}): ([^\]]*)\]/;
export const NEEDS_PERSON = /\[Needs a person since (\d{4}-\d{2}-\d{2}): ([^\]]*)\]/;
const PROTECTED = /curated workbook|manual|employer|exclusive|\[Owner keeps open/i;
const bracketSafe = (value: string) => value.replace(/[[\]]/g, "");

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
    .replace(new RegExp(`\\s*(?:${FIRST_STRIKE.source}|${NEEDS_PERSON.source})`, "g"), "")
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
    .select("id,external_job_id,title,company_name,application_deadline,application_url,source_url,data_quality_notes,source_name")
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
      const notes = job.data_quality_notes ?? "";
      const reason = bracketSafe(source.reason);
      if (PROTECTED.test(`${job.source_name ?? ""} ${notes}`)) {
        if (!NEEDS_PERSON.test(notes)) {
          const { error: updateError } = await supabase.from("jobs").update({
            data_quality_notes: replaceVerificationNote(notes, `[Needs a person since ${today}: ${reason}]`), updated_at: verifiedAt,
          }).eq("id", job.id);
          if (updateError) throw updateError;
        }
        return { job, source, action: "needs-person" as Action, reason: source.reason };
      }
      const firstSeen = notes.match(FIRST_STRIKE)?.[1];
      if (!firstSeen || firstSeen >= today) {
        if (!firstSeen) {
          const { error: updateError } = await supabase.from("jobs").update({
            data_quality_notes: `${notes} [Dead-link check 1 of 2 on ${today}: ${reason}]`.trim(), updated_at: verifiedAt,
          }).eq("id", job.id);
          if (updateError) throw updateError;
        }
        return { job, source, action: "pending-close" as Action, reason: source.reason };
      }
      const note = `Automatically closed on ${today} after two official source checks (first on ${firstSeen}): ${source.reason}`;
      const { error: updateError } = await supabase.from("jobs").update({
        status: "closed", last_verified_at: verifiedAt, updated_at: verifiedAt,
        data_quality_notes: replaceVerificationNote(notes, note),
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
    jobsAwaitingSecondCheck: outcomes.filter(({ action }) => action === "pending-close").length,
    jobsNeedingAPerson: outcomes.filter(({ action }) => action === "needs-person").length,
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
