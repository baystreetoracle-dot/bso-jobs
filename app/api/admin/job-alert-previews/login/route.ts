import crypto from "node:crypto";
import { NextResponse } from "next/server";

function sessionValue(secret: string) {
  return crypto.createHash("sha256").update(`bso-job-alert-previews:${secret}`).digest("hex");
}

function matches(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.JOB_ALERT_PREVIEW_PASSWORD?.trim();
  if (!secret) return new NextResponse("Preview authentication is not configured.", { status: 503 });

  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  if (!matches(password, secret)) {
    return NextResponse.redirect(new URL("/admin/job-alert-previews?error=1", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/admin/job-alert-previews", request.url), 303);
  response.cookies.set("bso_job_alert_preview", sessionValue(secret), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/admin/job-alert-previews",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
