-- Publish Letko Brosseau's active Investment Analyst role and its six campus-specific application streams.
-- Investment Services, Business Development, and spontaneous applications are intentionally excluded.

INSERT INTO public.companies (company_id, name, company_type, headquarters_country, status, updated_at)
VALUES ('letko-brosseau', 'Letko Brosseau', 'Asset Manager', 'Canada', 'active', now())
ON CONFLICT (company_id) DO UPDATE SET
  name = EXCLUDED.name,
  company_type = EXCLUDED.company_type,
  headquarters_country = EXCLUDED.headquarters_country,
  status = EXCLUDED.status,
  updated_at = now();

WITH streams (external_job_id, specialization, program_type, application_url, summary, data_quality_notes) AS (
  VALUES
    ('92', 'General Application', 'Full-time', 'https://lba.bamboohr.com/careers/92',
      'Montreal-based Investment Analyst role on Letko Brosseau''s investment team, conducting fundamental public-company research, valuation and portfolio recommendations.',
      'Employer-hosted BambooHR posting verified active on September 30, 2026. General Investment Analyst application.'),
    ('103', 'Concordia Campus Recruitment', 'Campus Recruitment', 'https://lba.bamboohr.com/careers/103',
      'Concordia campus recruitment stream for Letko Brosseau''s Montreal-based Investment Analyst role in fundamental public-markets investing.',
      'Employer-hosted BambooHR posting verified active on September 30, 2026. Concordia campus recruitment stream.'),
    ('104', 'McGill Campus Recruitment', 'Campus Recruitment', 'https://lba.bamboohr.com/careers/104',
      'McGill campus recruitment stream for Letko Brosseau''s Montreal-based Investment Analyst role in fundamental public-markets investing.',
      'Employer-hosted BambooHR posting verified active on September 30, 2026. McGill campus recruitment stream.'),
    ('105', 'Queen''s Campus Recruitment', 'Campus Recruitment', 'https://lba.bamboohr.com/careers/105',
      'Queen''s campus recruitment stream for Letko Brosseau''s Montreal-based Investment Analyst role in fundamental public-markets investing.',
      'Employer-hosted BambooHR posting verified active on September 30, 2026. Queen''s campus recruitment stream.'),
    ('106', 'Schulich Campus Recruitment', 'Campus Recruitment', 'https://lba.bamboohr.com/careers/106',
      'Schulich campus recruitment stream for Letko Brosseau''s Montreal-based Investment Analyst role in fundamental public-markets investing.',
      'Employer-hosted BambooHR posting verified active on September 30, 2026. Schulich campus recruitment stream.'),
    ('107', 'Rotman Campus Recruitment', 'Campus Recruitment', 'https://lba.bamboohr.com/careers/107',
      'Rotman campus recruitment stream for Letko Brosseau''s Montreal-based Investment Analyst role in fundamental public-markets investing.',
      'Employer-hosted BambooHR posting verified active on September 30, 2026. Rotman campus recruitment stream.'),
    ('108', 'Western Campus Recruitment', 'Campus Recruitment', 'https://lba.bamboohr.com/careers/108',
      'Western campus recruitment stream for Letko Brosseau''s Montreal-based Investment Analyst role in fundamental public-markets investing.',
      'Employer-hosted BambooHR posting verified active on September 30, 2026. Western campus recruitment stream.')
)
INSERT INTO public.jobs (
  external_job_id, company_id, company_name, title, location_display, city, province, country,
  workplace_type, category, specialization, seniority, employment_type, program_type,
  application_url, source_url, source_name, status, summary, description_text,
  description_status, description_verified_at, source_record_id, data_quality_notes,
  last_verified_at, updated_at
)
SELECT
  streams.external_job_id,
  'letko-brosseau',
  'Letko Brosseau',
  'Investment Analyst',
  'Montreal, QC',
  'Montreal',
  'QC',
  'Canada',
  'Hybrid',
  'Asset Management',
  streams.specialization,
  'Analyst',
  'Full-time',
  streams.program_type,
  streams.application_url,
  streams.application_url,
  'Letko Brosseau BambooHR careers',
  'active',
  streams.summary,
  $description$Letko Brosseau is hiring Investment Analysts for its Montreal investment team. The role develops in-depth knowledge of industries and publicly traded companies to identify suitable investments for client portfolios. Analysts conduct fundamental research, build forecasts and valuation models, maintain investment theses, meet company management teams, perform due diligence, develop potential investment ideas and make portfolio recommendations.

The employer seeks candidates with a bachelor's degree, an MBA or M.Sc. in finance or another relevant field, strong academic results and two to five years of professional experience. A CFA designation, relevant industry experience and bilingual or multilingual capability are considered assets. The role requires strong investment judgment, independent research, analytical skills, attention to detail, communication and teamwork.

The position is based in Montreal under a hybrid model with three office days per week. Compensation includes a competitive base salary, annual bonus and employer contribution to a deferred profit-sharing plan, alongside health benefits and professional-development support.$description$,
  'verified',
  now(),
  'bamboohr:lba:' || streams.external_job_id,
  streams.data_quality_notes,
  now(),
  now()
FROM streams
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
