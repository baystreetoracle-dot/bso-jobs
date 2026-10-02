import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { rankJobs } from "../lib/jobs/ranking.ts";
import { matchesJobAlertPreferences } from "../lib/job-alerts/preferences.ts";
import { getRecruitingUpdate } from "../lib/jobs/recruiting-updates.ts";
import { createUnsubscribeUrl } from "../lib/job-alerts/unsubscribe.ts";
import { buildJobAlertLogoAttachments } from "../lib/job-alerts/logo-assets.mjs";

const SITE_URL = "https://www.baystreetoracle.ca";
const args = new Set(process.argv.slice(2));
const scheduleMode = args.has("--schedule");
const sendNowMode = args.has("--send-now");
const dryRunMode = args.has("--dry-run");
if ([scheduleMode, sendNowMode, dryRunMode].filter(Boolean).length !== 1) {
  throw new Error("Pass exactly one of --dry-run, --schedule, or --send-now.");
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);
}

function slugify(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").replace(/-{2,}/g, "-");
}

function todayInToronto() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatDeadline(value) {
  if (!value) return "Deadline open";
  const formatted = new Intl.DateTimeFormat("en-CA", {
    month: "short", day: "numeric", timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
  return `Apply by ${formatted}`;
}

function jobUrl(job) {
  const readable = slugify(`${job.company_name} ${job.title} ${job.city ?? job.location_display}`);
  return `${SITE_URL}/jobs/${readable}--${job.id}`;
}

function preferenceLabels(preferences) {
  return {
    careerPath: preferences.careerPaths.length ? preferences.careerPaths.join(" + ") : "capital markets",
    seniority: preferences.seniorities.length ? preferences.seniorities.join(" + ") : "Intern / Co-op + Analyst",
    location: preferences.locations.length ? `in ${preferences.locations.join(" + ")}` : "across Canada",
  };
}

async function renderMessage(subscriber, jobs, eligibleCount, serviceKey) {
  const preferences = {
    careerPaths: subscriber.career_paths ?? [],
    seniorities: subscriber.seniority_preferences ?? [],
    locations: subscriber.location_preferences ?? [],
  };
  const labels = preferenceLabels(preferences);
  const unsubscribeUrl = createUnsubscribeUrl(subscriber.email, serviceKey, SITE_URL);
  const preferenceTitle = `Your job alert for ${labels.careerPath} ${labels.seniority} roles`;
  const { attachments, companyLogoCids } = sendNowMode
    ? await buildJobAlertLogoAttachments(jobs)
    : { attachments: [], companyLogoCids: new Map() };
  const rows = jobs.map((job) => {
    const recruitingUpdate = getRecruitingUpdate(job.external_job_id);
    const logoCid = companyLogoCids.get(job.company_name);
    const logoMarkup = logoCid
      ? `<img src="cid:${escapeHtml(logoCid)}" width="52" height="52" alt="${escapeHtml(job.company_name)} logo" style="display:block;width:52px;height:52px;object-fit:contain;border:1px solid #e2e6e2;background:#fff">`
      : `<div style="width:52px;height:52px;border:1px solid #e2e6e2;background:#f4f6f3;color:#083e30;font:800 12px/52px Arial,sans-serif;text-align:center">${escapeHtml(job.company_name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2))}</div>`;
    const updateMarkup = recruitingUpdate
      ? `<p style="margin:9px 0 0;color:#a22a22;font:700 11px/1.45 Arial,sans-serif;text-transform:uppercase;letter-spacing:.04em">${escapeHtml(recruitingUpdate.label)}</p><p style="margin:3px 0 0;color:#a22a22;font:12px/1.45 Arial,sans-serif">${escapeHtml(recruitingUpdate.note)}</p>`
      : "";
    return `<tr><td style="padding:20px 0;border-top:1px solid #e2e6e2"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse"><tr><td width="68" valign="top" style="width:68px;padding:1px 16px 0 0">${logoMarkup}</td><td valign="top"><p style="margin:0 0 5px;color:#263b33;font:700 12px/1.35 Arial,sans-serif;text-transform:uppercase;letter-spacing:.05em">${escapeHtml(job.company_name)}</p><a href="${escapeHtml(jobUrl(job))}" style="color:#087a35;font:700 16px/1.28 Arial,sans-serif;text-decoration:none">${escapeHtml(job.title)}</a><p style="margin:6px 0 0;color:#263b33;font:13px/1.45 Arial,sans-serif">${escapeHtml(job.location_display)}</p><p style="margin:4px 0 0;color:#69766f;font:12px/1.45 Arial,sans-serif">${escapeHtml(job.category)} · ${escapeHtml(job.seniority ?? "Unspecified")} · ${escapeHtml(formatDeadline(job.application_deadline))}</p>${updateMarkup}<p style="margin:8px 0 0;color:#69766f;font:12px/1.45 Arial,sans-serif">Matches your saved preferences</p></td></tr></table></td></tr>`;
  }).join("");
  const countLine = eligibleCount > jobs.length
    ? `Here are your top ${jobs.length} of ${eligibleCount} active matches.`
    : jobs.length === 1 ? "One active opportunity matches your preferences." : `${jobs.length} active opportunities match your preferences.`;
  const subject = `${jobs[0].company_name}, ${jobs[0].title}`;
  const brandMarkup = sendNowMode
    ? `<img src="cid:bso-logo" width="56" height="56" alt="Bay Street Oracle" style="display:block;width:56px;height:56px;object-fit:cover;border:0"><p style="margin:16px 0 0;font:800 13px/1 Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase">BSO Job Alerts</p>`
    : `<p style="margin:0;font:800 13px/1 Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase">BSO Job Alerts</p>`;
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>@media(max-width:620px){.email-shell{width:100%!important}.email-pad{padding-left:20px!important;padding-right:20px!important}.email-title{font-size:28px!important}}</style></head><body style="margin:0;padding:0;background:#f2f3f0;color:#10231d"><div style="display:none;max-height:0;overflow:hidden;opacity:0">Your personalized Canadian capital-markets opportunities from BSO Jobs.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background:#f2f3f0"><tr><td align="center" style="padding:28px 12px"><table class="email-shell" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#fff"><tr><td class="email-pad" style="padding:24px 28px;background:#083e30;color:#fff">${brandMarkup}<h1 class="email-title" style="margin:18px 0 8px;font:400 32px/1.08 Georgia,serif">${escapeHtml(preferenceTitle)}</h1><p style="margin:0;color:#c9d8d0;font:15px/1.5 Arial,sans-serif">${escapeHtml(labels.location)}</p></td></tr><tr><td class="email-pad" style="padding:28px"><p style="margin:0 0 24px;color:#344b42;font:14px/1.55 Arial,sans-serif">${escapeHtml(countLine)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse">${rows}</table><table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:25px;border-collapse:collapse"><tr><td bgcolor="#087a35"><a href="${SITE_URL}/jobs" style="display:inline-block;padding:14px 19px;color:#fff;font:800 12px/1 Arial,sans-serif;letter-spacing:.06em;text-decoration:none;text-transform:uppercase">View all jobs</a></td></tr></table></td></tr><tr><td class="email-pad" style="padding:20px 28px;border-top:1px solid #d9ded9;color:#718078;font:11px/1.65 Arial,sans-serif">Questions? Email <a href="mailto:info@baystreetoracle.ca" style="color:#4e6259">info@baystreetoracle.ca</a> and we’ll get back to you shortly.<br>You’re receiving this because you subscribed to BSO Job Alerts.<br><a href="${escapeHtml(unsubscribeUrl)}" style="color:#4e6259;text-decoration:underline">Unsubscribe from BSO Job Alerts</a></td></tr></table></td></tr></table></body></html>`;
  const text = `BSO Job Alerts\n\n${preferenceTitle} ${labels.location}\n\n${jobs.map((job) => { const update = getRecruitingUpdate(job.external_job_id); return `${job.title}\n${job.company_name} · ${job.location_display}\n${job.category} · ${job.seniority} · ${formatDeadline(job.application_deadline)}${update ? `\n${update.label}: ${update.note}` : ""}\n${jobUrl(job)}`; }).join("\n\n")}\n\nView all jobs: ${SITE_URL}/jobs\n\nQuestions? Email info@baystreetoracle.ca and we’ll get back to you shortly.\nUnsubscribe: ${unsubscribeUrl}`;
  return { subject, html, text, unsubscribeUrl, preferences, attachments };
}

const supabaseUrl = required("SUPABASE_URL");
const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const [{ data: subscribers, error: subscriberError }, { data: jobs, error: jobsError }] = await Promise.all([
  supabase.from("job_alert_subscribers").select("email,career_paths,seniority_preferences,location_preferences").eq("status", "subscribed").order("created_at"),
  supabase.from("jobs").select("id,external_job_id,company_name,title,location_display,city,country,category,seniority,program_type,application_deadline,date_posted,source_name,data_quality_notes").eq("status", "active").order("application_deadline", { ascending: true, nullsFirst: false }),
]);
if (subscriberError) throw subscriberError;
if (jobsError) throw jobsError;

const today = todayInToronto();
const prepared = [];
for (const subscriber of subscribers ?? []) {
  const preferences = {
    careerPaths: subscriber.career_paths ?? [],
    seniorities: subscriber.seniority_preferences ?? [],
    locations: subscriber.location_preferences ?? [],
  };
  const eligible = (jobs ?? []).filter((job) => matchesJobAlertPreferences(job, preferences)
    && (!job.application_deadline || job.application_deadline >= today));
  const selected = rankJobs(eligible, { today, diversity: true }).slice(0, 8).map(({ job }) => job);
  if (!selected.length) continue;
  prepared.push({ subscriber, selected, message: await renderMessage(subscriber, selected, eligible.length, serviceKey) });
}

console.log(`Active subscribers: ${subscribers?.length ?? 0}`);
console.log(`Personalized alerts prepared: ${prepared.length}`);
console.log(`Skipped with no active matches: ${(subscribers?.length ?? 0) - prepared.length}`);
for (const item of prepared) console.log(`- ${item.message.subject} (${item.selected.length} roles)`);

if (dryRunMode) {
  console.log("Dry run complete. No emails were scheduled or sent.");
  process.exit(0);
}

const scheduledAt = scheduleMode ? required("JOB_ALERT_SCHEDULED_AT") : null;
if (scheduleMode) {
  const scheduledDate = new Date(scheduledAt);
  if (!Number.isFinite(scheduledDate.getTime()) || scheduledDate <= new Date()) throw new Error("JOB_ALERT_SCHEDULED_AT must be a valid future timestamp.");
}
const apiKey = required("RESEND_API_KEY");
const failures = [];
const accepted = [];
for (const item of prepared) {
  const recipientHash = crypto.createHash("sha256").update(item.subscriber.email).digest("hex").slice(0, 20);
  const request = {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "Idempotency-Key": `${sendNowMode ? "bso-job-alert-live-v2" : "bso-job-alert"}-${today}-${recipientHash}`,
    },
    body: JSON.stringify({
      from: "Bay Street Oracle <jobs@baystreetoracle.ca>",
      to: [item.subscriber.email],
      subject: item.message.subject,
      html: item.message.html,
      text: item.message.text,
      ...(scheduleMode ? { scheduled_at: scheduledAt } : { attachments: item.message.attachments }),
      headers: {
        "List-Unsubscribe": `<${item.message.unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      tags: [{ name: "campaign", value: `${sendNowMode ? "live-v2" : "friday"}-${today}` }],
    }),
  };
  let response;
  let result;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await fetch("https://api.resend.com/emails", request);
    result = await response.json();
    if (response.status !== 429) break;
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  if (!response.ok) failures.push({ recipientHash, status: response.status, error: result });
  else accepted.push({ recipientHash, id: result.id, subject: item.message.subject });
  await new Promise((resolve) => setTimeout(resolve, 150));
}

console.log(scheduleMode ? `Scheduled for ${scheduledAt}: ${accepted.length}` : `Sent immediately: ${accepted.length}`);
for (const item of accepted) console.log(`- ${item.id}: ${item.subject}`);
if (failures.length) {
  console.error(`Failed to schedule: ${failures.length}`);
  for (const failure of failures) console.error(JSON.stringify(failure));
  process.exitCode = 1;
}
