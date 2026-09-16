CREATE TABLE "public"."newsletter_subscribers" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "email"           text                     NOT NULL,
  "status"          text                     NOT NULL DEFAULT 'subscribed'::text,
  "source"          text                     NOT NULL DEFAULT 'jobs-homepage'::text,
  "consent_text"    text                     NOT NULL,
  "subscribed_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "unsubscribed_at" timestamp with time zone,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY (id),
  CONSTRAINT "newsletter_subscribers_email_key" UNIQUE (email),
  CONSTRAINT "newsletter_subscribers_status_check" CHECK ((status = ANY (ARRAY['subscribed'::text, 'unsubscribed'::text])))
);

ALTER TABLE "public"."newsletter_subscribers"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."newsletter_subscribers" FROM "anon", "authenticated";

GRANT SELECT, INSERT, UPDATE ON TABLE "public"."newsletter_subscribers" TO "service_role";

CREATE INDEX newsletter_subscribers_status_idx
  ON public.newsletter_subscribers USING btree (status);

