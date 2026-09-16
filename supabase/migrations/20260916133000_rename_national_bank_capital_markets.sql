UPDATE public.companies
SET name = 'National Bank Capital Markets',
    updated_at = now()
WHERE company_id = 'national-bank-financial-markets';

UPDATE public.jobs
SET company_name = 'National Bank Capital Markets',
    updated_at = now()
WHERE company_id = 'national-bank-financial-markets';

