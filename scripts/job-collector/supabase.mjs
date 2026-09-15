import { createClient } from "@supabase/supabase-js";
import { RBC_COMPANY } from "./normalize.mjs";

function serverClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for a real run.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function comparable(row) {
  const copy = { ...row };
  delete copy.id;
  delete copy.created_at;
  delete copy.updated_at;
  delete copy.last_verified_at;
  delete copy.featured;
  return copy;
}

function isSame(existing, incoming) {
  const existingComparable = comparable(existing);
  const incomingComparable = comparable(incoming);
  return Object.keys(incomingComparable).every((key) =>
    JSON.stringify(existingComparable[key] ?? null) === JSON.stringify(incomingComparable[key] ?? null),
  );
}

export async function writeRbcJobs(jobs) {
  const supabase = serverClient();
  const { data: companies, error: companyError } = await supabase
    .from("companies")
    .select("company_id,name")
    .eq("name", RBC_COMPANY.name);
  if (companyError) throw companyError;
  if (companies.length !== 1 || companies[0].company_id !== RBC_COMPANY.id) {
    throw new Error(`Expected the existing ${RBC_COMPANY.name} company row with ID ${RBC_COMPANY.id}.`);
  }

  const { data: existing, error: existingError } = await supabase
    .from("jobs")
    .select("*")
    .eq("company_id", RBC_COMPANY.id)
    .eq("category", "Investment Banking");
  if (existingError) throw existingError;

  const byExternalId = new Map(existing.map((job) => [job.external_job_id, job]));
  const counts = { inserted: 0, updated: 0, unchanged: 0, closed: 0 };
  for (const job of jobs) {
    const current = byExternalId.get(job.external_job_id);
    if (!current) counts.inserted += 1;
    else if (isSame(current, job)) counts.unchanged += 1;
    else counts.updated += 1;
  }

  if (jobs.length) {
    const { error: upsertError } = await supabase
      .from("jobs")
      .upsert(jobs, { onConflict: "company_id,external_job_id" });
    if (upsertError) throw upsertError;
  }

  const observedIds = new Set(jobs.map((job) => job.external_job_id));
  const stale = existing.filter((job) => job.status === "active" && !observedIds.has(job.external_job_id));

  if (stale.length) {
    const closedAt = new Date().toISOString();
    const { error: closeError } = await supabase
      .from("jobs")
      .update({ status: "closed", updated_at: closedAt })
      .in("id", stale.map(({ id }) => id));
    if (closeError) throw closeError;
    counts.closed = stale.length;
  }

  return counts;
}
