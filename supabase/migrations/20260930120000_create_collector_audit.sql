CREATE TABLE public.collector_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_generated_at timestamp with time zone NOT NULL UNIQUE,
  source_scope text NOT NULL DEFAULT 'all',
  status text NOT NULL DEFAULT 'completed',
  sources_reached integer NOT NULL DEFAULT 0,
  sources_failed integer NOT NULL DEFAULT 0,
  jobs_proposed_new integer NOT NULL DEFAULT 0,
  jobs_proposed_update integer NOT NULL DEFAULT 0,
  jobs_proposed_close integer NOT NULL DEFAULT 0,
  jobs_manual_review integer NOT NULL DEFAULT 0,
  jobs_excluded integer NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  email_status text NOT NULL DEFAULT 'pending',
  email_sent_at timestamp with time zone,
  email_error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT collector_runs_status_check
    CHECK (status = ANY (ARRAY['completed'::text, 'failed'::text])),
  CONSTRAINT collector_runs_email_status_check
    CHECK (email_status = ANY (ARRAY['pending'::text, 'sent'::text, 'skipped'::text, 'failed'::text]))
);

CREATE TABLE public.collector_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.collector_runs(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  company_name text,
  title text,
  external_job_id text,
  job_id uuid,
  reason text NOT NULL,
  source_url text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT collector_events_type_check
    CHECK (event_type = ANY (ARRAY[
      'proposed_add'::text,
      'proposed_update'::text,
      'proposed_close'::text,
      'manual_review'::text,
      'source_error'::text
    ]))
);

ALTER TABLE public.collector_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.collector_runs FROM anon, authenticated;
REVOKE ALL ON TABLE public.collector_events FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.collector_runs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.collector_events TO service_role;

CREATE INDEX collector_runs_generated_at_idx
  ON public.collector_runs (report_generated_at DESC);
CREATE INDEX collector_events_run_id_idx
  ON public.collector_events (run_id);
CREATE INDEX collector_events_type_idx
  ON public.collector_events (event_type);

COMMENT ON TABLE public.collector_runs IS
  'Internal audit history for scheduled BSO job-collector reconciliation runs.';
COMMENT ON TABLE public.collector_events IS
  'Human-reviewable additions, updates, closures and source failures proposed by a collector run.';
