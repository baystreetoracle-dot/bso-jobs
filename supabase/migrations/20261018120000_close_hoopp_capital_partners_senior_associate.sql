-- Remove the user-rejected HOOPP Capital Partners role from the public job board
-- while retaining the record as closed for collector deduplication and audit history.

UPDATE public.jobs
SET
  status = 'closed',
  featured = false,
  data_quality_notes = concat_ws(
    ' ',
    data_quality_notes,
    'Removed from the public BSO Jobs platform at editorial direction on 2026-10-18.'
  ),
  last_verified_at = now(),
  updated_at = now()
WHERE source_record_id = 'hoopp:JR102503'
  AND external_job_id = 'JR102503';
