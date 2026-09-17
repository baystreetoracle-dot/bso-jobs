import { createClient } from "@supabase/supabase-js";
import type { JobRow } from "./types";

const JOB_COLUMNS = "id,external_job_id,company_id,company_name,title,location_display,city,province,country,workplace_type,category,specialization,seniority,employment_type,program_type,term_start,term_end,term_length_months,date_posted,application_deadline,salary_min,salary_max,salary_currency,salary_period,application_url,source_url,source_name,status,featured,summary,description_text,description_status,description_verified_at,source_record_id,data_quality_notes,last_verified_at,created_at,updated_at";

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Public Supabase environment variables are not configured.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function todayInToronto(): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Toronto",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date()).map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isCurrentJob(job: Pick<JobRow, "status" | "application_deadline">, today = todayInToronto()): boolean {
  return job.status === "active" && (!job.application_deadline || job.application_deadline >= today);
}

export async function getActiveJobs(): Promise<JobRow[]> {
  const today = todayInToronto();
  const { data, error } = await publicClient()
    .from("jobs")
    .select(JOB_COLUMNS)
    .eq("status", "active")
    .or(`application_deadline.is.null,application_deadline.gte.${today}`)
    .order("application_deadline", { ascending: true, nullsFirst: false });
  if (error) throw new Error(`Unable to load jobs: ${error.message}`);
  return (data ?? []) as unknown as JobRow[];
}

export async function getActiveJobById(id: string): Promise<JobRow | null> {
  const { data, error } = await publicClient()
    .from("jobs")
    .select(JOB_COLUMNS)
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(`Unable to load job: ${error.message}`);
  const job = data as unknown as JobRow | null;
  return job && isCurrentJob(job) ? job : null;
}
