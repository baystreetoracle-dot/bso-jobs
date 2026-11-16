import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { FIRST_STRIKE, NEEDS_PERSON } from "@/lib/jobs/deadline-refresh";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Hunter's way in to BSO Jobs (agent id `jobs` in Agent HQ). Same Bearer token as Agent HQ, HQ_AGENT_TOKEN;
 * this app writes with its own service role, so the agent never holds a database key. His brief is
 * docs/agents/jobs.md.
 *
 *   GET  /api/agent/jobs                                   → the board, the cleaner's results, the latest collector run
 *   POST /api/agent/jobs { action: "close",  jobId, reason } → close one job, only on the owner's instruction
 *   POST /api/agent/jobs { action: "reopen", jobId, reason, deadline? } → reopen one job and keep it open, on the
 *        owner's instruction; `deadline` (YYYY-MM-DD, or null for none) replaces a deadline that has passed
 */
function authorized(req: NextRequest) {
  const token = process.env.HQ_AGENT_TOKEN;
  const got = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token || token.length < 24 || got.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(token));
}

const torontoDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date());
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

type Row = { id: string; company_name: string; title: string; status: string; source_url: string | null; application_url: string | null; application_deadline: string | null; data_quality_notes: string | null; updated_at: string };
const brief = (job: Row) => ({ id: job.id, company: job.company_name, title: job.title, url: job.source_url || job.application_url || null, deadline: job.application_deadline });

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getSupabaseAdminClient();
  const fields = "id,company_name,title,status,source_url,application_url,application_deadline,data_quality_notes,updated_at";
  const [active, closed, run] = await Promise.all([
    db.from("jobs").select(fields).eq("status", "active"),
    db.from("jobs").select(fields).eq("status", "closed").gte("updated_at", daysAgo(2)).order("updated_at", { ascending: false }),
    db.from("collector_runs").select("*").order("report_generated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const error = active.error ?? closed.error ?? run.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const events = run.data
    ? (await db.from("collector_events").select("event_type,company_name,title,external_job_id,job_id,reason,source_url").eq("run_id", run.data.id)).data ?? []
    : [];

  const activeJobs = (active.data ?? []) as Row[];
  const linkProblem = (job: Row) => {
    const url = job.source_url || job.application_url;
    if (!url) return "The job has no posting link.";
    if (/linkedin\.com/i.test(url)) return "The link points to LinkedIn; it needs the employer's own posting instead.";
    return null;
  };

  return NextResponse.json({
    date: torontoDate(),
    board: { activeJobs: activeJobs.length },
    cleaner: {
      schedule: "Daily at 10:00 UTC (/api/cron/job-deadlines). Closes a job once two daily checks agree, or the day its deadline passes.",
      closedLastTwoDays: ((closed.data ?? []) as Row[])
        .map((job) => ({ ...brief(job), closedOn: job.updated_at.slice(0, 10), reason: job.data_quality_notes?.match(/(?:Automatically closed|Closed on)[^]*$/)?.[0] ?? null })),
      awaitingSecondCheck: activeJobs.flatMap((job) => {
        const match = job.data_quality_notes?.match(FIRST_STRIKE);
        return match ? [{ ...brief(job), firstSeen: match[1], reason: match[2] }] : [];
      }),
      needsAPerson: activeJobs.flatMap((job) => {
        const match = job.data_quality_notes?.match(NEEDS_PERSON);
        const problem = match ? `Protected record, so not closed automatically. The source says: ${match[2]}` : linkProblem(job);
        return problem ? [{ ...brief(job), since: match?.[1] ?? null, reason: problem }] : [];
      }),
    },
    collector: run.data ? {
      ranAt: run.data.report_generated_at,
      counts: {
        sourcesReached: run.data.sources_reached, sourcesFailed: run.data.sources_failed, proposedNew: run.data.jobs_proposed_new,
        proposedUpdates: run.data.jobs_proposed_update, proposedClosures: run.data.jobs_proposed_close, manualReview: run.data.jobs_manual_review,
      },
      emailStatus: run.data.email_status,
      proposedAdditions: events.filter((event) => event.event_type === "proposed_add"),
      proposedClosures: events.filter((event) => event.event_type === "proposed_close"),
      manualReview: events.filter((event) => event.event_type === "manual_review"),
      sourceErrors: events.filter((event) => event.event_type === "source_error"),
    } : null,
  });
}

const Body = z.object({
  action: z.enum(["close", "reopen"]),
  jobId: z.string().uuid(),
  reason: z.string().trim().min(3).max(300),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) }, { status: 400 });
  const { action, jobId, reason, deadline } = parsed.data;
  const db = getSupabaseAdminClient();
  const { data: job, error } = await db.from("jobs").select("id,company_name,title,status,data_quality_notes,application_deadline").eq("id", jobId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!job) return NextResponse.json({ error: "No job has that id." }, { status: 404 });
  const wanted = action === "close" ? "active" : "closed";
  if (job.status !== wanted) return NextResponse.json({ error: `The job is ${job.status}, so it cannot be ${action === "close" ? "closed" : "reopened"}.` }, { status: 409 });

  const today = torontoDate();
  const now = new Date().toISOString();
  const nextDeadline = deadline === undefined ? job.application_deadline : deadline;
  if (action === "reopen" && nextDeadline && nextDeadline < today) {
    return NextResponse.json({ error: `The job's deadline (${nextDeadline}) has passed, so the cleaner would close it again tomorrow. Send a new deadline, or null for none.` }, { status: 409 });
  }
  const clean = reason.replace(/[[\]]/g, "");
  const prior = (job.data_quality_notes ?? "").replace(new RegExp(`\\s*(?:${FIRST_STRIKE.source}|${NEEDS_PERSON.source})`, "g"), "").trim();
  const note = action === "close"
    ? `Closed on ${today} at the owner's request through Agent HQ: ${clean}.`
    : `[Owner keeps open since ${today}: ${clean}]`;
  const { error: updateError } = await db.from("jobs").update({
    status: action === "close" ? "closed" : "active",
    data_quality_notes: [prior, note].filter(Boolean).join(" "),
    updated_at: now,
    ...(action === "reopen" ? { last_verified_at: now, application_deadline: nextDeadline } : {}),
  }).eq("id", jobId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ ok: true, job: { id: job.id, company: job.company_name, title: job.title, status: action === "close" ? "closed" : "active" } });
}
