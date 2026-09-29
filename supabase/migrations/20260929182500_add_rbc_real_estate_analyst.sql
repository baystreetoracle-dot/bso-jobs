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
  'R-0000189162',
  'rbc-capital-markets',
  'RBC Capital Markets',
  'Analyst, Global Investment Banking - Real Estate',
  'Toronto, ON',
  'Toronto',
  'ON',
  'Canada',
  NULL,
  'Investment Banking',
  'Real Estate',
  'Analyst',
  'Full-time',
  'Full-time',
  '2026-09-28',
  '2026-10-19',
  75000,
  115000,
  'CAD',
  'year',
  'https://rbc.wd3.myworkdayjobs.com/RBCGLOBAL1/job/TORONTO-Ontario-Canada/Analyst--Global-Investment-Banking---Real-Estate_R-0000189162-1/apply',
  'https://jobs.rbc.com/ca/en/job/RBCAA0088R0000189162EXTERNALENCA/Analyst-Global-Investment-Banking-Real-Estate',
  'RBC Capital Markets public careers site',
  'active',
  false,
  'Toronto-based Analyst role with RBC Capital Markets'' Real Estate investment banking team, supporting financial analysis, transaction execution, financings, mergers and acquisitions, and advisory assignments.',
  $job$Location: Toronto, ON

Schedule: Full-time, 37.5 hours per week

Base salary: CAD $75,000-$115,000 annually, plus eligibility for discretionary variable compensation

Application deadline: October 19, 2026. RBC notes that applications are accepted until 11:59 p.m. on the preceding day.

RBC Capital Markets is seeking an Analyst to join its Real Estate investment banking team in Toronto. The group advises public, private, corporate and government owners of real estate across equity and debt capital markets, mergers and acquisitions, and advisory and valuation assignments.

Role responsibilities

- Evaluate clients' financial needs and develop complex financial models.
- Support transaction structuring and execution.
- Conduct financial and written analysis of companies and industries.
- Contribute to client meetings and presentations.
- Research market trends and future opportunities.
- Support equity and debt financings, mergers and acquisitions, and financial advisory assignments.

Candidate profile

- Undergraduate degree in Finance, Accounting, Engineering or another quantitative field.
- Strong financial-analysis, accounting, quantitative and communication skills.
- Ability to manage competing priorities and perform effectively under pressure.
- CFA, CPA or another relevant designation is considered an asset.
- One to two years of investment banking, private equity, equity research, M&A, corporate development or accounting experience is considered an asset but is not required.

Required application documents

Applicants must combine their cover letter, resume and academic transcripts into one PDF and upload it in the resume section.$job$,
  'verified',
  now(),
  'rbc:R-0000189162',
  'Verified against RBC''s public Phenom job detail and employer-managed Workday application on 2026-09-29. Requisition R-0000189162; posting status OPEN; posted 2026-09-28; deadline 2026-10-19; stated pay range CAD 75,000-115,000.',
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
  featured = EXCLUDED.featured,
  summary = EXCLUDED.summary,
  description_text = EXCLUDED.description_text,
  description_status = EXCLUDED.description_status,
  description_verified_at = EXCLUDED.description_verified_at,
  source_record_id = EXCLUDED.source_record_id,
  data_quality_notes = EXCLUDED.data_quality_notes,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = EXCLUDED.updated_at;
