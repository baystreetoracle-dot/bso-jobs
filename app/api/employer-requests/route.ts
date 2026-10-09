import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { EMPLOYER_EMAIL, PACKAGE_AMOUNTS } from "@/lib/employers/packages";

const text = (max: number) => z.string().trim().max(max);
const optional = (max: number) => text(max).optional().transform((value) => value || null);

const requestSchema = z.object({
  key: z.string().min(1).max(200),
  package: z.enum(["standard", "featured", "hiring-boost", "recruiting-campaign", "custom"]),
  companyName: text(160).min(1),
  firstName: text(80).min(1),
  lastName: text(80).min(1),
  email: z.string().trim().email().max(254),
  roleTitle: optional(200),
  jobUrl: z.union([z.string().trim().url().max(500), z.literal("")]).optional().transform((value) => value || null),
  notes: optional(2000),
  utm: z.record(z.string().max(200)).optional(),
  website: z.string().max(0).optional(),
});

const fallback = `Unable to send your request right now. Please email ${EMPLOYER_EMAIL}.`;

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check the highlighted details and try again." }, { status: 400 });
    }
    const body = parsed.data;

    // The employer page is private; requests must come from it.
    const pageKey = process.env.EMPLOYER_PAGE_KEY;
    if (!pageKey || body.key !== pageKey) {
      return NextResponse.json({ error: fallback }, { status: 403 });
    }

    const { error } = await getSupabaseAdminClient()
      .from("employer_requests")
      .insert({
        package: body.package,
        amount_cad: PACKAGE_AMOUNTS[body.package],
        company_name: body.companyName,
        contact_first_name: body.firstName,
        contact_last_name: body.lastName,
        contact_email: body.email.toLowerCase(),
        role_title: body.roleTitle,
        job_url: body.jobUrl,
        notes: body.notes,
        utm: body.utm && Object.keys(body.utm).length ? body.utm : null,
      });

    if (error) {
      console.error("Employer request failed:", error.message);
      return NextResponse.json({ error: fallback }, { status: 500 });
    }
    // The request is saved; the notification is best-effort and never fails the request.
    await notifyTeam(body).catch((notifyError) => console.error("Employer request email failed:", notifyError instanceof Error ? notifyError.message : notifyError));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Employer request failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: fallback }, { status: 500 });
  }
}

const PACKAGE_NAMES: Record<string, string> = {
  standard: "Standard listing (free)",
  featured: "Featured listing (C$149)",
  "hiring-boost": "Hiring boost (C$249)",
  "recruiting-campaign": "Featured recruiting campaign (C$399)",
  custom: "Custom campaign",
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

/** Emails each new request to the BSO team through Resend; Reply goes straight to the employer. */
async function notifyTeam(body: z.infer<typeof requestSchema>) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("Employer request saved; RESEND_API_KEY is not set, so no notification was sent.");
    return;
  }
  const to = process.env.EMPLOYER_REQUEST_NOTIFY_TO || EMPLOYER_EMAIL;
  const packageName = PACKAGE_NAMES[body.package] ?? body.package;
  const rows: [string, string | null | undefined][] = [
    ["Package", packageName],
    ["Company", body.companyName],
    ["Contact", `${body.firstName} ${body.lastName}`],
    ["Email", body.email],
    ["Role", body.roleTitle],
    ["Job posting", body.jobUrl],
    ["Notes", body.notes],
  ];
  const filled = rows.filter((row): row is [string, string] => Boolean(row[1]));
  const text = `New employer request on BSO Jobs\n\n${filled.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\nReply to this email to respond to ${body.firstName}. All requests are also saved in Supabase (employer_requests).`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#10231d;max-width:560px"><p style="margin:0 0 6px;color:#007800;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase">BSO for employers</p><h1 style="margin:0 0 18px;font:400 26px/1.15 Georgia,serif">New request from ${escapeHtml(body.companyName)}</h1><table style="border-collapse:collapse;width:100%;font-size:14px">${filled.map(([label, value]) => `<tr><td style="padding:9px 12px 9px 0;border-top:1px solid #cbd3c9;color:#637169;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:9px 0;border-top:1px solid #cbd3c9;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`).join("")}</table><p style="margin:18px 0 0;color:#637169;font-size:12px">Reply to this email to respond to ${escapeHtml(body.firstName)}. All requests are also saved in Supabase (employer_requests).</p></div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: "BSO Jobs <jobs@baystreetoracle.ca>",
      to: [to],
      reply_to: body.email,
      subject: `New employer request: ${body.companyName} — ${packageName}`,
      text,
      html,
    }),
  });
  if (!response.ok) throw new Error(`Resend returned HTTP ${response.status}`);
}
