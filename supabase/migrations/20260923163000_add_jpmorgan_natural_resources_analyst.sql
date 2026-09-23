INSERT INTO public.jobs (
  external_job_id,
  company_id,
  company_name,
  title,
  location_display,
  city,
  province,
  country,
  workplace_type,
  category,
  specialization,
  seniority,
  employment_type,
  program_type,
  date_posted,
  application_deadline,
  application_url,
  source_url,
  source_name,
  status,
  featured,
  summary,
  description_text,
  description_status,
  description_verified_at,
  source_record_id,
  data_quality_notes,
  last_verified_at,
  updated_at
)
VALUES (
  '210790829',
  'jpmorgan',
  'J.P. Morgan',
  'Investment Banking Analyst - Natural Resources Group',
  'Calgary, AB',
  'Calgary',
  'AB',
  'Canada',
  NULL,
  'Investment Banking',
  'Natural Resources - Energy & Mining',
  'Analyst',
  'Full-time',
  'Full-time',
  '2026-09-21',
  NULL,
  'https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/210790829',
  'https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/210790829',
  'J.P. Morgan Careers',
  'active',
  false,
  'Full-time Investment Banking Analyst role with J.P. Morgan''s Natural Resources group in Calgary, covering the energy and mining sectors and supporting transaction execution, financial analysis and client materials.',
  $job$Location: Calgary, AB

Schedule: Full-time

This is an experienced Investment Banking Analyst position with J.P. Morgan's Natural Resources group in Calgary. The role covers energy and mining clients and participates throughout the transaction process, with exposure to senior bankers, clients and major areas of investment banking execution.

Role responsibilities

- Prepare pitch books, client presentations and business-development materials.
- Research companies and industries to identify trends, opportunities and risks.
- Perform valuation analysis, build detailed financial models and support transactions from pitch through closing.
- Assist with due diligence, documentation and other transaction-execution work.
- Support senior bankers with client relationships and deal origination.
- Build relationships with mentors, senior executives and colleagues.

Candidate profile

- Well-rounded academic background.
- Strong analytical and financial-modelling skills.
- Strong communication skills and the ability to work effectively with senior professionals, clients and other stakeholders.
- Self-directed, highly motivated and able to work independently.
- Prior front-office investment banking experience and demonstrated interest in the energy and/or mining sectors.$job$,
  'verified',
  now(),
  'jpmorgan:210790829',
  'Verified against the official J.P. Morgan Oracle careers endpoint on 2026-09-23. Oracle requisition ID 210790829; ExternalPostedStartDate 2026-09-21T13:58:24Z. Oracle publishes no ExternalPostedEndDate for this role.',
  now(),
  now()
)
ON CONFLICT (company_id, external_job_id) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  title = EXCLUDED.title,
  location_display = EXCLUDED.location_display,
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  country = EXCLUDED.country,
  workplace_type = EXCLUDED.workplace_type,
  category = EXCLUDED.category,
  specialization = EXCLUDED.specialization,
  seniority = EXCLUDED.seniority,
  employment_type = EXCLUDED.employment_type,
  program_type = EXCLUDED.program_type,
  date_posted = EXCLUDED.date_posted,
  application_deadline = EXCLUDED.application_deadline,
  application_url = EXCLUDED.application_url,
  source_url = EXCLUDED.source_url,
  source_name = EXCLUDED.source_name,
  status = EXCLUDED.status,
  summary = EXCLUDED.summary,
  description_text = EXCLUDED.description_text,
  description_status = EXCLUDED.description_status,
  description_verified_at = EXCLUDED.description_verified_at,
  source_record_id = EXCLUDED.source_record_id,
  data_quality_notes = EXCLUDED.data_quality_notes,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = EXCLUDED.updated_at;
