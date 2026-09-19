UPDATE public.jobs
SET
  status = 'closed',
  data_quality_notes = concat_ws(
    ' ',
    nullif(trim(data_quality_notes), ''),
    'Removed from the active BSO job board on 2026-09-19.'
  ),
  last_verified_at = now(),
  updated_at = now()
WHERE company_id = 'cibc'
  AND external_job_id IN ('2618460', '2617249');
