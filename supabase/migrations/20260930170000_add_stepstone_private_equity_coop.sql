-- Publish StepStone Group's active 2027 Infrastructure & Real Assets co-op posting.

INSERT INTO public.companies (
  company_id, name, company_type, website_domain,
  headquarters_country, status, updated_at
)
VALUES (
  'stepstone-group',
  'StepStone Group',
  'Private Markets Investment Manager',
  'stepstonegroup.com',
  'United States',
  'active',
  now()
)
ON CONFLICT (company_id) DO UPDATE SET
  name = EXCLUDED.name,
  company_type = EXCLUDED.company_type,
  website_domain = EXCLUDED.website_domain,
  headquarters_country = EXCLUDED.headquarters_country,
  status = EXCLUDED.status,
  updated_at = now();

INSERT INTO public.jobs (
  external_job_id, company_id, company_name, title, location_display, city, province, country,
  workplace_type, category, specialization, seniority, employment_type, program_type,
  term_start, application_url, source_url, source_name, status,
  summary, description_text, description_status, description_verified_at,
  source_record_id, data_quality_notes, last_verified_at, updated_at
)
VALUES (
  '8239658',
  'stepstone-group',
  'StepStone Group',
  '2027 Private Equity Infrastructure & Real Assets Co-op Analyst',
  'Toronto, ON',
  'Toronto',
  'ON',
  'Canada',
  'On-site',
  'Private Equity',
  'Infrastructure & Real Assets',
  'Intern / Co-op',
  'Full-time',
  'Co-op',
  '2027-01-01',
  'https://www.stepstonegroup.com/current-opportunities/?gh_jid=8239658',
  'https://www.stepstonegroup.com/current-opportunities/?gh_jid=8239658',
  'StepStone Group public Greenhouse careers site',
  'active',
  'Toronto-based 2027 co-op with StepStone Infrastructure and Real Assets, evaluating infrastructure funds, co-investments and secondary transactions.',
  $description$StepStone Group is hiring a Co-op Analyst for its Infrastructure and Real Assets team in Toronto. The full-time, in-person placement begins as early as January 2027 and runs for six to eight months. The role provides exposure to infrastructure funds, co-investments, secondary transactions and portfolio monitoring across transportation, telecommunications, utilities, power, energy, logistics, renewables and other real-asset sectors.

The Co-op Analyst supports investment due diligence, sector and market research, private-company and asset valuation, financial modelling, fund-manager analysis and the preparation of recommendations for the team's Investment Committee. The role also assists with tracking investment opportunities and monitoring fund managers and portfolio companies.

Applicants must be legally able to work in Canada without current or future visa sponsorship and be available for full-time, in-person work in Toronto. StepStone is seeking undergraduate, master's or MBA students graduating between September 2026 and June 2028, with strong analytical, quantitative, modelling, communication and Microsoft Office skills.$description$,
  'verified',
  now(),
  'greenhouse:stepstone:8239658',
  'Employer-hosted posting supplied and reviewed on September 30, 2026. The employer does not state an exact posting date or application deadline. The placement is stated as six to eight months beginning as early as January 2027.',
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
  term_start = EXCLUDED.term_start,
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
