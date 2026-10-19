import crypto from "node:crypto";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { rankJobs } from "@/lib/jobs/ranking";
import { matchesJobAlertPreferences } from "@/lib/job-alerts/preferences";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { jobPath } from "@/lib/jobs/urls";
import "./preview-gallery.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Job Alert Drafts — BSO", robots: { index: false, follow: false } };

type Subscriber = {
  id: string;
  email: string;
  career_paths: string[] | null;
  seniority_preferences: string[] | null;
  location_preferences: string[] | null;
};

type Job = {
  id: string;
  external_job_id: string;
  company_name: string;
  title: string;
  location_display: string;
  city: string | null;
  country: string | null;
  category: string;
  seniority: string;
  program_type: string | null;
  application_deadline: string | null;
  date_posted: string | null;
  source_name: string | null;
  data_quality_notes: string | null;
};

function sessionValue(secret: string) {
  return crypto.createHash("sha256").update(`bso-job-alert-previews:${secret}`).digest("hex");
}

function authorized(cookie: string | undefined, secret: string) {
  if (!cookie) return false;
  const a = Buffer.from(cookie);
  const b = Buffer.from(sessionValue(secret));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function todayInToronto() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function deadline(value: string | null) {
  if (!value) return "Deadline open";
  return `Apply by ${new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`))}`;
}

function label(values: string[] | null, fallback: string) {
  return values?.length ? values.join(" + ") : fallback;
}

function Login({ error }: { error: boolean }) {
  return <main className="preview-login">
    <section>
      <p className="eyebrow">Private BSO tool</p>
      <h1>Job alert drafts</h1>
      <p>Enter the preview password to review personalized emails. This page cannot send messages.</p>
      {error && <p className="login-error">That password was not accepted.</p>}
      <form action="/api/admin/job-alert-previews/login" method="post">
        <label htmlFor="password">Preview password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
        <button type="submit">Open drafts</button>
      </form>
    </section>
  </main>;
}

export default async function JobAlertPreviewsPage({ searchParams }: { searchParams: Promise<{ subscriber?: string; error?: string }> }) {
  const query = await searchParams;
  const secret = process.env.JOB_ALERT_PREVIEW_PASSWORD?.trim();
  const cookieStore = await cookies();
  if (!secret || !authorized(cookieStore.get("bso_job_alert_preview")?.value, secret)) return <Login error={query.error === "1"} />;

  const supabase = getSupabaseAdminClient();
  const [{ data: subscriberRows, error: subscriberError }, { data: jobRows, error: jobError }] = await Promise.all([
    supabase.from("job_alert_subscribers").select("id,email,career_paths,seniority_preferences,location_preferences").eq("status", "subscribed").order("created_at"),
    supabase.from("jobs").select("id,external_job_id,company_name,title,location_display,city,country,category,seniority,program_type,application_deadline,date_posted,source_name,data_quality_notes").eq("status", "active").order("application_deadline", { ascending: true, nullsFirst: false }),
  ]);
  if (subscriberError) throw subscriberError;
  if (jobError) throw jobError;

  const subscribers = (subscriberRows ?? []) as Subscriber[];
  const jobs = (jobRows ?? []).map((job) => ({ ...job, seniority: job.seniority ?? "Unspecified" })) as Job[];
  const today = todayInToronto();
  const drafts = subscribers.map((subscriber) => {
    const preferences = {
      careerPaths: subscriber.career_paths ?? [],
      seniorities: subscriber.seniority_preferences ?? [],
      locations: subscriber.location_preferences ?? [],
    };
    const eligible = jobs.filter((job) => matchesJobAlertPreferences(job, preferences) && (!job.application_deadline || job.application_deadline >= today));
    const selected = rankJobs(eligible, { today, diversity: true }).slice(0, 8).map(({ job }) => job as Job);
    return { subscriber, selected, eligibleCount: eligible.length };
  });
  const ready = drafts.filter((draft) => draft.selected.length > 0);
  const skipped = drafts.filter((draft) => draft.selected.length === 0);
  const selectedDraft = ready.find((draft) => draft.subscriber.id === query.subscriber) ?? ready[0] ?? null;

  return <main className="preview-admin">
    <header className="preview-header">
      <div><p className="eyebrow">Private BSO tool</p><h1>Job alert drafts</h1><p>Live subscriber preferences and active jobs. Viewing this page never sends an email.</p></div>
      <div className="preview-stats"><strong>{subscribers.length}</strong><span>subscribers</span><strong>{ready.length}</strong><span>drafts ready</span><strong>{skipped.length}</strong><span>skipped</span></div>
    </header>
    <div className="preview-layout">
      <aside className="draft-list">
        <h2>Ready to send</h2>
        {ready.map((draft) => <a className={selectedDraft?.subscriber.id === draft.subscriber.id ? "active" : ""} href={`?subscriber=${encodeURIComponent(draft.subscriber.id)}`} key={draft.subscriber.id}>
          <span>{draft.subscriber.email}</span><small>{draft.selected.length} shown · {draft.eligibleCount} matches</small>
        </a>)}
        <details><summary>Skipped — no matches ({skipped.length})</summary>{skipped.map((draft) => <div className="skipped" key={draft.subscriber.id}><span>{draft.subscriber.email}</span><small>{label(draft.subscriber.career_paths, "All paths")} · {label(draft.subscriber.seniority_preferences, "Default levels")} · {label(draft.subscriber.location_preferences, "All Canada")}</small></div>)}</details>
      </aside>
      <section className="draft-stage">
        {selectedDraft ? <>
          <div className="draft-meta">
            <div><span>Recipient</span><strong>{selectedDraft.subscriber.email}</strong></div>
            <div><span>Career path</span><strong>{label(selectedDraft.subscriber.career_paths, "Capital markets")}</strong></div>
            <div><span>Seniority</span><strong>{label(selectedDraft.subscriber.seniority_preferences, "Intern / Co-op + Analyst")}</strong></div>
            <div><span>Location</span><strong>{label(selectedDraft.subscriber.location_preferences, "Across Canada")}</strong></div>
          </div>
          <div className="email-shell">
            <div className="email-hero"><p>BSO Job Alerts</p><h2>Your job alert for {label(selectedDraft.subscriber.career_paths, "capital markets")} · {label(selectedDraft.subscriber.seniority_preferences, "Intern / Co-op + Analyst")}</h2><span>{selectedDraft.subscriber.location_preferences?.length ? `in ${selectedDraft.subscriber.location_preferences.join(" + ")}` : "across Canada"}</span></div>
            <div className="email-body">
              <p>{selectedDraft.eligibleCount > selectedDraft.selected.length ? `Here are your top ${selectedDraft.selected.length} of ${selectedDraft.eligibleCount} active matches.` : `${selectedDraft.selected.length} active ${selectedDraft.selected.length === 1 ? "opportunity matches" : "opportunities match"} your preferences.`}</p>
              {selectedDraft.selected.map((job) => <article key={job.id}><div className="company-mark">{job.company_name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</div><div><p>{job.company_name}</p><a href={jobPath(job)} target="_blank">{job.title}</a><span>{job.location_display}</span><small>{job.category} · {job.seniority ?? "Unspecified"} · {deadline(job.application_deadline)}</small></div></article>)}
              <a className="all-jobs" href="/jobs" target="_blank">View all jobs</a>
            </div>
            <footer>Questions? Email info@baystreetoracle.ca.<br />The delivered email includes the subscriber’s secure unsubscribe link.</footer>
          </div>
        </> : <div className="empty-state"><h2>No drafts are ready</h2><p>Every active subscriber currently has zero matching jobs, so no alerts will be sent.</p></div>}
      </section>
    </div>
  </main>;
}
