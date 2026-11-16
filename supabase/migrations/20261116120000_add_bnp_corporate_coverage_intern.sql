-- Publish BNP Paribas's Corporate Coverage Intern (Summer 2027, Toronto), added at the owner's request on
-- November 16, 2026. Idempotent: an existing row with the same stable employer identifier is refreshed.

INSERT INTO public.jobs (
  external_job_id, company_id, company_name, title, location_display, city, province, country, workplace_type,
  category, specialization, seniority, employment_type, program_type, date_posted, application_deadline,
  application_url, source_url, source_name, status, featured, summary, description_text, description_status,
  description_verified_at, source_record_id, data_quality_notes, last_verified_at, updated_at
)
VALUES (
  '1234567890100124889', 'bnp-paribas', 'BNP Paribas',
  'Corporate Coverage Intern – Summer 2027',
  'Toronto, ON', 'Toronto', 'ON', 'Canada', NULL,
  'Investment Banking', 'Corporate Coverage', 'Intern / Co-op', 'Internship', 'Internship',
  '2026-11-05', NULL,
  'https://bwelcome.hr.bnpparibas/en_US/externalcareers/JobDetails?jobId=114801&source=BNP+Paribas+website',
  'https://www.bnpparibas.ca/en/jobs/corporate-coverage-intern-summer-2027/',
  'BNP Paribas public careers site', 'active', false,
  'Four-month Summer 2027 internship with BNP Paribas''s Canada Corporate Coverage group in Toronto.',
  'BNP Paribas is hiring a Summer 2027 intern for its Canada Corporate Coverage group in Toronto, as part of a four-month internship program. The intern analyzes financial, operating and strategic information on clients and their sectors, prepares presentation and briefing materials for client meetings and annual credit reviews, tracks industry and market developments, supports the execution of new transactions, monitors key performance indicators and onboarding, and helps bankers with account maintenance, KYC re-certifications and special projects. Candidates must be enrolled full-time in an accredited Canadian undergraduate program, preferably with a finance or accounting focus, graduating in May 2028, with at least one semester remaining after the internship. Strong financial analysis, Excel and PowerPoint skills are expected; corporate banking experience is preferred but not required.',
  'verified', now(), 'bnp-paribas:1234567890100124889',
  'Added at the owner''s request on November 16, 2026, verified against BNP Paribas''s public posting (posted November 5, 2026; reference 1234567890100124889). Corporate coverage role, published by owner decision despite the corporate-banking exclusion.',
  now(), now()
)
ON CONFLICT (source_record_id) DO UPDATE SET
  title = EXCLUDED.title, location_display = EXCLUDED.location_display, city = EXCLUDED.city,
  province = EXCLUDED.province, category = EXCLUDED.category, specialization = EXCLUDED.specialization,
  seniority = EXCLUDED.seniority, employment_type = EXCLUDED.employment_type, program_type = EXCLUDED.program_type,
  date_posted = EXCLUDED.date_posted, application_url = EXCLUDED.application_url, source_url = EXCLUDED.source_url,
  status = 'active', summary = EXCLUDED.summary, description_text = EXCLUDED.description_text,
  description_status = EXCLUDED.description_status, description_verified_at = EXCLUDED.description_verified_at,
  data_quality_notes = EXCLUDED.data_quality_notes, last_verified_at = EXCLUDED.last_verified_at,
  updated_at = EXCLUDED.updated_at;
