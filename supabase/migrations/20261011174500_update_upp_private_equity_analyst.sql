-- Correct and complete the existing UPP Senior Analyst, Private Equity record
-- using the employer-hosted Dayforce posting supplied on October 11, 2026.

UPDATE public.jobs
SET
  location_display = 'Toronto, ON',
  city = 'Toronto',
  province = 'ON',
  country = 'Canada',
  workplace_type = 'Hybrid',
  category = 'Private Equity',
  specialization = 'Private Equity',
  seniority = 'Analyst',
  employment_type = 'Full-time',
  program_type = 'Full-time',
  date_posted = '2026-09-15',
  salary_min = 105000,
  salary_max = 130000,
  salary_currency = 'CAD',
  salary_period = 'year',
  summary = 'Senior Analyst role with University Pension Plan Ontario''s Private Equity team in Toronto, supporting private-markets strategy, investment evaluation and portfolio management.',
  description_text = 'University Pension Plan Ontario is hiring a Senior Analyst for its Private Equity team in Toronto. Reporting to the Director, Private Equity Lead, the role supports the development of UPP''s Private Markets strategy and Private Equity portfolio. Responsibilities include investment research and analysis, valuation and performance monitoring, assessing new opportunities, supporting existing portfolio investments, conducting financial modelling and due diligence, contributing to transaction structuring, working with external investors and partners, and integrating ESG considerations into investment processes. Candidates should have a bachelor''s degree in finance, business administration, economics or a related field and two to three years of experience in private markets or a related industry. MBA, CFA, CPA, CBV or CAIA credentials are assets. The role follows a hybrid model with approximately two days per week in UPP''s downtown Toronto office. The employer states an annual base salary range of CAD 105,000 to CAD 130,000 plus eligibility for a variable incentive.',
  description_status = 'verified',
  description_verified_at = now(),
  data_quality_notes = 'Employer-hosted Dayforce posting reviewed October 11, 2026. Corrected the specialization from Private Credit to Private Equity and added employer-disclosed compensation, workplace model and posted date.',
  last_verified_at = now(),
  updated_at = now()
WHERE source_record_id = 'upp:2238';
