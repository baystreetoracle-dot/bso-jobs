-- Consolidate the legacy ATB Capital Markets identity into ATB Cormark Capital Markets.
UPDATE public.jobs
SET
  company_id = 'atb-cormark',
  company_name = 'ATB Cormark Capital Markets',
  source_name = CASE
    WHEN source_name = 'ATB Capital Markets public careers site'
      THEN 'ATB Cormark Capital Markets public careers site'
    ELSE source_name
  END,
  data_quality_notes = concat_ws(
    ' ',
    nullif(data_quality_notes, ''),
    'Company identity normalized from ATB Capital Markets to ATB Cormark Capital Markets.'
  ),
  updated_at = now()
WHERE company_id = 'atb-capital-markets'
   OR company_name = 'ATB Capital Markets';

UPDATE public.companies
SET status = 'inactive', updated_at = now()
WHERE company_id = 'atb-capital-markets'
  AND name = 'ATB Capital Markets';

