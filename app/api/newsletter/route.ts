import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const CONSENT_TEXT = "I agree to receive The BSO Briefing by email. I can unsubscribe at any time.";

const signupSchema = z.object({
  email: z.string().trim().email().max(254),
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  try {
    const body = signupSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { error } = await getSupabaseAdminClient()
      .from("newsletter_subscribers")
      .upsert({
        email: body.data.email.toLowerCase(),
        status: "subscribed",
        source: "jobs-homepage",
        consent_text: CONSENT_TEXT,
        subscribed_at: now,
        unsubscribed_at: null,
        updated_at: now,
      }, { onConflict: "email" });

    if (error) {
      console.error("Newsletter signup failed:", error.message);
      return NextResponse.json({ error: "Unable to subscribe right now. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Newsletter signup failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Unable to subscribe right now. Please try again." }, { status: 500 });
  }
}

