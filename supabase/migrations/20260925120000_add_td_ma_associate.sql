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
  salary_min,
  salary_max,
  salary_currency,
  salary_period,
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
  'R_1479567',
  'td-securities',
  'TD Securities',
  'Investment Banking Associate, Mergers & Acquisitions',
  'Toronto, ON',
  'Toronto',
  'ON',
  'Canada',
  'On-site',
  'Investment Banking',
  'Mergers & Acquisitions',
  'Associate',
  'Full-time',
  'Full-time',
  '2026-09-24',
  '2026-10-09',
  135000,
  155000,
  'CAD',
  'year',
  'https://td.wd3.myworkdayjobs.com/en-US/TD_Bank_Careers/job/Toronto-Ontario/Investment-Banking-Associate--Mergers---Acquisitions_R_1479567',
  'https://td.wd3.myworkdayjobs.com/en-US/TD_Bank_Careers/job/Toronto-Ontario/Investment-Banking-Associate--Mergers---Acquisitions_R_1479567',
  'TD Careers',
  'active',
  false,
  'Full-time Investment Banking Associate role with TD Securities'' Mergers & Acquisitions team in Toronto. The position supports transaction execution, valuation, client materials and oversight of analyst work.',
  $job$Location: Toronto, ON

Schedule: Full-time, 37.5 hours per week

Base salary: CAD $135,000-$155,000 annually, plus eligibility for discretionary variable compensation

Application deadline: October 9, 2026

This is an Investment Banking Associate position with TD Securities' Mergers & Acquisitions team in Toronto. The role works across industry sectors and supports advisory assignments, transaction execution and client development.

Role responsibilities

- Research and analyze clients, industries, market data and potential merger and acquisition opportunities.
- Develop valuation models for private companies, public companies and combined entities.
- Assist with transaction negotiations, documentation and execution.
- Prepare client proposals, internal memoranda and presentations.
- Support senior team members with idea generation.
- Manage and review analyst work.
- Develop internal relationships across TD products and services.

Candidate profile

- Three or more years of current or prior Investment Banking experience with a large Canadian or global investment bank.
- Strong financial-analysis, modelling, valuation and communication skills.
- Experience or demonstrated interest in mergers and acquisitions.
- Ability to work effectively in a team environment.
- Willingness to complete the SIE and Series 79 licences within four months of joining if not already held.$job$,
  'verified',
  now(),
  'td-securities:R_1479567',
  'Verified against the official TD Workday endpoint on 2026-09-25. Workday requisition ID R_1479567; startDate 2026-09-24; endDate 2026-10-09. The On-site workplace label is also present in TD Securities'' employer-managed job distribution.',
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
  salary_min = EXCLUDED.salary_min,
  salary_max = EXCLUDED.salary_max,
  salary_currency = EXCLUDED.salary_currency,
  salary_period = EXCLUDED.salary_period,
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
