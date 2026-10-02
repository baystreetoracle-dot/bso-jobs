import { NextResponse } from "next/server";
import { isValidUnsubscribeToken } from "@/lib/job-alerts/unsubscribe";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function page(title: string, message: string, status = 200) {
  return new NextResponse(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | BSO Jobs</title></head><body style="margin:0;background:#f2f3f0;color:#10231d;font-family:Arial,sans-serif"><main style="max-width:560px;margin:64px auto;padding:36px;background:#fff;border-top:6px solid #087a35"><p style="margin:0 0 14px;color:#087a35;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">BSO Job Alerts</p><h1 style="margin:0 0 14px;font:400 34px/1.1 Georgia,serif">${title}</h1><p style="margin:0 0 24px;line-height:1.6">${message}</p><a href="https://www.baystreetoracle.ca/jobs" style="color:#087a35;font-weight:700">Return to BSO Jobs</a></main></body></html>`, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";
  const token = url.searchParams.get("token") ?? "";
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!email || !secret || !isValidUnsubscribeToken(email, token, secret)) {
    return page("Invalid unsubscribe link", "This unsubscribe link is invalid or incomplete. Email info@baystreetoracle.ca and we’ll help you.", 400);
  }

  const now = new Date().toISOString();
  const { error } = await getSupabaseAdminClient()
    .from("job_alert_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: now, updated_at: now })
    .eq("email", email);

  if (error) {
    console.error("Job alert unsubscribe failed:", error.message);
    return page("Something went wrong", "We couldn’t update your subscription. Email info@baystreetoracle.ca and we’ll take care of it.", 500);
  }

  return page("You’re unsubscribed", "You will no longer receive BSO Job Alerts. You can sign up again at any time from the job board.");
}
