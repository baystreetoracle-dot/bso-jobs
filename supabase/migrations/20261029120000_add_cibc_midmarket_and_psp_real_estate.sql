-- Publish three active, employer-verified roles supplied on October 29, 2026.
-- Existing EY, BDO and CI Financial records are refreshed below. RBC requisition
-- R-0000187979 is intentionally not reopened: the employer URL returns HTTP 410
-- and its application deadline was October 14, 2026.

WITH incoming AS (
  SELECT *
  FROM jsonb_to_recordset($jobs$
  [
    {
      "external_job_id": "2622373",
      "company_id": "cibc",
      "company_name": "CIBC Capital Markets",
      "title": "Associate, Mid-Market Investment Banking",
      "location_display": "Toronto, ON",
      "city": "Toronto",
      "province": "ON",
      "country": "Canada",
      "workplace_type": null,
      "category": "Investment Banking",
      "specialization": "Mergers & Acquisitions",
      "seniority": "Associate",
      "employment_type": "Full-time",
      "program_type": "Full-time",
      "date_posted": "2026-10-28",
      "application_deadline": "2026-11-11",
      "salary_min": null,
      "salary_max": null,
      "salary_currency": null,
      "salary_period": null,
      "application_url": "https://cibc.wd3.myworkdayjobs.com/search/job/Toronto-ON/Associate--Mid-Market-Investment-Banking_2622373",
      "source_url": "https://cibc.wd3.myworkdayjobs.com/search/job/Toronto-ON/Associate--Mid-Market-Investment-Banking_2622373",
      "source_name": "CIBC Capital Markets public careers site",
      "summary": "Toronto Mid-Market Investment Banking Associate role executing M&A advisory mandates for privately owned companies.",
      "description_text": "CIBC is hiring an Associate for its Mid-Market Investment Banking group in Toronto. The team advises privately owned companies with enterprise values generally ranging from $10 million to $150 million on M&A transactions. Responsibilities include industry and buyer research, public-market valuation analysis, acquisition and recapitalization modelling, preparing business-development proposals and confidential information memoranda, supporting client pitches and executing mandates. Candidates should have at least three years of corporate-finance, commercial-banking or investment-banking experience and strong financial-modelling and presentation skills.",
      "source_record_id": "cibc:2622373",
      "data_quality_notes": "Verified against CIBC's employer-hosted Workday posting on 2026-10-29. Requisition 2622373; posted 2026-10-28; application deadline 2026-11-11."
    },
    {
      "external_job_id": "2621468",
      "company_id": "cibc",
      "company_name": "CIBC Capital Markets",
      "title": "Analyst, Mid-Market Investment Banking",
      "location_display": "Toronto, ON",
      "city": "Toronto",
      "province": "ON",
      "country": "Canada",
      "workplace_type": null,
      "category": "Investment Banking",
      "specialization": "Mergers & Acquisitions",
      "seniority": "Analyst",
      "employment_type": "Full-time",
      "program_type": "Full-time",
      "date_posted": "2026-10-28",
      "application_deadline": "2026-11-11",
      "salary_min": null,
      "salary_max": null,
      "salary_currency": null,
      "salary_period": null,
      "application_url": "https://cibc.wd3.myworkdayjobs.com/search/job/Toronto-ON/Analyst--Mid-Market-Investment-Banking_2621468",
      "source_url": "https://cibc.wd3.myworkdayjobs.com/search/job/Toronto-ON/Analyst--Mid-Market-Investment-Banking_2621468",
      "source_name": "CIBC Capital Markets public careers site",
      "summary": "Toronto Mid-Market Investment Banking Analyst role supporting M&A advisory mandates for privately owned companies.",
      "description_text": "CIBC is hiring an Analyst for its Mid-Market Investment Banking group in Toronto. The team advises privately owned companies with enterprise values generally ranging from $10 million to $150 million on M&A transactions. Responsibilities include industry and buyer research, public-market valuation analysis, acquisition and recapitalization modelling, preparing business-development proposals and confidential information memoranda, supporting client pitches and executing mandates. Candidates should have one to two years of corporate-finance, commercial-banking or investment-banking experience and strong financial-modelling and presentation skills.",
      "source_record_id": "cibc:2621468",
      "data_quality_notes": "Verified against CIBC's employer-hosted Workday posting on 2026-10-29. Requisition 2621468; posted 2026-10-28; application deadline 2026-11-11."
    },
    {
      "external_job_id": "R5030",
      "company_id": "psp-investments",
      "company_name": "PSP Investments",
      "title": "Associate, Real Estate Investments",
      "location_display": "Montréal, QC",
      "city": "Montréal",
      "province": "QC",
      "country": "Canada",
      "workplace_type": null,
      "category": "Real Estate Investing",
      "specialization": "Real Estate",
      "seniority": "Associate",
      "employment_type": "Full-time",
      "program_type": "Full-time",
      "date_posted": "2026-10-27",
      "application_deadline": null,
      "salary_min": 57.14,
      "salary_max": 82.42,
      "salary_currency": "CAD",
      "salary_period": "hour",
      "application_url": "https://investpsp.wd3.myworkdayjobs.com/psp_careers/job/Montreal/Associate--Real-Estate-Investments_R5030",
      "source_url": "https://investpsp.wd3.myworkdayjobs.com/psp_careers/job/Montreal/Associate--Real-Estate-Investments_R5030",
      "source_name": "PSP Investments public careers site",
      "summary": "Montréal Real Estate Investments Associate role underwriting and managing complex domestic and international real estate investments.",
      "description_text": "PSP Investments is hiring an Associate for its Real Estate Investments team in Montréal. The role evaluates direct assets, corporate transactions, secondary shares, private funds and other real estate investments across residential, office, retail and industrial sectors. Responsibilities include leading debt and equity investment models, analyzing cash flows, returns, risks, financing and partnership structures, presenting opportunities to the Global Real Estate Committee, coordinating due diligence, drafting investment materials and supporting active portfolio management. Candidates should have three to five years of experience analyzing and structuring complex international real estate transactions. PSP states compensation of CAD $57.14 to $82.42 per hour for a permanent 35-hour-per-week position.",
      "source_record_id": "psp-investments:R5030",
      "data_quality_notes": "Verified against PSP Investments' employer-hosted Workday posting on 2026-10-29. Requisition R5030; posted 2026-10-27."
    }
  ]$jobs$::jsonb)
  AS job(
    external_job_id text, company_id text, company_name text, title text,
    location_display text, city text, province text, country text,
    workplace_type text, category text, specialization text, seniority text,
    employment_type text, program_type text, date_posted date,
    application_deadline date, salary_min numeric, salary_max numeric,
    salary_currency text, salary_period text, application_url text,
    source_url text, source_name text, summary text, description_text text,
    source_record_id text, data_quality_notes text
  )
)
INSERT INTO public.jobs (
  external_job_id, company_id, company_name, title,
  location_display, city, province, country, workplace_type,
  category, specialization, seniority, employment_type, program_type,
  date_posted, application_deadline, salary_min, salary_max,
  salary_currency, salary_period, application_url, source_url, source_name,
  status, featured, summary, description_text, description_status,
  description_verified_at, source_record_id, data_quality_notes,
  last_verified_at, updated_at
)
SELECT
  external_job_id, company_id, company_name, title,
  location_display, city, province, country, workplace_type,
  category, specialization, seniority, employment_type, program_type,
  date_posted, application_deadline, salary_min, salary_max,
  salary_currency, salary_period, application_url, source_url, source_name,
  'active', false, summary, description_text, 'verified', now(),
  source_record_id, data_quality_notes, now(), now()
