import { NextResponse } from "next/server";
import { z } from "zod";
import { getIntelligenceAdminClient } from "@/lib/supabase/intelligence-admin";

// Records what the signup form showed: an email field and a "Get early access" button.
const CONSENT_TEXT = "Submitted an email address through the Get early access form on the BSO Intelligence waitlist page.";

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

    const client = getIntelligenceAdminClient();
    if (!client) {
      console.error("Intelligence waitlist signup failed: server environment is not configured.");
      return NextResponse.json({ error: "The waitlist is not open yet. Please try again soon." }, { status: 503 });
    }

    const { error } = await client
      .from("intelligence_waitlist")
      .upsert({
        email: body.data.email.toLowerCase(),
        source: "bso-jobs-intelligence-landing",
        consent_text: CONSENT_TEXT,
      }, { onConflict: "email" });

    if (error) {
      console.error("Intelligence waitlist signup failed:", error.message);
      return NextResponse.json({ error: "Unable to join the waitlist right now. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Intelligence waitlist signup failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Unable to join the waitlist right now. Please try again." }, { status: 500 });
  }
}
