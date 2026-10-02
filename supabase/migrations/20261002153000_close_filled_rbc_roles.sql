UPDATE public.jobs
SET
  status = 'closed',
  featured = false,
  data_quality_notes = concat_ws(' ', data_quality_notes, 'Employer page confirmed the position was filled on October 2, 2026.'),
  last_verified_at = now(),
  updated_at = now()
WHERE company_id = 'rbc-capital-markets'
  AND external_job_id = ANY (ARRAY[
    'R-0000189162',
    'R-0000189164',
    'R-0000189234',
    'R-0000178260',
    'R-0000187979'
  ]);
