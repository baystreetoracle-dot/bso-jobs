-- Restore StepStone after an inferred, non-authoritative Greenhouse board slug
-- incorrectly returned 404. The employer-hosted application page remains live.

UPDATE public.jobs
SET
  status = 'active',
  data_quality_notes = trim(concat_ws(
    ' ',
    replace(
      coalesce(data_quality_notes, ''),
      'Employer Greenhouse requisition returned Job not found on October 2, 2026.',
      ''
    ),
    'Restored October 2, 2026 after confirming the employer-hosted application page remains available; the previously inferred Greenhouse board endpoint was not authoritative.'
  )),
  last_verified_at = now(),
  updated_at = now()
WHERE company_id = 'stepstone-group'
  AND external_job_id = '8239658';
