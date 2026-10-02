import { NextResponse } from "next/server";
import { isValidUnsubscribeToken } from "@/lib/job-alerts/unsubscribe";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] ?? character);
}

function page(title: string, message: string, action = "", status = 200) {
  return new NextResponse(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | BSO Jobs</title></head><body style="margin:0;background:#f2f3f0;color:#10231d;font-family:Arial,sans-serif"><main style="max-width:560px;margin:64px auto;padding:36px;background:#fff;border-top:6px solid #087a35"><p style="margin:0 0 14px;color:#087a35;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">BSO Job Alerts</p><h1 style="margin:0 0 14px;font:400 34px/1.1 Georgia,serif">${title}</h1><p style="margin:0 0 24px;line-height:1.6">${message}</p>${action}<a href="https://www.baystreetoracle.ca/jobs" style="display:inline-block;color:#087a35;font-weight:700">Return to BSO Jobs</a></main></body></html>`, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function unsubscribeRequest(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";
  const token = url.searchParams.get("token") ?? "";
  const secrets = [process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.SUPABASE_SECRET_KEY].filter((value): value is string => Boolean(value));
  const valid = email && secrets.some((secret) => isValidUnsubscribeToken(email, token, secret));
  return { email, token, valid };
}

export async function GET(request: Request) {
  const { email, token, valid } = unsubscribeRequest(request);

  if (!valid) {
    return page("Invalid unsubscribe link", "This unsubscribe link is invalid or incomplete. Email info@baystreetoracle.ca and we’ll help you.", "", 400);
  }

  const action = `<form method="post" style="margin:0 0 22px"><input type="hidden" name="email" value="${escapeHtml(email)}"><input type="hidden" name="token" value="${escapeHtml(token)}"><button type="submit" style="display:block;width:100%;margin:0 0 14px;padding:14px 18px;border:0;background:#9f2929;color:#fff;font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;cursor:pointer">Unsubscribe</button></form>`;
  return page("Unsubscribe from job alerts?", "You’ll stop receiving Friday BSO Job Alerts matched to your saved career path, seniority and location preferences. You can sign up again from the job board at any time.", action);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const submittedEmail = String(formData.get("email") ?? "").trim().toLowerCase();
  const submittedToken = String(formData.get("token") ?? "");
  const confirmationUrl = new URL(request.url);
  confirmationUrl.searchParams.set("email", submittedEmail);
  confirmationUrl.searchParams.set("token", submittedToken);
  const { email, valid } = unsubscribeRequest(new Request(confirmationUrl));

  if (!valid) {
    return page("Invalid unsubscribe request", "This unsubscribe request is invalid or incomplete. Email info@baystreetoracle.ca and we’ll help you.", "", 400);
  }

  const now = new Date().toISOString();
  const { error } = await getSupabaseAdminClient()
    .from("job_alert_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: now, updated_at: now })
    .eq("email", email);

  if (error) {
    console.error("Job alert unsubscribe failed:", error.message);
    return page("Something went wrong", "We couldn’t update your subscription. Email info@baystreetoracle.ca and we’ll take care of it.", "", 500);
  }

  return page("You’re unsubscribed", "You will no longer receive BSO Job Alerts. You can sign up again at any time from the job board.");
}
