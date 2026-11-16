import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { FIRST_STRIKE, NEEDS_PERSON } from "@/lib/jobs/deadline-refresh";
import { verifyJobSource } from "@/lib/jobs/source-verification";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Hunter's way in to BSO Jobs (agent id `jobs` in Agent HQ). Same Bearer token as Agent HQ, HQ_AGENT_TOKEN;
 * this app writes with its own service role, so the agent never holds a database key. His brief is
 * docs/agents/jobs.md.
 *
 *   GET  /jobs/agent-api                                   → the board, the cleaner's results, the latest collector run
 *   POST /jobs/agent-api { action: "close",  jobId, reason, ownerAsked? } → close one job. Hunter decides closures
 *        himself; a job the owner chose to keep open closes only with ownerAsked: true
 *   POST /jobs/agent-api { action: "reopen", jobId, reason, deadline? } → reopen one job and keep it open, on the
 *        owner's instruction; `deadline` (YYYY-MM-DD, or null for none) replaces a deadline that has passed
 *   POST /jobs/agent-api { action: "add", eventId, reason, fields? } → publish a role the collector proposed. The
 *        record comes from the collector's event (employer link, ids, company); `fields` may only tidy what is shown
 *        (title, location, summary, description, deadline…) from the employer's own posting. Refuses duplicates,
 *        and a posting this server finds closed.
 *   POST /jobs/agent-api { action: "check", jobId | eventId } → this server opens the employer's posting (the agent's
 *        own network can't reach career sites) and says live, closed or inconclusive, with the evidence
 */
function authorized(req: NextRequest) {
  const token = process.env.HQ_AGENT_TOKEN;
  const got = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token || token.length < 24 || got.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(token));
}

const torontoDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date());
const OWNER_KEEPS = /\[Owner keeps open/;
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
    ? (await db.from("collector_events").select("id,event_type,company_name,title,external_job_id,job_id,reason,source_url,details").eq("run_id", run.data.id)).data ?? []
    : [];

  const activeJobs = (active.data ?? []) as Row[];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const strip = (list: typeof events) => list.map(({ details, id, ...event }) => event);
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
        return problem ? [{ ...brief(job), since: match?.[1] ?? null, reason: problem, ownerKeepsOpen: OWNER_KEEPS.test(job.data_quality_notes ?? "") }] : [];
      }),
    },
    collector: run.data ? {
      ranAt: run.data.report_generated_at,
      counts: {
        sourcesReached: run.data.sources_reached, sourcesFailed: run.data.sources_failed, proposedNew: run.data.jobs_proposed_new,
        proposedUpdates: run.data.jobs_proposed_update, proposedClosures: run.data.jobs_proposed_close, manualReview: run.data.jobs_manual_review,
      },
      emailStatus: run.data.email_status,
      proposedAdditions: events.filter((event) => event.event_type === "proposed_add").map(({ id, details, ...event }) => ({ eventId: id, ...event, job: (details as { job?: unknown } | null)?.job ?? null })),
      proposedClosures: strip(events.filter((event) => event.event_type === "proposed_close")),
      manualReview: strip(events.filter((event) => event.event_type === "manual_review")),
      sourceErrors: strip(events.filter((event) => event.event_type === "source_error")),
    } : null,
  });
}

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const text = (max: number) => z.string().trim().min(1).max(max);
const JobChange = z.object({
  action: z.enum(["close", "reopen"]),
  jobId: z.string().uuid(),
  reason: z.string().trim().min(3).max(300),
  deadline: date.nullable().optional(),
  ownerAsked: z.boolean().optional(),
});
const Check = z.object({
  action: z.literal("check"),
  jobId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
}).refine((value) => Boolean(value.jobId) !== Boolean(value.eventId), { message: "Send exactly one of jobId or eventId." });

async function checkPosting(body: z.infer<typeof Check>) {
  const db = getSupabaseAdminClient();
  let job: { external_job_id: string; title: string; company_name: string; application_url: string; source_url: string } | null = null;
  if (body.jobId) {
    const { data, error } = await db.from("jobs").select("external_job_id,title,company_name,application_url,source_url").eq("id", body.jobId).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    job = data ? { external_job_id: data.external_job_id ?? "", title: data.title, company_name: data.company_name, application_url: data.application_url ?? "", source_url: data.source_url ?? "" } : null;
  } else {
    const { data, error } = await db.from("collector_events").select("details").eq("id", body.eventId!).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const proposed = (data?.details as { job?: Record<string, string | null> } | null)?.job;
    job = proposed ? { external_job_id: proposed.external_job_id ?? "", title: proposed.title ?? "", company_name: proposed.company_name ?? "", application_url: proposed.application_url ?? "", source_url: proposed.source_url ?? "" } : null;
  }
  if (!job) return NextResponse.json({ error: "Nothing has that id." }, { status: 404 });
  return NextResponse.json({ ok: true, ...(await verifyJobSource(job)) });
}

