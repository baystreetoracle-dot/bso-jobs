import { createClient } from "@supabase/supabase-js";
import { rankJobs } from "../lib/jobs/ranking.ts";

const SITE_URL = "https://www.baystreetoracle.ca";
const PREFERENCES = {
  careerPath: "Investment Banking",
  seniority: "Intern / Co-op",
  locations: ["Toronto", "Vancouver"],
};
const COMPANY_LOGOS = {
  "Agentis Capital": "agentis-capital.webp",
  "Agentis Capital Advisors": "agentis-capital.webp",
  "BMO Capital Markets": "bmo-capital-markets.webp",
  "CIBC Capital Markets": "cibc-capital-markets.webp",
  "Fort Capital": "fort-capital.webp",
  "Macquarie Capital": "macquariegroup.webp",
  "RBC Capital Markets": "rbc-capital-markets.webp",
  "Scotiabank Global Banking and Markets": "scotiabank-gbm.webp",
};

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

function companyInitials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 3).map((part) => part[0]).join("").toUpperCase();
}

const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});
const today = todayInToronto();
const { data, error } = await supabase.from("jobs")
  .select("id,external_job_id,company_name,title,location_display,city,country,category,seniority,program_type,application_deadline,date_posted,source_name,data_quality_notes")
  .eq("status", "active")
  .eq("category", PREFERENCES.careerPath)
  .or("city.in.(Toronto,Vancouver),location_display.ilike.%Toronto%,location_display.ilike.%Vancouver%")
  .order("application_deadline", { ascending: true, nullsFirst: false });
if (error) throw error;

const eligibleJobs = (data ?? []).filter((job) => {
  const levelSignals = `${job.seniority ?? ""} ${job.program_type ?? ""} ${job.title ?? ""}`;
  return /student|intern|co-?op|summer analyst|winter analyst|fall analyst/i.test(levelSignals)
    && (!job.application_deadline || job.application_deadline >= today);
});
const jobs = rankJobs(eligibleJobs, { today, diversity: false }).map(({ job }) => job);
const attachments = [{ path: `${SITE_URL}/bso-logo.png`, filename: "bso-logo.png", content_id: "bso-logo" }];
const roleRows = jobs.map((job, index) => {
  const filename = COMPANY_LOGOS[job.company_name];
  const contentId = `company-logo-${index}`;
  if (filename) attachments.push({
    path: `${SITE_URL}/company-logos/bso-supplied/${filename}`,
    filename,
    content_id: contentId,
  });
  const logo = filename
    ? `<img src="cid:${contentId}" width="52" alt="${escapeHtml(job.company_name)}" style="display:block;width:52px;max-height:52px;object-fit:contain;border:0">`
    : `<span style="font:800 13px/1 Arial,sans-serif;color:#0b513b">${escapeHtml(companyInitials(job.company_name))}</span>`;
  return `<tr><td style="padding:0 0 24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse"><tr><td width="66" valign="top"><table role="presentation" width="54" height="54" cellspacing="0" cellpadding="0" border="0" style="width:54px;height:54px;border:1px solid #d8ddd8;background:#fff;border-collapse:collapse"><tr><td align="center" valign="middle">${logo}</td></tr></table></td><td valign="top" style="padding-left:12px"><a href="${escapeHtml(jobUrl(job))}" style="color:#087a35;font:700 16px/1.28 Arial,sans-serif;text-decoration:none">${escapeHtml(job.title)}</a><p style="margin:6px 0 0;color:#263b33;font:13px/1.45 Arial,sans-serif">${escapeHtml(job.company_name)} · ${escapeHtml(job.location_display)}</p><p style="margin:4px 0 0;color:#69766f;font:12px/1.45 Arial,sans-serif">${escapeHtml(job.category)} · ${escapeHtml(PREFERENCES.seniority)} · ${escapeHtml(formatDeadline(job.application_deadline))}</p><p style="margin:7px 0 0;color:#69766f;font:12px/1.45 Arial,sans-serif">Matches your career path, level and location preferences</p></td></tr></table></td></tr>`;
}).join("");

