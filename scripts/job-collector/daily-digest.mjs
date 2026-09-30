import { appendFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = raw.match(/^\s*([^#=]+)=(.*)$/);
    if (match && process.env[match[1].trim()] === undefined) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}
loadEnv(resolve(".env.local"));

const reportsDir = resolve("scripts/job-collector/reports");
const requestedReport = process.argv.find((value) => value.startsWith("--report="))?.slice("--report=".length);
const reportPath = requestedReport
  ? resolve(requestedReport)
  : readdirSync(reportsDir).filter((name) => /^dry-run-.+\.json$/.test(name)).sort().at(-1);
if (!reportPath) throw new Error("No collector JSON report was found.");
const absoluteReportPath = requestedReport ? reportPath : resolve(reportsDir, reportPath);
const report = JSON.parse(readFileSync(absoluteReportPath, "utf8"));

const reconciliation = report.reconciliation ?? {};
const sourceReports = report.sourceReports ?? [];
const manualReview = report.manualReview ?? [];
const rejectionTotals = report.rejectionTotals ?? {};
const counts = {
  reached: sourceReports.filter((item) => !item.error).length,
  failed: sourceReports.filter((item) => item.error).length,
  added: reconciliation.newJobs?.length ?? 0,
  updated: reconciliation.updated?.length ?? 0,
  closed: reconciliation.closed?.length ?? 0,
  review: manualReview.length,
  excluded: Object.values(rejectionTotals).reduce((sum, value) => sum + Number(value || 0), 0),
};

const eventRows = [
  ...(reconciliation.newJobs ?? []).map((item) => ({
    event_type: "proposed_add", company_name: item.job.company_name, title: item.job.title,
    external_job_id: item.job.external_job_id, reason: item.reason ?? "New qualifying requisition found on an employer source.",
    source_url: item.job.source_url, details: { confidence: item.confidence ?? null, job: item.job },
  })),
  ...(reconciliation.updated ?? []).map((item) => ({
    event_type: "proposed_update", company_name: item.proposed.job.company_name, title: item.proposed.job.title,
    external_job_id: item.proposed.job.external_job_id, job_id: item.current.id,
    reason: "Authoritative source metadata differs from the stored job.", source_url: item.proposed.job.source_url,
    details: { changes: item.changes },
  })),
  ...(reconciliation.closed ?? []).map((item) => ({
    event_type: "proposed_close", company_name: item.job.company_name, title: item.job.title,
    external_job_id: item.job.external_job_id, job_id: item.job.id, reason: item.reason,
    source_url: item.job.source_url, details: {},
  })),
  ...manualReview.map((item) => ({
    event_type: "manual_review", company_name: item.firm ?? item.job?.company_name ?? null,
    title: item.title ?? item.job?.title ?? null, external_job_id: item.job?.external_job_id ?? null,
    job_id: item.job?.id ?? null, reason: item.reason, source_url: item.job?.source_url ?? null,
    details: {},
  })),
  ...sourceReports.filter((item) => item.error).map((item) => ({
    event_type: "source_error", company_name: item.firm.name, title: null, external_job_id: null,
    reason: item.error, source_url: item.firm.careersUrl, details: { provider: item.firm.provider },
  })),
];

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("SUPABASE_URL and a server-side Supabase key are required for the daily digest.");
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const runValues = {
  report_generated_at: report.generatedAt,
  source_scope: process.env.COLLECTOR_SOURCE_SCOPE ?? "all",
  status: "completed",
  sources_reached: counts.reached,
  sources_failed: counts.failed,
  jobs_proposed_new: counts.added,
  jobs_proposed_update: counts.updated,
  jobs_proposed_close: counts.closed,
  jobs_manual_review: counts.review,
  jobs_excluded: counts.excluded,
  summary: { rejectionTotals, duplicates: report.duplicates?.length ?? 0 },
  updated_at: new Date().toISOString(),
};
const { data: run, error: runError } = await supabase.from("collector_runs")
  .upsert(runValues, { onConflict: "report_generated_at" }).select("id").single();
if (runError) throw runError;
const { error: clearError } = await supabase.from("collector_events").delete().eq("run_id", run.id);
if (clearError) throw clearError;
if (eventRows.length) {
  const { error: eventError } = await supabase.from("collector_events").insert(eventRows.map((event) => ({ ...event, run_id: run.id })));
  if (eventError) throw eventError;
}

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
const section = (title, type, emptyText) => {
  const items = eventRows.filter((event) => event.event_type === type);
  return `<h2>${escapeHtml(title)} (${items.length})</h2>${items.length ? `<ul>${items.map((item) => `<li><strong>${escapeHtml([item.company_name,item.title].filter(Boolean).join(" — "))}</strong><br>${escapeHtml(item.reason)}${item.source_url ? `<br><a href="${escapeHtml(item.source_url)}">Employer source</a>` : ""}</li>`).join("")}</ul>` : `<p>${escapeHtml(emptyText)}</p>`}`;
};
const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", dateStyle: "long" }).format(new Date(report.generatedAt));
const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#10231d;max-width:760px;margin:auto;padding:24px"><h1>BSO Jobs collector digest</h1><p>${escapeHtml(date)}</p><p><strong>${counts.reached}</strong> sources reached · <strong>${counts.failed}</strong> failed · <strong>${counts.excluded}</strong> postings excluded</p>${section("Proposed additions","proposed_add","No new qualifying jobs found.")}${section("Proposed updates","proposed_update","No job metadata changes found.")}${section("Proposed closures","proposed_close","No jobs proposed for closure.")}${section("Needs review","manual_review","No manual-review items.")}${section("Source failures","source_error","All configured sources completed.")}<p><small>This is a review digest. The discovery collector did not publish or close jobs automatically.</small></p></body></html>`;
const text = `BSO Jobs collector digest — ${date}\n\nSources reached: ${counts.reached}\nSources failed: ${counts.failed}\nProposed additions: ${counts.added}\nProposed updates: ${counts.updated}\nProposed closures: ${counts.closed}\nManual review: ${counts.review}\nExcluded: ${counts.excluded}\n\n${eventRows.map((item) => `[${item.event_type}] ${[item.company_name,item.title].filter(Boolean).join(" — ")}\n${item.reason}\n${item.source_url ?? ""}`).join("\n\n")}\n`;
writeFileSync(resolve(reportsDir, "daily-digest.html"), html, "utf8");
writeFileSync(resolve(reportsDir, "daily-digest.txt"), text, "utf8");

const resendKey = process.env.RESEND_API_KEY;
const recipient = process.env.INTERNAL_DIGEST_EMAIL;
const from = process.env.RESEND_FROM_EMAIL;
let emailStatus = "skipped";
let emailError = null;
if (resendKey && recipient && from) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${resendKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: recipient.split(",").map((item) => item.trim()).filter(Boolean), subject: `BSO Jobs daily collector: ${counts.added} new, ${counts.closed} closures, ${counts.failed} source failures`, html, text }),
  });
  if (response.ok) emailStatus = "sent";
  else { emailStatus = "failed"; emailError = `Resend returned HTTP ${response.status}: ${await response.text()}`; }
}
const { error: emailUpdateError } = await supabase.from("collector_runs").update({
  email_status: emailStatus,
  email_sent_at: emailStatus === "sent" ? new Date().toISOString() : null,
  email_error: emailError,
  updated_at: new Date().toISOString(),
}).eq("id", run.id);
if (emailUpdateError) throw emailUpdateError;

const summary = `## BSO Jobs collector digest\n\n| Result | Count |\n|---|---:|\n| Sources reached | ${counts.reached} |\n| Sources failed | ${counts.failed} |\n| Proposed additions | ${counts.added} |\n| Proposed updates | ${counts.updated} |\n| Proposed closures | ${counts.closed} |\n| Manual review | ${counts.review} |\n| Excluded | ${counts.excluded} |\n\nEmail: **${emailStatus}**\n`;
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
console.log(summary);
if (emailError) throw new Error(emailError);
