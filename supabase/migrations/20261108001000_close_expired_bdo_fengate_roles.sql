-- Close roles that disappeared from completed authoritative Workday scans and
-- whose requisition-specific employer endpoints no longer expose the posting.
-- Retain the records for deduplication and collector audit history.

UPDATE public.jobs
SET
  status = 'closed',
  featured = false,
  data_quality_notes = concat_ws(
    ' ',
    data_quality_notes,
    'Closed after authoritative employer-source verification on 2026-11-07; the requisition is no longer available.'
  ),
  last_verified_at = now(),
  updated_at = now()
WHERE source_record_id IN (
  'bdo-ma:JR7107',
  'fengate:JR19'
)
  AND status = 'active';
