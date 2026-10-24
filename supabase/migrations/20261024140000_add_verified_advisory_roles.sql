-- Add the missing employer-verified roles supplied on October 24 and refresh
-- the two Stifel records that were already live. The repeated KPMG URL is one job.

INSERT INTO public.companies (company_id, name, company_type, status, updated_at)
VALUES
  ('canaccord-genuity', 'Canaccord Genuity', 'Canadian Investment Bank', 'active', now()),
  ('ubs', 'UBS', 'Global Bank', 'active', now())
ON CONFLICT (company_id) DO UPDATE SET
  name = EXCLUDED.name,
  company_type = EXCLUDED.company_type,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

WITH incoming AS (
  SELECT *
  FROM jsonb_to_recordset($jobs$
  [
    {
      "external_job_id": "33738",
      "company_id": "kpmg-corporate-finance",
      "company_name": "KPMG Corporate Finance",
      "title": "Associate, Corporate Finance",
      "location_display": "Calgary, AB; Edmonton, AB; Winnipeg, MB",
      "city": "Calgary",
      "province": "AB",
      "country": "Canada",
      "workplace_type": null,
      "category": "Corporate Finance",
      "specialization": "M&A",
      "seniority": "Associate",
      "employment_type": "Full-time",
      "program_type": "Full-time",
      "date_posted": "2026-09-11",
      "application_url": "https://careers.kpmg.ca/jobs/33738?lang=en-us",
      "source_url": "https://careers.kpmg.ca/jobs/33738?lang=en-us",
      "source_name": "KPMG Corporate Finance public careers site",
      "summary": "Corporate Finance Associate role supporting M&A, divestitures and debt and equity financing mandates across Western Canada.",
      "description_text": "KPMG Corporate Finance is hiring an Associate in Calgary, Edmonton or Winnipeg. The role supports mergers and acquisitions, divestitures, debt and equity financings, valuations and other corporate-finance mandates. Responsibilities include company and industry research, financial modelling and valuation, preparing marketing and transaction materials, supporting due diligence and coordinating transaction execution. Candidates should have approximately two to four years of relevant finance, accounting, transaction or advisory experience and strong analytical, modelling and communication skills.",
      "source_record_id": "kpmg-cf:33738",
      "data_quality_notes": "Verified through KPMG Canada's public iCIMS Jibe feed and employer page on 2026-10-24. The employer page lists Calgary, Edmonton and Winnipeg."
    },
    {
      "external_job_id": "JR100618",
      "company_id": "canaccord-genuity",
      "company_name": "Canaccord Genuity",
      "title": "Investment Banking Associate - Origination",
      "location_display": "Toronto, ON",
      "city": "Toronto",
      "province": "ON",
      "country": "Canada",
      "workplace_type": "On-site",
      "category": "Investment Banking",
      "specialization": "Origination",
      "seniority": "Associate",
      "employment_type": "Full-time",
      "program_type": "Full-time",
      "date_posted": "2026-10-14",
      "application_url": "https://cgf.wd10.myworkdayjobs.com/CG/job/Toronto-ON/Investment-Banking-Associate---Origination_JR100618",
      "source_url": "https://cgf.wd10.myworkdayjobs.com/CG/job/Toronto-ON/Investment-Banking-Associate---Origination_JR100618",
      "source_name": "Canaccord Genuity public careers site",
      "summary": "Toronto Investment Banking Associate role focused on originating and executing corporate finance, M&A and capital-markets mandates.",
      "description_text": "Canaccord Genuity is hiring an Investment Banking Associate for its Origination group in Toronto. The role supports the origination and execution of corporate finance, M&A, debt-capital-markets and equity-capital-markets transactions. Responsibilities include company and industry research, client materials, due diligence and financial analysis including DCF, comparable-company, precedent-transaction, LBO and accretion-dilution models. Candidates should have at least three years of investment-banking or closely related experience. The employer lists an annual base salary range of CAD $125,000 to $135,000 and describes the position as on-site.",
      "source_record_id": "canaccord:JR100618",
      "data_quality_notes": "Verified against Canaccord Genuity's employer-hosted Workday posting on 2026-10-24. Requisition JR100618; posted 2026-10-14."
    },
    {
      "external_job_id": "JR100636",
      "company_id": "canaccord-genuity",
      "company_name": "Canaccord Genuity",
      "title": "Investment Banking Associate - Mining",
      "location_display": "Toronto, ON",
      "city": "Toronto",
      "province": "ON",
      "country": "Canada",
      "workplace_type": "On-site",
      "category": "Investment Banking",
      "specialization": "Mining & Metals",
      "seniority": "Associate",
      "employment_type": "Full-time",
      "program_type": "Full-time",
      "date_posted": "2026-10-21",
      "application_url": "https://cgf.wd10.myworkdayjobs.com/CG/job/Toronto-ON/Investment-Banking-Associate---Mining_JR100636",
      "source_url": "https://cgf.wd10.myworkdayjobs.com/CG/job/Toronto-ON/Investment-Banking-Associate---Mining_JR100636",
      "source_name": "Canaccord Genuity public careers site",
      "summary": "Toronto Investment Banking Associate role executing advisory and financing mandates for mining-sector clients.",
      "description_text": "Canaccord Genuity is hiring an Investment Banking Associate for its Mining group in Toronto. The role supports advisory and financing mandates through financial modelling, valuation, due diligence, transaction materials, industry research and execution coordination. Candidates should have at least two years of investment-banking experience and strong accounting, valuation, analytical and communication skills. The employer lists an annual base salary range of CAD $125,000 to $135,000 and requires five days per week in the office.",
      "source_record_id": "canaccord:JR100636",
      "data_quality_notes": "Verified against Canaccord Genuity's employer-hosted Workday posting on 2026-10-24. Requisition JR100636; posted 2026-10-21."
    },
    {
      "external_job_id": "353022",
      "company_id": "ubs",
      "company_name": "UBS",
      "title": "Investment Banking Analyst",
      "location_display": "Toronto, ON",
      "city": "Toronto",
      "province": "ON",
      "country": "Canada",
      "workplace_type": null,
      "category": "Investment Banking",
      "specialization": "Generalist",
      "seniority": "Analyst",
      "employment_type": "Full-time",
      "program_type": "Full-time",
      "date_posted": "2026-10-22",
      "application_url": "https://jobs.ubs.com/TGnewUI/Search/home/HomeWithPreLoad?PageType=JobDetails&partnerid=25008&siteid=5012&jobId=353022",
      "source_url": "https://jobs.ubs.com/TGnewUI/Search/home/HomeWithPreLoad?PageType=JobDetails&partnerid=25008&siteid=5012&jobId=353022",
      "source_name": "UBS public careers site",
      "summary": "Toronto Investment Banking Analyst role supporting transaction origination and execution for corporate and private-equity clients.",
      "description_text": "UBS is hiring an Investment Banking Analyst in Toronto. The role supports transaction origination and execution for domestic and international corporate and private-equity clients. Responsibilities include due diligence, financial projections and analysis, client deliverables, presenting analytical findings and collaborating with colleagues across global teams. UBS seeks candidates with investment-banking experience, strong analytical and quantitative skills, an undergraduate degree and the judgment to work effectively with corporate and private-equity clients.",
      "source_record_id": "ubs:353022",
      "data_quality_notes": "Verified against the UBS employer page on 2026-10-24. Employer posting date 2026-10-22; displayed UBS job reference 345434BR; supplied Taleo job ID 353022."
    },
    {
      "external_job_id": "133483",
      "company_id": "deloitte-corporate-finance",
      "company_name": "Deloitte Corporate Finance",
      "title": "Associate (Senior Consultant), M&A Corporate Finance",
      "location_display": "Toronto, ON; Kitchener, ON",
      "city": "Toronto",
      "province": "ON",
      "country": "Canada",
      "workplace_type": "Hybrid",
      "category": "Corporate Finance",
      "specialization": "M&A",
      "seniority": "Associate",
      "employment_type": "Full-time",
      "program_type": "Full-time",
      "date_posted": "2026-10-02",
      "application_url": "https://careers.deloitte.ca/job/Associate-(Senior-Consultant),-M&A-Corporate-Finance/133483-en_US",
      "source_url": "https://careers.deloitte.ca/job/Associate-(Senior-Consultant),-M&A-Corporate-Finance/133483-en_US",
      "source_name": "Deloitte Corporate Finance public careers site",
      "summary": "Hybrid M&A Corporate Finance Associate role supporting acquisitions, divestitures and growth-capital transactions in Toronto or Kitchener.",
      "description_text": "Deloitte Corporate Finance is hiring an Associate (Senior Consultant) in Toronto or Kitchener. The role supports M&A and growth-capital transactions across the transaction lifecycle, including financial and valuation analysis, detailed modelling, marketing documents, due diligence, pitch materials and business development. Candidates should have approximately one to three years of relevant corporate-finance or investment-banking experience and a strong understanding of corporate finance, capital markets and valuation. The employer identifies this as a permanent hybrid position.",
      "source_record_id": "deloitte-cf:133483",
      "data_quality_notes": "Verified against Deloitte Canada's employer page on 2026-10-24. Reference 133483; posted 2026-10-02; Toronto and Kitchener; hybrid."
    }
  ]$jobs$::jsonb)
  AS job(
    external_job_id text, company_id text, company_name text, title text,
    location_display text, city text, province text, country text,
    workplace_type text, category text, specialization text, seniority text,
    employment_type text, program_type text, date_posted date,
    application_url text, source_url text, source_name text, summary text,
    description_text text, source_record_id text, data_quality_notes text
  )
)
INSERT INTO public.jobs (
  external_job_id, company_id, company_name, title,
  location_display, city, province, country, workplace_type,
  category, specialization, seniority, employment_type, program_type,
  date_posted, application_url, source_url, source_name,
  status, featured, summary, description_text, description_status,
  description_verified_at, source_record_id, data_quality_notes,
  last_verified_at, updated_at
)
SELECT
  external_job_id, company_id, company_name, title,
  location_display, city, province, country, workplace_type,
  category, specialization, seniority, employment_type, program_type,
  date_posted, application_url, source_url, source_name,
  'active', false, summary, description_text, 'verified',
  now(), source_record_id, data_quality_notes, now(), now()
