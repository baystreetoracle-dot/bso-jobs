CREATE TABLE public.job_alert_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'subscribed',
  career_paths text[] NOT NULL DEFAULT '{}',
  seniority_preferences text[] NOT NULL DEFAULT '{}',
  location_preferences text[] NOT NULL DEFAULT '{}',
  signup_source text NOT NULL,
  consent_text text NOT NULL,
  subscribed_at timestamp with time zone NOT NULL DEFAULT now(),
  unsubscribed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT job_alert_subscribers_status_check
    CHECK (status = ANY (ARRAY['subscribed'::text, 'unsubscribed'::text]))
);

ALTER TABLE public.job_alert_subscribers ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.job_alert_subscribers FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.job_alert_subscribers TO service_role;

CREATE INDEX job_alert_subscribers_status_idx
  ON public.job_alert_subscribers USING btree (status);

COMMENT ON TABLE public.job_alert_subscribers IS
  'Email subscriptions and matching preferences captured by the BSO Jobs alert experience.';

