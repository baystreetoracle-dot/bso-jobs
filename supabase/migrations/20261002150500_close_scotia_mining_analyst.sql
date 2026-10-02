UPDATE public.jobs
SET
  status = 'closed',
  featured = false,
  data_quality_notes = concat_ws(' ', data_quality_notes, 'Removed from the active BSO job board on October 2, 2026.'),
  updated_at = now()
WHERE company_id = 'scotiabank'
  AND external_job_id = '272530';
