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
  '265876',
  'scotiabank',
  'Scotiabank Global Banking and Markets',
  'Associate, Investment Banking, Energy',
  'Calgary, AB',
  'Calgary',
  'AB',
  'Canada',
  'On-site',
  'Investment Banking',
  'Energy',
  'Associate',
  'Full-time',
  'Full-time',
  '2026-09-23',
  '2026-10-07',
  'https://jobs.scotiabank.com/job/Calgary-Associate%2C-Investment-Banking%2C-Energy-Calgary%2C-AB-AB-T2P1N2/603753617/',
  'https://jobs.scotiabank.com/job/Calgary-Associate%2C-Investment-Banking%2C-Energy-Calgary%2C-AB-AB-T2P1N2/603753617/',
  'Scotiabank Careers',
  'active',
  false,
  'Full-time Investment Banking Associate role with Scotiabank''s Energy team in Calgary. The position is based in the office and supports transaction execution, financial modelling, client materials and business development.',
  $job$Location: Calgary, AB

Work arrangement: On-site, five days per week

Application deadline: October 7, 2026

This is a full-time Associate position with Scotiabank's Energy Investment Banking team in Calgary. The role provides direct exposure to senior team members, clients, live transactions and business development within Global Banking and Markets.

Role responsibilities

- Evaluate the financial needs of corporate clients and develop financial models.
- Prepare client presentations, marketing materials and transaction documentation.
- Support transaction structuring and execution with increasing responsibility.
- Analyze financial statements, companies and industries.
- Collect and interpret company and industry data.
- Apply investment banking and capital-markets knowledge to client objectives.
- Identify business opportunities and mentor junior analysts.

Candidate profile

- Three to four years of Investment Banking or M&A experience is preferred. Scotiabank may also consider relevant Equity Research, accounting-firm Corporate Finance or management consulting experience.
- Bachelor's or Master's degree in Business, Mathematics, Engineering or Science.
- Strong quantitative, financial-analysis, accounting and communication skills.
- Strong attention to detail and the ability to manage multiple assignments under demanding deadlines.
- Demonstrated adaptability, integrity, teamwork and interest in learning new concepts.$job$,
  'verified',
  now(),
  'scotiabank:265876',
  'Verified against the official Scotiabank careers posting on 2026-09-23. Employer requisition ID 265876; public career-page record 603753617. The official page exposes datePosted 2026-09-23 and validThrough 2026-10-07.',
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
