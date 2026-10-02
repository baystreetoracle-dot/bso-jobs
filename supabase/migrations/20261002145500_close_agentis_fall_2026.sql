UPDATE public.jobs
SET
  status = 'closed',
  featured = false,
  data_quality_notes = concat_ws(' ', data_quality_notes, 'Posting confirmed inactive on October 2, 2026.'),
  updated_at = now()
WHERE company_id = 'agentis'
  AND external_job_id = 'url-8dcfcd849b5f0e12cb84';
