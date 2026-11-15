-- Refresh the existing Canaccord Origination Associate posting after confirming
-- requisition JR100618 remains active on the employer's public Workday site.

UPDATE public.jobs
SET
  workplace_type = 'On-site',
  category = 'Investment Banking',
  specialization = 'Origination',
  seniority = 'Associate',
  employment_type = 'Full-time',
  program_type = 'Full-time',
  salary_min = 125000,
  salary_max = 135000,
  salary_currency = 'CAD',
  salary_period = 'year',
  application_url = 'https://cgf.wd10.myworkdayjobs.com/CG/job/Toronto-ON/Investment-Banking-Associate---Origination_JR100618',
  source_url = 'https://cgf.wd10.myworkdayjobs.com/CG/job/Toronto-ON/Investment-Banking-Associate---Origination_JR100618',
  status = 'active',
  summary = 'Toronto Investment Banking Associate role focused on originating and executing corporate finance, M&A and capital-markets mandates.',
  description_text = 'Canaccord Genuity is hiring an Investment Banking Associate for its Origination group in Toronto. The role supports the origination and execution of corporate finance, M&A, debt-capital-markets and equity-capital-markets transactions. Responsibilities include company and industry research, client materials, due diligence and financial analysis including DCF, comparable-company, precedent-transaction, LBO and accretion-dilution models. Candidates should have at least three years of investment-banking or closely related experience. The employer lists an annual base salary range of CAD $125,000 to $135,000 and describes the position as on-site.',
  description_status = 'verified',
  description_verified_at = now(),
  data_quality_notes = 'Verified against Canaccord Genuity''s employer-hosted Workday posting on November 15, 2026. Stable requisition JR100618.',
  last_verified_at = now(),
  updated_at = now()
WHERE source_record_id = 'canaccord:JR100618';