FROM incoming
ON CONFLICT (source_record_id) DO UPDATE SET
  company_id = EXCLUDED.company_id, company_name = EXCLUDED.company_name,
  title = EXCLUDED.title, location_display = EXCLUDED.location_display,
  city = EXCLUDED.city, province = EXCLUDED.province, country = EXCLUDED.country,
  workplace_type = EXCLUDED.workplace_type, category = EXCLUDED.category,
  specialization = EXCLUDED.specialization, seniority = EXCLUDED.seniority,
  employment_type = EXCLUDED.employment_type, program_type = EXCLUDED.program_type,
  date_posted = EXCLUDED.date_posted,
  application_deadline = EXCLUDED.application_deadline,
  salary_min = EXCLUDED.salary_min, salary_max = EXCLUDED.salary_max,
  salary_currency = EXCLUDED.salary_currency, salary_period = EXCLUDED.salary_period,
  application_url = EXCLUDED.application_url, source_url = EXCLUDED.source_url,
  source_name = EXCLUDED.source_name, status = EXCLUDED.status,
  summary = EXCLUDED.summary, description_text = EXCLUDED.description_text,
  description_status = EXCLUDED.description_status,
  description_verified_at = EXCLUDED.description_verified_at,
  data_quality_notes = EXCLUDED.data_quality_notes,
  last_verified_at = EXCLUDED.last_verified_at, updated_at = EXCLUDED.updated_at;

UPDATE public.jobs
SET last_verified_at = now(), updated_at = now()
WHERE source_record_id IN (
  'ey-corporate-finance:1755823',
  'bdo-ma:JR7235',
  'ci-financial:JR5966'
)
AND status = 'active';
