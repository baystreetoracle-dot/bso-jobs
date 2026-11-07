-- Route the Fort Capital exclusive listing through its dedicated BSO page.
-- The page retains direct email application instructions and the employer PDF.

UPDATE public.jobs
SET
  application_url = '/jobs/fort-capital-investment-banking-analyst-vancouver',
  data_quality_notes = 'BSO Exclusive. Employer-supplied three-page PDF reviewed in full on November 7, 2026. The dedicated BSO page preserves the original PDF and directs applications to Fort Capital by email. Applications remain open until filled.',
  last_verified_at = now(),
  updated_at = now()
WHERE source_record_id = 'bso-exclusive:fort-capital-vancouver-analyst-2026-11';
