-- Publish the employer-verified EY M&A role supplied on October 27, 2026.

INSERT INTO public.jobs (
  external_job_id, company_id, company_name, title,
  location_display, city, province, country, workplace_type,
  category, specialization, seniority, employment_type, program_type,
  date_posted, application_url, source_url, source_name,
  status, featured, summary, description_text,
  description_status, description_verified_at, source_record_id,
  data_quality_notes, last_verified_at, updated_at
)
VALUES (
  '1755823',
  'ey-corporate-finance',
  'EY Corporate Finance',
  'Analyst or Associate, M&A',
  'Calgary or Edmonton, AB',
  'Calgary',
  'AB',
  'Canada',
  NULL,
  'Investment Banking',
  'Mergers & Acquisitions',
  'Associate',
  'Full-time',
  'Full-time',
  '2026-10-26',
  'https://careers.ey.com/ey/job/Calgary-Analyst-or-Associate%2C-M%26A-%28Calgary-or-Edmonton%29-AB-T2P-1M4/1451234333/',
  'https://careers.ey.com/ey/job/Calgary-Analyst-or-Associate%2C-M%26A-%28Calgary-or-Edmonton%29-AB-T2P-1M4/1451234333/',
  'EY Corporate Finance public careers site',
  'active',
  false,
  'Analyst or Associate role supporting the full M&A process for EY Corporate Finance in Calgary or Edmonton.',
  $description$EY Corporate Finance is hiring an Analyst or Associate for its M&A practice in Calgary or Edmonton. The team advises clients on mergers, acquisitions, divestitures, financing, valuations and capital-sourcing activities.

The role participates throughout the transaction process from deal sourcing through closing. Responsibilities include market and industry research, comparable-company and precedent-transaction analysis, detailed financial and scenario modelling, discounted cash-flow and market-based valuation analysis, preparing pitches and transaction materials, managing data rooms and due diligence, advising clients and supporting senior bankers with business development.

Applicants should have an undergraduate degree in business, finance, accounting or a related discipline. EY requests two to four years of related experience for the Analyst level and at least four years of relevant investment-banking, M&A, financing, corporate-development or financial-analysis experience for the Associate level. CPA, CBV or CFA credentials or progress toward them are considered assets.$description$,
  'verified',
  now(),
  'ey-corporate-finance:1755823',
  'Verified against EY Canada''s employer-hosted posting on 2026-10-27. Requisition 1755823; posted 2026-10-26. The employer title identifies Calgary or Edmonton, while Calgary is displayed as the primary location.',
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
  updated_at = EXCLUDED.updated_at;
