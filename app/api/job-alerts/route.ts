import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const CONSENT_TEXT = "I agree to receive relevant BSO Jobs opportunity alerts by email. I can unsubscribe at any time.";
const careerPaths = ["Investment Banking", "Other"] as const;
const seniorities = ["Intern / Co-op", "Analyst", "Associate", "Other"] as const;
const locations = ["Toronto", "Calgary", "Montreal", "Vancouver", "Other"] as const;

const signupSchema = z.object({
  email: z.string().trim().email().max(254),
  website: z.string().max(0).optional(),
  signupSource: z.enum(["delayed-modal", "jobs-inline", "job-page", "contextual-page"]),
  careerPaths: z.array(z.enum(careerPaths)).max(careerPaths.length).optional(),
  seniorityPreferences: z.array(z.enum(seniorities)).max(seniorities.length).optional(),
  locationPreferences: z.array(z.enum(locations)).max(locations.length).optional(),
  savePreferences: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = signupSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Enter a valid email address and try again." }, { status: 400 });
    }

    const email = body.data.email.toLowerCase();
    const now = new Date().toISOString();
    const supabase = getSupabaseAdminClient();
    const baseUpdate = {
      status: "subscribed",
      signup_source: body.data.signupSource,
      consent_text: CONSENT_TEXT,
      subscribed_at: now,
      unsubscribed_at: null,
      updated_at: now,
    };

    const { data: existing, error: lookupError } = await supabase
      .from("job_alert_subscribers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) throw lookupError;

    const preferences = body.data.savePreferences ? {
      career_paths: body.data.careerPaths ?? [],
      seniority_preferences: body.data.seniorityPreferences ?? [],
      location_preferences: body.data.locationPreferences ?? [],
    } : {};

    const result = existing
      ? await supabase.from("job_alert_subscribers").update({ ...baseUpdate, ...preferences }).eq("id", existing.id)
      : await supabase.from("job_alert_subscribers").insert({ email, ...baseUpdate, ...preferences });

    if (result.error) throw result.error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Job alert signup failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Unable to save your alert right now. Please try again." }, { status: 500 });
  }
}
