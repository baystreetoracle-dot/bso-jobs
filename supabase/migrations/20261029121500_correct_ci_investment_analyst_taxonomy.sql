-- Correct the existing CI role to match its employer description: it performs
-- fundamental equity research on financial institutions, not public credit.

UPDATE public.jobs
SET
  category = 'Asset Management',
  specialization = 'Fundamental Public Equities',
  summary = 'Toronto Investment Analyst role conducting fundamental equity research across banks, insurers, asset managers, exchanges and fintech companies.',
  data_quality_notes = concat_ws(
    ' ',
    data_quality_notes,
    'Taxonomy corrected from Public Credit / Fixed Income to Fundamental Public Equities after employer-description verification on 2026-10-29.'
  ),
  last_verified_at = now(),
  updated_at = now()
WHERE source_record_id = 'ci-financial:JR5966'
  AND status = 'active';
