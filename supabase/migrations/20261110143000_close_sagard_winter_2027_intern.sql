-- Remove the Sagard Winter 2027 internship from the public job board while
-- retaining its stable identity for collector deduplication.

UPDATE public.jobs
SET
  status = 'closed',
  featured = false,
  data_quality_notes = concat_ws(
    ' ',
    nullif(trim(data_quality_notes), ''),
    'Removed from the active BSO job board on 2026-11-10.'
  ),
  last_verified_at = now(),
  updated_at = now()
WHERE source_record_id = 'sagard:JR100101'
  AND status = 'active';
