-- Publish three employer-verified roles supplied on October 25, 2026.

WITH incoming AS (
  SELECT *
  FROM jsonb_to_recordset($jobs$
  [
    {
      "external_job_id": "R2053005",
      "company_id": "brookfield-asset-management",
      "company_name": "Brookfield Asset Management",
      "title": "Manager, Portfolio Management",
      "location_display": "Toronto, ON",
      "city": "Toronto",
      "province": "ON",
      "country": "Canada",
      "workplace_type": null,
      "category": "Infrastructure Investing",
      "specialization": "Infrastructure",
      "seniority": "Manager",
      "employment_type": "Full-time",
      "program_type": "Full-time",
      "date_posted": "2026-09-23",
      "salary_min": 110000,
      "salary_max": 140000,
      "salary_currency": "CAD",
      "salary_period": "year",
      "application_url": "https://brookfield.wd5.myworkdayjobs.com/brookfield/job/Toronto-Ontario/Manager--Portfolio-Management_R2053005",
      "source_url": "https://brookfield.wd5.myworkdayjobs.com/brookfield/job/Toronto-Ontario/Manager--Portfolio-Management_R2053005",
      "source_name": "Brookfield Asset Management public careers site",
      "summary": "Infrastructure Portfolio Management Manager role supporting financial analysis, reporting, business planning and portfolio oversight in Toronto.",
      "description_text": "Brookfield Infrastructure Group is hiring a Manager for its Portfolio Management team in Toronto. The role supports a global infrastructure portfolio spanning transport, utilities, energy and data infrastructure. Responsibilities include analyzing financial and liquidity forecasts, reviewing operating-asset reporting and capital expenditure forecasts, preparing results presentations, supporting annual business planning, building scenario analyses, integrating new acquisitions and completing strategic portfolio projects. Candidates should be qualified CPAs, ideally with Big Four experience, and have strong financial modelling, accounting, analytical and executive communication skills. Brookfield lists an annual base salary range of CAD $110,000 to $140,000.",
      "source_record_id": "brookfield-asset-management:R2053005",
      "data_quality_notes": "Verified against Brookfield's employer-hosted Workday posting on 2026-10-25. Classified as Infrastructure because the employer identifies the business as Brookfield Infrastructure Group."
    },
    {
      "external_job_id": "JR7267",
      "company_id": "bdo-ma",
      "company_name": "BDO M&A & Capital Markets",
      "title": "Senior Associate, Business Restructuring & Turnaround Services",
      "location_display": "Vancouver, BC",
      "city": "Vancouver",
      "province": "BC",
      "country": "Canada",
      "workplace_type": null,
      "category": "Corporate Finance",
      "specialization": "Restructuring",
      "seniority": "Associate",
      "employment_type": "Full-time",
      "program_type": "Full-time",
      "date_posted": "2026-10-22",
      "salary_min": 72000,
      "salary_max": 110000,
      "salary_currency": "CAD",
      "salary_period": "year",
      "application_url": "https://bdo.wd3.myworkdayjobs.com/BDO/job/Vancouver/Senior-Associate--Business-Restructuring---Turnaround-Services_JR7267",
      "source_url": "https://bdo.wd3.myworkdayjobs.com/BDO/job/Vancouver/Senior-Associate--Business-Restructuring---Turnaround-Services_JR7267",
      "source_name": "BDO M&A & Capital Markets public careers site",
      "summary": "Vancouver Corporate Restructuring Senior Associate role supporting turnaround, insolvency and distressed-business mandates.",
      "description_text": "BDO is hiring a Senior Associate for its Corporate Restructuring group in Vancouver. The role supports creditors and distressed businesses through receiverships, bankruptcies, liquidity management, operational stabilization, turnaround planning and formal or informal restructurings. Responsibilities include analyzing financial records, building 13-week cash-flow and scenario models, preparing stakeholder and court reports, managing transaction workstreams and supporting distressed-asset and business sale processes. Candidates should have two to three years of professional accounting-services experience and a CPA designation completed or in progress. BDO lists an annual compensation range of CAD $72,000 to $110,000.",
      "source_record_id": "bdo-ma:JR7267",
      "data_quality_notes": "Verified against BDO Canada's employer-hosted Workday posting on 2026-10-25. Requisition JR7267; posted 2026-10-22."
    },
    {
      "external_job_id": "7300",
      "company_id": "ontario-teachers",
      "company_name": "Ontario Teachers' Pension Plan",
      "title": "Investment Associate, Capital Markets - Quantitative Strategies & Research",
      "location_display": "Toronto, ON",
      "city": "Toronto",
      "province": "ON",
      "country": "Canada",
      "workplace_type": "Hybrid",
      "category": "Institutional Investing",
      "specialization": "Quantitative Strategies",
      "seniority": "Associate",
      "employment_type": "Full-time",
      "program_type": "Full-time",
      "date_posted": "2026-10-22",
      "salary_min": null,
      "salary_max": null,
      "salary_currency": null,
      "salary_period": null,
      "application_url": "https://otppb.wd3.myworkdayjobs.com/OntarioTeachers_Careers/job/Toronto-Canada/Investment-Associate--Capital-Markets---Quantitative-Strategies---Research_7300",
      "source_url": "https://otppb.wd3.myworkdayjobs.com/OntarioTeachers_Careers/job/Toronto-Canada/Investment-Associate--Capital-Markets---Quantitative-Strategies---Research_7300",
      "source_name": "Ontario Teachers' Pension Plan public careers site",
      "summary": "Capital Markets Investment Associate role supporting systematic strategies, portfolio operations, trading, risk and quantitative research in Toronto.",
      "description_text": "Ontario Teachers' Pension Plan is hiring an Investment Associate for its Capital Markets Quantitative Strategies & Research team in Toronto. This portfolio-engineering role supports systematic investment strategies across portfolio construction, operations, trading, risk and profit-and-loss analysis. Responsibilities include maintaining proprietary strategy code, implementing portfolio rebalances and risk adjustments, deploying quantitative models, analyzing execution data, attributing portfolio risk and returns and collaborating with researchers, traders and technology teams. Candidates should have a quantitative undergraduate or graduate degree, strong Python, MATLAB or SQL skills, knowledge of systematic investing and at least one year of relevant financial-software-engineering experience. The employer describes a flexible environment combining office and remote work.",
      "source_record_id": "ontario-teachers:7300",
      "data_quality_notes": "Verified against Ontario Teachers' employer-hosted Workday posting on 2026-10-25. Requisition 7300; posted 2026-10-22."
    }
  ]$jobs$::jsonb)
  AS job(
    external_job_id text, company_id text, company_name text, title text,
    location_display text, city text, province text, country text,
    workplace_type text, category text, specialization text, seniority text,
    employment_type text, program_type text, date_posted date,
    salary_min numeric, salary_max numeric, salary_currency text, salary_period text,
    application_url text, source_url text, source_name text, summary text,
    description_text text, source_record_id text, data_quality_notes text
  )
)
INSERT INTO public.jobs (
  external_job_id, company_id, company_name, title,
  location_display, city, province, country, workplace_type,
  category, specialization, seniority, employment_type, program_type,
  date_posted, salary_min, salary_max, salary_currency, salary_period,
  application_url, source_url, source_name, status, featured,
  summary, description_text, description_status, description_verified_at,
  source_record_id, data_quality_notes, last_verified_at, updated_at
)
SELECT
  external_job_id, company_id, company_name, title,
  location_display, city, province, country, workplace_type,
  category, specialization, seniority, employment_type, program_type,
  date_posted, salary_min, salary_max, salary_currency, salary_period,
  application_url, source_url, source_name, 'active', false,
  summary, description_text, 'verified', now(), source_record_id,
  data_quality_notes, now(), now()
