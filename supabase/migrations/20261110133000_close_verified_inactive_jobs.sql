-- Close postings whose official employer sources were verified inactive on
-- November 10, 2026. Temporary source errors and inconclusive checks are
-- deliberately excluded.

WITH closures(external_job_id, closure_reason) AS (
  VALUES
    ('R260028437', 'BMO states that the job has been filled.'),
    ('R260029478', 'BMO states that the job has been filled.'),
    ('ASSOC018710', 'The MNP requisition is no longer returned by the official UKG opportunity detail.'),
    ('8662786002', 'The Nicola Wealth requisition is no longer returned by the employer''s public Greenhouse API.'),
    ('R-0000191981', 'RBC states that the job has been filled.'),
    ('R-0000191309', 'RBC states that the job has been filled.'),
    ('549798030828', 'Morgan Stanley''s public job page states that it is no longer accepting applications.'),
    ('549799748436', 'Morgan Stanley''s public job page states that it is no longer accepting applications.')
)
UPDATE public.jobs AS jobs
SET
  status = 'closed',
  data_quality_notes = concat_ws(
    ' ',
    nullif(trim(jobs.data_quality_notes), ''),
    'Closed on 2026-11-10 after official employer-source verification:',
    closures.closure_reason
  ),
  last_verified_at = now(),
  updated_at = now()
FROM closures
WHERE jobs.external_job_id = closures.external_job_id
  AND jobs.status = 'active';
