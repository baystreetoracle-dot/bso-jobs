-- Remove three user-rejected roles from the public board while retaining their
-- records for collector deduplication and audit history.

UPDATE public.jobs
SET
  status = 'closed',
  featured = false,
  data_quality_notes = concat_ws(
    ' ',
    data_quality_notes,
    'Removed from the public BSO Jobs platform at editorial direction on 2026-10-27.'
  ),
  last_verified_at = now(),
  updated_at = now()
WHERE source_record_id IN (
  'bci:JR101352',
  'cpp-investments:JR00735',
  'aimco:JR100934'
);
