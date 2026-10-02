import { createClient } from "@supabase/supabase-js";

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
})[character]);

const slugify = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").replace(/-{2,}/g, "-");

const todayInToronto = () => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const formatDeadline = (value) => value
  ? `Apply by ${new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`))}`
  : "Deadline open";

const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const today = todayInToronto();
const { data, error } = await supabase.from("jobs")
  .select("id,company_name,title,location_display,city,category,seniority,application_deadline,date_posted")
  .eq("status", "active")
  .eq("seniority", "Intern / Co-op")
  .or("city.eq.Toronto,location_display.ilike.%Toronto%")
  .order("application_deadline", { ascending: true, nullsFirst: false });
if (error) throw error;

const jobs = (data ?? []).filter((job) => !job.application_deadline || job.application_deadline >= today);
if (!jobs.length) throw new Error("No active Toronto Intern / Co-op roles are available for the preview.");

const siteUrl = "https://www.baystreetoracle.ca";
const logoByCompany = {
  "StepStone Group": `${siteUrl}/company-logos/bso-supplied/stepstone-group.jpg`,
};
const jobUrl = (job) => `${siteUrl}/jobs/${slugify(`${job.company_name} ${job.title} ${job.city ?? job.location_display}`)}--${job.id}`;
const roleRows = jobs.map((job) => `<tr><td style="padding:0 0 22px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse"><tr><td width="62" valign="top"><div style="width:50px;height:50px;border:1px solid #d9ded9;background:#fff;display:flex;align-items:center;justify-content:center"><img src="${escapeHtml(logoByCompany[job.company_name] ?? `${siteUrl}/favicon.svg`)}" width="48" height="48" alt="${escapeHtml(job.company_name)}" style="display:block;object-fit:contain"></div></td><td valign="top"><a href="${escapeHtml(jobUrl(job))}" style="color:#006b36;font:700 16px/1.25 Arial,sans-serif;text-decoration:none">${escapeHtml(job.title)}</a><div style="margin-top:5px;color:#263b33;font:13px/1.45 Arial,sans-serif">${escapeHtml(job.company_name)} · ${escapeHtml(job.location_display)}</div><div style="margin-top:5px;color:#66736d;font:12px/1.4 Arial,sans-serif">${escapeHtml(job.category)} · ${escapeHtml(job.seniority)} · ${escapeHtml(formatDeadline(job.application_deadline))}</div><div style="margin-top:7px;color:#66736d;font:12px/1.4 Arial,sans-serif">Matches: Intern / Co-op · Toronto</div></td></tr></table></td></tr>`).join("");

const subject = `[TEST] Your Friday BSO job alert — ${jobs.length} Toronto intern ${jobs.length === 1 ? "role" : "roles"}`;
const html = `<!doctype html><html><body style="margin:0;background:#f2f3f0;color:#10231d"><div style="display:none;max-height:0;overflow:hidden">New Toronto intern and co-op opportunities matching your preferences.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f2f3f0"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#fff"><tr><td style="padding:24px 28px;background:#083e30;color:#fff"><div style="font:800 13px/1 Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase">BSO Job Alerts</div><h1 style="margin:18px 0 7px;font:400 30px/1.08 Georgia,serif">Your Friday job alert</h1><p style="margin:0;color:#c9d8d0;font:14px/1.5 Arial,sans-serif">Intern / Co-op roles in Toronto</p></td></tr><tr><td style="padding:28px"><p style="margin:0 0 24px;color:#344b42;font:14px/1.55 Arial,sans-serif">${jobs.length === 1 ? "One active opportunity matches" : `${jobs.length} active opportunities match`} your preferences.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">${roleRows}</table><a href="${siteUrl}/jobs" style="display:inline-block;padding:13px 18px;background:#087a35;color:#fff;font:800 12px/1 Arial,sans-serif;letter-spacing:.06em;text-decoration:none;text-transform:uppercase">View all jobs</a></td></tr><tr><td style="padding:20px 28px;border-top:1px solid #d9ded9;color:#718078;font:11px/1.5 Arial,sans-serif">This is a test preview requested by the recipient. No subscription preferences were changed.<br>The Bay Street Oracle · <a href="mailto:info@baystreetoracle.ca" style="color:#4e6259">info@baystreetoracle.ca</a></td></tr></table></td></tr></table></body></html>`;
const text = `BSO Job Alerts\n\nYour Friday job alert\nIntern / Co-op roles in Toronto\n\n${jobs.map((job) => `${job.title}\n${job.company_name} · ${job.location_display}\n${job.category} · ${job.seniority} · ${formatDeadline(job.application_deadline)}\n${jobUrl(job)}`).join("\n\n")}\n\nView all jobs: ${siteUrl}/jobs\n\nThis is a test preview requested by the recipient. No subscription preferences were changed.`;

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
  }),
});
const result = await response.json();
if (!response.ok) throw new Error(`Resend returned HTTP ${response.status}: ${JSON.stringify(result)}`);
console.log(`Test alert sent with ${jobs.length} matching role. Resend id: ${result.id}`);