const resultSection = jobs.length
  ? `<p style="margin:0 0 24px;color:#344b42;font:14px/1.55 Arial,sans-serif">${jobs.length === 1 ? "One active opportunity matches" : `${jobs.length} active opportunities match`} your preferences.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse">${roleRows}</table>`
  : `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background:#f4f6f3;border-left:4px solid #88a598"><tr><td style="padding:22px"><p style="margin:0 0 7px;color:#103b2f;font:700 17px/1.3 Arial,sans-serif">No new matches this week</p><p style="margin:0;color:#596860;font:14px/1.55 Arial,sans-serif">There are currently no active Investment Banking intern or co-op roles in Toronto or Vancouver. An empty weekly alert would normally be skipped; this message was sent only to test the design and embedded image handling.</p></td></tr></table>`;

const subject = jobs[0]?.title ?? "[TEST] No new Investment Banking intern roles this week";
const preferenceTitle = `Your job alert for ${PREFERENCES.careerPath} ${PREFERENCES.seniority} roles`;
const locationLine = `in ${PREFERENCES.locations.join(" + ")}`;
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>@media(max-width:620px){.email-shell{width:100%!important}.email-pad{padding-left:20px!important;padding-right:20px!important}.email-title{font-size:28px!important}}</style></head><body style="margin:0;padding:0;background:#f2f3f0;color:#10231d"><div style="display:none;max-height:0;overflow:hidden;opacity:0">Investment Banking intern and co-op opportunities in Toronto and Vancouver.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background:#f2f3f0"><tr><td align="center" style="padding:28px 12px"><table class="email-shell" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#fff"><tr><td class="email-pad" style="padding:24px 28px;background:#083e30;color:#fff"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse"><tr><td width="48" valign="middle"><img src="cid:bso-logo" width="42" height="42" alt="BSO" style="display:block;width:42px;height:42px;border:0"></td><td valign="middle" style="padding-left:12px;font:800 13px/1 Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase">BSO Job Alerts</td></tr></table><h1 class="email-title" style="margin:22px 0 8px;font:400 32px/1.08 Georgia,serif">${escapeHtml(preferenceTitle)}</h1><p style="margin:0;color:#c9d8d0;font:15px/1.5 Arial,sans-serif">${escapeHtml(locationLine)}</p></td></tr><tr><td class="email-pad" style="padding:28px">${resultSection}<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:25px;border-collapse:collapse"><tr><td bgcolor="#087a35"><a href="${SITE_URL}/jobs" style="display:inline-block;padding:14px 19px;color:#fff;font:800 12px/1 Arial,sans-serif;letter-spacing:.06em;text-decoration:none;text-transform:uppercase">View all jobs</a></td></tr></table></td></tr><tr><td class="email-pad" style="padding:20px 28px;border-top:1px solid #d9ded9;color:#718078;font:11px/1.55 Arial,sans-serif">This is a test preview requested by the recipient. No subscription preferences were changed.<br>The Bay Street Oracle · <a href="mailto:info@baystreetoracle.ca" style="color:#4e6259">info@baystreetoracle.ca</a></td></tr></table></td></tr></table></body></html>`;
const text = `BSO Job Alerts\n\n${preferenceTitle} ${locationLine}\n\n${jobs.length ? jobs.map((job) => `${job.title}\n${job.company_name} · ${job.location_display}\n${formatDeadline(job.application_deadline)}\n${jobUrl(job)}`).join("\n\n") : "No new matches this week. There are currently no active Investment Banking intern or co-op roles in Toronto or Vancouver."}\n\nView all jobs: ${SITE_URL}/jobs\n\nThis is a test preview requested by the recipient. No subscription preferences were changed.`;

const rawFrom = required("RESEND_FROM_EMAIL");
const senderAddress = rawFrom.match(/<([^<>]+)>/)?.[1] ?? rawFrom;
const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { authorization: `Bearer ${required("RESEND_API_KEY")}`, "content-type": "application/json" },
  body: JSON.stringify({
    from: `BSO Job Alerts <${senderAddress}>`,
    to: [required("TEST_ALERT_RECIPIENT")],
    subject,
    html,
    text,
    attachments,
  }),
});
const resendResult = await response.json();
if (!response.ok) throw new Error(`Resend returned HTTP ${response.status}: ${JSON.stringify(resendResult)}`);
console.log(`Test alert sent with ${jobs.length} matching roles. Resend id: ${resendResult.id}`);
