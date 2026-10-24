-- Publish the employer-verified HOOPP Real Estate role from the October 23 review.
-- CIBC requisition 2617379 was not published because it disappeared from the
-- authoritative Workday feed after its October 23 application deadline.

INSERT INTO public.jobs (
  external_job_id, company_id, company_name, title,
  location_display, city, province, country, workplace_type,
  category, specialization, seniority, employment_type, program_type,
  date_posted, application_deadline,
  salary_min, salary_max, salary_currency, salary_period,
  application_url, source_url, source_name,
  status, featured, summary, description_text,
  description_status, description_verified_at, source_record_id,
  data_quality_notes, last_verified_at, updated_at
)
VALUES (
  'JR102604', 'hoopp', 'HOOPP', 'Analyst, Real Estate',
  'Toronto, ON', 'Toronto', 'ON', 'Canada', NULL,
  'Real Estate Investing', 'Real Estate', 'Analyst', 'Full-time', 'Full-time',
  '2026-10-22', '2026-11-09',
  76000, 124000, 'CAD', 'year',
  'https://hoopp.wd10.myworkdayjobs.com/HOOPP/job/Toronto-Ontario-Canada/Analyst--Real-Estate_JR102604',
  'https://hoopp.wd10.myworkdayjobs.com/HOOPP/job/Toronto-Ontario-Canada/Analyst--Real-Estate_JR102604',
  'HOOPP public careers site', 'active', false,
  'Toronto Real Estate Investment Management Analyst role covering investment evaluation, transaction execution and portfolio and asset management.',
  $hoopp$HOOPP is hiring an Analyst for its Real Estate Investment Management team in Toronto. The role supports investment evaluation, transaction execution, asset and portfolio management, research and reporting across real estate sectors, markets and strategies.

Responsibilities include underwriting acquisitions, dispositions, developments, financings and partnership structures; building Excel and Argus models; supporting due diligence and investment approval materials; evaluating budgets, leasing, capital expenditures, valuations and buy-sell-hold decisions; and conducting economic, capital-markets and property-level research.

Applicants should have a university degree and typically at least two years of relevant experience in commercial real estate, investments, development, asset management, lending or a related field. HOOPP states an annual base salary range of CAD $76,000 to $124,000 plus eligibility for discretionary incentive compensation.$hoopp$,
  'verified', now(), 'hoopp:JR102604',
  'Verified against HOOPP''s employer-hosted Workday posting on 2026-10-24. Requisition JR102604; posted 2026-10-22; Workday end date 2026-11-09.',
  now(), now()
)
ON CONFLICT (source_record_id) DO UPDATE SET
  company_id = EXCLUDED.company_id, company_name = EXCLUDED.company_name,
  title = EXCLUDED.title, location_display = EXCLUDED.location_display,
  city = EXCLUDED.city, province = EXCLUDED.province, country = EXCLUDED.country,
  workplace_type = EXCLUDED.workplace_type, category = EXCLUDED.category,
  specialization = EXCLUDED.specialization, seniority = EXCLUDED.seniority,
  employment_type = EXCLUDED.employment_type, program_type = EXCLUDED.program_type,
  date_posted = EXCLUDED.date_posted, application_deadline = EXCLUDED.application_deadline,
  salary_min = EXCLUDED.salary_min, salary_max = EXCLUDED.salary_max,
  salary_currency = EXCLUDED.salary_currency, salary_period = EXCLUDED.salary_period,
  application_url = EXCLUDED.application_url, source_url = EXCLUDED.source_url,
  source_name = EXCLUDED.source_name, status = EXCLUDED.status,
  featured = EXCLUDED.featured, summary = EXCLUDED.summary,
  description_text = EXCLUDED.description_text,
  description_status = EXCLUDED.description_status,
  description_verified_at = EXCLUDED.description_verified_at,
  data_quality_notes = EXCLUDED.data_quality_notes,
  last_verified_at = EXCLUDED.last_verified_at, updated_at = EXCLUDED.updated_at;
