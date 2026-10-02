UPDATE public.jobs
SET
  status = 'closed',
  featured = false,
  data_quality_notes = concat_ws(' ', data_quality_notes, 'Employer Greenhouse requisition returned Job not found on October 2, 2026.'),
  last_verified_at = now(),
  updated_at = now()
WHERE company_id = 'stepstone-group'
  AND external_job_id = '8239658';
