-- Add CIBC Commercial Banking's active Entertainment Banking Associate posting.
-- The role is specialized senior lending and is intentionally classified as Corporate Finance, not Investment Banking.

INSERT INTO public.companies (
  company_id, name, parent_company, company_type, website_domain,
  headquarters_country, status, updated_at
)
VALUES (
  'cibc-commercial-banking',
  'CIBC Commercial Banking',
  'Canadian Imperial Bank of Commerce',
  'Bank',
  'cibc.com',
  'Canada',
  'active',
  now()
)
ON CONFLICT (company_id) DO UPDATE SET
  name = EXCLUDED.name,
  parent_company = EXCLUDED.parent_company,
  company_type = EXCLUDED.company_type,
  website_domain = EXCLUDED.website_domain,
  headquarters_country = EXCLUDED.headquarters_country,
  status = EXCLUDED.status,
  updated_at = now();

INSERT INTO public.jobs (
  external_job_id, company_id, company_name, title, location_display, city, province, country,
  workplace_type, category, specialization, seniority, employment_type, program_type,
  date_posted, application_deadline, application_url, source_url, source_name, status,
  summary, description_text, description_status, description_verified_at,
  source_record_id, data_quality_notes, last_verified_at, updated_at
)
VALUES (
  '2619979',
  'cibc-commercial-banking',
  'CIBC Commercial Banking',
  'Associate, Entertainment Banking',
  'Toronto, ON',
  'Toronto',
  'ON',
  'Canada',
  'Hybrid',
  'Corporate Finance',
  'Entertainment Banking / Senior Lending',
  'Associate',
  'Full-time',
  'Full-time',
  '2026-09-29',
  '2026-10-13',
  'https://cibc.wd3.myworkdayjobs.com/en-US/search/job/Toronto-ON/Associate--Entertainment-Banking_2619979?src=SNS-10261',
  'https://cibc.wd3.myworkdayjobs.com/en-US/search/job/Toronto-ON/Associate--Entertainment-Banking_2619979',
  'CIBC public Workday careers site',
  'active',
  'Toronto-based Associate role with CIBC Entertainment Banking, supporting structured senior-lending transactions and a portfolio of media and entertainment clients across North America.',
  $description$CIBC Entertainment Banking is hiring an Associate in Toronto. The specialized commercial-banking team provides advisory services and tailored financing solutions to media and entertainment companies across North America, including acquisition, project, interim and syndicated financings.

The Associate supports financing proposals, credit analysis and memoranda, transaction structuring, negotiations, legal-document review, due diligence and closing. The role also helps manage an existing senior-debt portfolio, monitors borrower and sector performance, and works with relationship managers on business development and client coverage.

Applicants should have a bachelor's degree in business, economics, finance, accounting, mathematics, computer science, engineering or a related field, along with experience in commercial credit or an equity-investment environment. The employer also seeks knowledge of lending and credit assessment, financial modelling, proposal preparation, communication and relationship management. A graduate degree or professional financial designation is considered an asset. The position is full-time, and the employer will discuss the on-site and remote work arrangement during the interview process.$description$,
  'verified',
  now(),
  'cibc-commercial-banking:2619979',
  'Employer-hosted Workday posting verified active on September 30, 2026. This is a CIBC Commercial Banking senior-lending role, not an Investment Banking position.',
  now(),
  now()
)
ON CONFLICT (source_record_id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
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
  data_quality_notes = EXCLUDED.data_quality_notes,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();
