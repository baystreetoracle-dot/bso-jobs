-- Restore five RBC roles after direct user verification and protect them from
-- automated stale-job closure until their status is manually reviewed again.

UPDATE public.jobs
SET
  status = 'active',
  data_quality_notes = trim(concat_ws(
    ' ',
    replace(
      coalesce(data_quality_notes, ''),
      'Employer page confirmed the position was filled on October 2, 2026.',
      ''
    ),
    'Manual active override confirmed October 2, 2026; do not auto-close from employer-page status text without editorial review.'
  )),
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