FROM incoming
ON CONFLICT (source_record_id) DO UPDATE SET
  company_id = EXCLUDED.company_id, company_name = EXCLUDED.company_name,
  title = EXCLUDED.title, location_display = EXCLUDED.location_display,
  city = EXCLUDED.city, province = EXCLUDED.province, country = EXCLUDED.country,
  workplace_type = EXCLUDED.workplace_type, category = EXCLUDED.category,
  specialization = EXCLUDED.specialization, seniority = EXCLUDED.seniority,
  employment_type = EXCLUDED.employment_type, program_type = EXCLUDED.program_type,
  date_posted = EXCLUDED.date_posted, salary_min = EXCLUDED.salary_min,
  salary_max = EXCLUDED.salary_max, salary_currency = EXCLUDED.salary_currency,
  salary_period = EXCLUDED.salary_period, application_url = EXCLUDED.application_url,
  source_url = EXCLUDED.source_url, source_name = EXCLUDED.source_name,
  status = EXCLUDED.status, summary = EXCLUDED.summary,
  description_text = EXCLUDED.description_text,
  description_status = EXCLUDED.description_status,
  description_verified_at = EXCLUDED.description_verified_at,
  data_quality_notes = EXCLUDED.data_quality_notes,
  last_verified_at = EXCLUDED.last_verified_at, updated_at = EXCLUDED.updated_at;

-- Remove the two user-rejected roles from the public board while preserving
-- their records for collector deduplication and audit history.
UPDATE public.jobs
SET
  status = 'closed',
  featured = false,
  data_quality_notes = concat_ws(
    ' ', data_quality_notes,
    'Removed from the public BSO Jobs platform at editorial direction on 2026-10-25.'
  ),
  last_verified_at = now(),
  updated_at = now()
WHERE source_record_id IN ('ontario-teachers:7225', 'imco:R26-99');