const Add = z.object({
  action: z.literal("add"),
  eventId: z.string().uuid(),
  reason: z.string().trim().min(3).max(300),
  fields: z.object({
    title: text(200), location_display: text(120), city: text(80).nullable(), province: text(40).nullable(),
    workplace_type: z.enum(["On-site", "Hybrid", "Remote"]).nullable(), category: text(80), specialization: text(120).nullable(),
    seniority: text(60).nullable(), employment_type: text(60).nullable(), program_type: text(80).nullable(),
    application_deadline: date.nullable(), date_posted: date.nullable(), summary: text(600), description_text: text(12000),
  }).partial().strict().optional(),
});

async function addJob(body: z.infer<typeof Add>) {
  const db = getSupabaseAdminClient();
  const { data: event, error } = await db.from("collector_events").select("event_type,details,created_at").eq("id", body.eventId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!event || event.event_type !== "proposed_add") return NextResponse.json({ error: "No collector proposal has that id." }, { status: 404 });
  if (event.created_at < daysAgo(7)) return NextResponse.json({ error: "That proposal is more than a week old; wait for a fresh collector run." }, { status: 409 });
  const proposed = (event.details as { job?: Record<string, unknown> } | null)?.job;
  const str = (key: string) => (typeof proposed?.[key] === "string" && proposed[key] ? String(proposed[key]) : null);
  const companyId = str("company_id"), companyName = str("company_name"), externalId = str("external_job_id");
  const sourceUrl = str("source_url") ?? str("application_url");
  const applyUrl = str("application_url") ?? sourceUrl;
  if (!companyId || !companyName || !externalId || !sourceUrl || !/^https:\/\//.test(sourceUrl)) {
    return NextResponse.json({ error: "The proposal lacks a company, requisition id or https employer link, so it cannot be published." }, { status: 422 });
  }
  if (/linkedin\.com/i.test(`${sourceUrl} ${applyUrl}`)) return NextResponse.json({ error: "LinkedIn links are never published." }, { status: 422 });
  const recordId = str("source_record_id") ?? `${companyId}:${externalId}`;
  const fields = body.fields ?? {};
  const title = fields.title ?? str("title");
  if (!title) return NextResponse.json({ error: "The proposal has no title." }, { status: 422 });

  // Duplicates: the same requisition, the same posting link, or the same company and title already live.
  const urls = [...new Set([sourceUrl, applyUrl].filter(Boolean))] as string[];
  const [byRecord, byReq, byUrl, byTitle] = await Promise.all([
    db.from("jobs").select("id,status").eq("source_record_id", recordId),
    db.from("jobs").select("id,status").eq("company_id", companyId).eq("external_job_id", externalId),
    db.from("jobs").select("id").eq("status", "active").or(urls.flatMap((url) => [`source_url.eq."${url}"`, `application_url.eq."${url}"`]).join(",")),
    db.from("jobs").select("id").eq("status", "active").eq("company_id", companyId).ilike("title", title.replace(/[\\%_]/g, "\\$&")),
  ]);
  const lookupError = byRecord.error ?? byReq.error ?? byUrl.error ?? byTitle.error;
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  const existing = byRecord.data?.[0] ?? byReq.data?.[0];
  if (existing?.status === "active" || byUrl.data?.length || byTitle.data?.length) {
    const id = existing?.status === "active" ? existing.id : byUrl.data?.[0]?.id ?? byTitle.data?.[0]?.id;
    return NextResponse.json({ error: `Already on the board (job ${id}).`, duplicateOf: id }, { status: 409 });
  }

  const check = await verifyJobSource({ external_job_id: externalId, title, company_name: companyName, application_url: applyUrl ?? sourceUrl, source_url: sourceUrl });
  if (check.state === "closed") return NextResponse.json({ error: `The employer's posting is closed: ${check.reason}`, check }, { status: 409 });

  const today = torontoDate();
  const now = new Date().toISOString();
  const pick = <K extends keyof typeof fields>(key: K, fallback: string | null) => (fields[key] !== undefined ? fields[key] : fallback);
  const posted = (fields.date_posted ?? str("date_posted"))?.slice(0, 10) ?? null;
  const deadline = (pick("application_deadline", str("application_deadline")) as string | null) ?? check.deadline;
  if (deadline && deadline < today) return NextResponse.json({ error: "The deadline has passed." }, { status: 409 });
  const row = {
    external_job_id: externalId, company_id: companyId, company_name: companyName, title,
    location_display: pick("location_display", str("location_display")), city: pick("city", str("city")),
    province: pick("province", str("province")), country: str("country") ?? "Canada",
    workplace_type: pick("workplace_type", null), category: pick("category", str("category")),
    specialization: pick("specialization", str("specialization")), seniority: pick("seniority", str("seniority")),
    employment_type: pick("employment_type", str("employment_type")), program_type: pick("program_type", str("program_type")),
    date_posted: posted && /^\d{4}-\d{2}-\d{2}$/.test(posted) ? posted : null, application_deadline: deadline,
    application_url: applyUrl, source_url: sourceUrl, source_name: str("source_name") ?? `${companyName} public careers site`,
    status: "active", featured: false, summary: pick("summary", str("summary")),
    ...(fields.description_text ? { description_text: fields.description_text, description_status: "verified", description_verified_at: now } : {}),
    source_record_id: recordId,
    data_quality_notes: `Published by Hunter on ${today} from the collector's proposal: ${body.reason.replace(/[[\]]/g, "")}.`,
    last_verified_at: now, updated_at: now,
  };
  const write = existing
    ? db.from("jobs").update(row).eq("id", existing.id).select("id").single()
    : db.from("jobs").insert(row).select("id").single();
  const { data: saved, error: saveError } = await write;
  if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 });
  return NextResponse.json({ ok: true, check: { state: check.state, reason: check.reason }, reopenedClosedRecord: Boolean(existing), job: { id: saved.id, company: companyName, title, status: "active", url: sourceUrl } });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const raw = await req.json().catch(() => null);
  if (raw?.action === "check") {
    const check = Check.safeParse(raw);
    if (!check.success) return NextResponse.json({ error: check.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) }, { status: 400 });
    return checkPosting(check.data);
  }
  if (raw?.action === "add") {
    const add = Add.safeParse(raw);
    if (!add.success) return NextResponse.json({ error: add.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) }, { status: 400 });
    return addJob(add.data);
  }
  const parsed = JobChange.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) }, { status: 400 });
  const { action, jobId, reason, deadline, ownerAsked } = parsed.data;
  const db = getSupabaseAdminClient();
  const { data: job, error } = await db.from("jobs").select("id,company_name,title,status,data_quality_notes,application_deadline").eq("id", jobId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!job) return NextResponse.json({ error: "No job has that id." }, { status: 404 });
  const wanted = action === "close" ? "active" : "closed";
  if (job.status !== wanted) return NextResponse.json({ error: `The job is ${job.status}, so it cannot be ${action === "close" ? "closed" : "reopened"}.` }, { status: 409 });
  if (action === "close" && !ownerAsked && OWNER_KEEPS.test(job.data_quality_notes ?? "")) {
    return NextResponse.json({ error: "The owner chose to keep this job open. Ask in Agent HQ, and close it only with ownerAsked: true." }, { status: 409 });
  }

  const today = torontoDate();
  const now = new Date().toISOString();
  const nextDeadline = deadline === undefined ? job.application_deadline : deadline;
  if (action === "reopen" && nextDeadline && nextDeadline < today) {
    return NextResponse.json({ error: `The job's deadline (${nextDeadline}) has passed, so the cleaner would close it again tomorrow. Send a new deadline, or null for none.` }, { status: 409 });
  }
  const clean = reason.replace(/[[\]]/g, "");
  const prior = (job.data_quality_notes ?? "").replace(new RegExp(`\\s*(?:${FIRST_STRIKE.source}|${NEEDS_PERSON.source})`, "g"), "").trim();
  const note = action === "close"
    ? (ownerAsked ? `Closed on ${today} at the owner's request through Agent HQ: ${clean}.` : `Closed on ${today} by Hunter: ${clean}.`)
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
