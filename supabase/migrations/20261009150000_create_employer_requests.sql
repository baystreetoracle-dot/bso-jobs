-- Employer package requests from the private employer page (/employers/<key>).
-- Written server-side with the service role only. Payment columns stay empty until Stripe
-- checkout is added; amounts are whole CAD dollars, set on the server from the package.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS "public"."employer_requests" (
  "id"                         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "package"                    text                     NOT NULL,
  "amount_cad"                 integer,
  "company_name"               text                     NOT NULL,
  "contact_first_name"         text                     NOT NULL,
  "contact_last_name"          text                     NOT NULL,
  "contact_email"              text                     NOT NULL,
  "role_title"                 text,
  "job_url"                    text,
  "notes"                      text,
  "status"                     text                     NOT NULL DEFAULT 'new'::text,
  "payment_status"             text                     NOT NULL DEFAULT 'unpaid'::text,
  "stripe_checkout_session_id" text,
  "stripe_payment_intent_id"   text,
  "utm"                        jsonb,
  "created_at"                 timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"                 timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "employer_requests_pkey" PRIMARY KEY (id),
  CONSTRAINT "employer_requests_package_check" CHECK ((package = ANY (ARRAY['standard'::text, 'featured'::text, 'hiring-boost'::text, 'recruiting-campaign'::text, 'custom'::text]))),
  CONSTRAINT "employer_requests_amount_check" CHECK ((amount_cad IS NULL OR amount_cad >= 0)),
  CONSTRAINT "employer_requests_status_check" CHECK ((status = ANY (ARRAY['new'::text, 'contacted'::text, 'awaiting_payment'::text, 'paid'::text, 'scheduled'::text, 'live'::text, 'completed'::text, 'cancelled'::text]))),
  CONSTRAINT "employer_requests_payment_status_check" CHECK ((payment_status = ANY (ARRAY['unpaid'::text, 'pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text]))),
  CONSTRAINT "employer_requests_stripe_session_key" UNIQUE (stripe_checkout_session_id)
);

ALTER TABLE "public"."employer_requests"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."employer_requests" FROM "anon", "authenticated";

GRANT SELECT, INSERT, UPDATE ON TABLE "public"."employer_requests" TO "service_role";

CREATE INDEX IF NOT EXISTS employer_requests_created_idx
  ON public.employer_requests USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS employer_requests_status_idx
  ON public.employer_requests USING btree (status);
