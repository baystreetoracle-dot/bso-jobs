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
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Employer request failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: fallback }, { status: 500 });
  }
}