FROM incoming
ON CONFLICT (source_record_id) DO UPDATE SET
  company_id = EXCLUDED.company_id, company_name = EXCLUDED.company_name,
  title = EXCLUDED.title, location_display = EXCLUDED.location_display,
  city = EXCLUDED.city, province = EXCLUDED.province, country = EXCLUDED.country,
  workplace_type = EXCLUDED.workplace_type, category = EXCLUDED.category,
  specialization = EXCLUDED.specialization, seniority = EXCLUDED.seniority,
  employment_type = EXCLUDED.employment_type, program_type = EXCLUDED.program_type,
  date_posted = EXCLUDED.date_posted, application_url = EXCLUDED.application_url,
  source_url = EXCLUDED.source_url, source_name = EXCLUDED.source_name,
  status = EXCLUDED.status, summary = EXCLUDED.summary,
  description_text = EXCLUDED.description_text,
  description_status = EXCLUDED.description_status,
  description_verified_at = EXCLUDED.description_verified_at,
  data_quality_notes = EXCLUDED.data_quality_notes,
  last_verified_at = EXCLUDED.last_verified_at, updated_at = EXCLUDED.updated_at;

UPDATE public.jobs
SET last_verified_at = now(), updated_at = now()
WHERE source_record_id IN ('stifel-canada:10006', 'stifel-canada:10009')
  AND status = 'active';
