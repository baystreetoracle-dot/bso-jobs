-- Backfill only compensation figures stated explicitly in the verified employer descriptions.
-- Annualized internship figures remain annual in storage; the UI labels them as prorated.
UPDATE public.jobs AS jobs
SET
  salary_min = compensation.salary_min,
  salary_max = compensation.salary_max,
  salary_currency = compensation.salary_currency,
  salary_period = compensation.salary_period,
  updated_at = now()
FROM (
  VALUES
    ('3249', 38::numeric, 42::numeric, 'CAD', 'hour'),
    ('R260021763', 100000::numeric, 100000::numeric, 'CAD', 'year'),
    ('R260010184', 100000::numeric, 135000::numeric, 'CAD', 'year'),
    ('2618460', 105000::numeric, 105000::numeric, 'CAD', 'year'),
    ('2618188', 105000::numeric, 105000::numeric, 'CAD', 'year'),
    ('2617249', 105000::numeric, 105000::numeric, 'CAD', 'year'),
    ('2618453', 105000::numeric, 105000::numeric, 'CAD', 'year'),
    ('fort-winter-analyst-vancouver-2027', 84000::numeric, 84000::numeric, 'CAD', 'year'),
    ('fort-summer-analyst-toronto-2027', 84000::numeric, 84000::numeric, 'CAD', 'year'),
    ('33224', 98000::numeric, 131500::numeric, 'CAD', 'year'),
    ('33097', 69000::numeric, 107500::numeric, 'CAD', 'year'),
    ('ASSOC018710', 87500::numeric, 95000::numeric, 'CAD', 'year'),
    ('VICEP017942', 90000::numeric, 140000::numeric, 'CAD', 'year'),
    ('R-0000178260', 135000::numeric, 165000::numeric, 'CAD', 'year'),
    ('9916', 100000::numeric, 100000::numeric, 'CAD', 'year')
) AS compensation(external_job_id, salary_min, salary_max, salary_currency, salary_period)
WHERE jobs.external_job_id = compensation.external_job_id
  AND jobs.description_status = 'verified';
