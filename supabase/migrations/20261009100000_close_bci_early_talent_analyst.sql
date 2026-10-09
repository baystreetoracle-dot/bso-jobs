-- Close the BCI Early Talent Infrastructure & Renewable Resources Analyst role
-- after it was absent from a completed authoritative Workday scan.

UPDATE public.jobs
SET
  status = 'closed',
  featured = false,
  data_quality_notes = concat_ws(
    ' ',
    nullif(data_quality_notes, ''),
    'Closed October 9, 2026 after the role was absent from a completed authoritative BCI Workday scan.'
  ),
  last_verified_at = now(),
  updated_at = now()
WHERE source_record_id = 'bci:JR101589';
