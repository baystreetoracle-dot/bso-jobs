ALTER TABLE public.jobs
  ADD COLUMN description_text text,
  ADD COLUMN description_status text NOT NULL DEFAULT 'missing',
  ADD COLUMN description_verified_at timestamp with time zone;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_description_status_check
  CHECK (description_status = ANY (ARRAY['missing'::text, 'verified'::text, 'partial'::text, 'unavailable'::text]));

COMMENT ON COLUMN public.jobs.description_text IS
  'Complete plain-text employer job description, captured from the job source after title and requisition verification.';

COMMENT ON COLUMN public.jobs.description_status IS
  'Verification state for description_text. Only verified descriptions may be used for JobPosting structured data.';

COMMENT ON COLUMN public.jobs.description_verified_at IS
  'Timestamp when the employer source, requisition identity, and description were last verified.';
