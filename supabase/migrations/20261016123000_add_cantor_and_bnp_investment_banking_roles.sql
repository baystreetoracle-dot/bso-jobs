-- Publish two employer-verified investment-banking opportunities supplied on
-- October 16, 2026. Existing editorial featured flags remain unchanged.

WITH incoming AS (
  SELECT * FROM jsonb_to_recordset($companies$[
    {"company_id":"cantor-fitzgerald","name":"Cantor Fitzgerald","company_type":"Investment Bank","headquarters_country":null,"status":"active"},
    {"company_id":"bnp-paribas","name":"BNP Paribas","company_type":"Investment Bank","headquarters_country":null,"status":"active"}
  ]$companies$::jsonb)
  AS company(company_id text, name text, company_type text, headquarters_country text, status text)
)
INSERT INTO public.companies (company_id, name, company_type, headquarters_country, status, updated_at)
SELECT company_id, name, company_type, headquarters_country, status, now()
FROM incoming
ON CONFLICT DO NOTHING;

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
  term_start,
  term_end,
  term_length_months,
  date_posted,
  application_deadline,
  salary_min,
  salary_max,
  salary_currency,
  salary_period,
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
VALUES
(
  '250178',
  'cantor-fitzgerald',
  'Cantor Fitzgerald',
  'Analyst, Metals & Mining Investment Banking',
  'Toronto, ON',
  'Toronto',
  'ON',
  'Canada',
  NULL,
  'Investment Banking',
  'Metals & Mining',
  'Analyst',
  'Full-time',
  'Full-time',
  NULL,
  NULL,
  NULL,
  '2026-10-08',
  NULL,
  100000,
  110000,
  'CAD',
  'year',
  'https://hdow.fa.us6.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1003/job/250178',
  'https://hdow.fa.us6.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1003/job/250178',
  'Cantor Fitzgerald public careers site',
  'active',
  false,
  'Toronto-based Metals & Mining Investment Banking Analyst role supporting M&A, capital raises, restructurings and other advisory assignments.',
  $cantor$Cantor Fitzgerald is seeking an Analyst for its Metals & Mining investment banking team in Toronto. The group advises clients on mergers and acquisitions, equity and debt capital raises, restructurings and other strategic and financial assignments.

Responsibilities include coordinating capital-raising and advisory processes; preparing and analyzing historical and projected financial information; building valuation and other financial models; supporting company and industry due diligence; conducting industry research; preparing confidential information memoranda, management presentations and client pitches; participating in marketing and client meetings; and supporting cross-border transactions with global investors and strategic buyers.

Candidates should have zero to three years of relevant work experience and an undergraduate degree with a strong academic record. Prior investment-banking experience is helpful but not required. The role requires corporate-finance, valuation and financial-accounting knowledge, initiative, attention to detail, strong written and verbal communication, and the ability to manage multiple deliverables in a fast-paced environment.

Cantor states a base salary range of CAD $100,000 to $110,000 plus a discretionary bonus.$cantor$,
  'verified',
  now(),
  'cantor:250178',
  'Verified from the employer-supplied Cantor Fitzgerald posting on 2026-10-16. Job identification 250178; posted 2026-10-08; no application deadline was stated.',
  now(),
  now()
),
(
  '1234567890100122401',
  'bnp-paribas',
  'BNP Paribas',
  'Investment Banking – Summer Analyst',
  'Montréal, QC',
  'Montréal',
  'QC',
  'Canada',
  NULL,
  'Investment Banking',
  'Generalist',
  'Analyst',
  'Internship',
  'Internship',
  NULL,
  NULL,
  4,
  '2026-10-09',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'https://www.bnpparibas.ca/en/jobs/investment-banking-summer-analyst/',
  'https://www.bnpparibas.ca/en/jobs/investment-banking-summer-analyst/',
  'BNP Paribas public careers site',
  'active',
  false,
  'Four-month Montréal Investment Banking Summer Analyst internship supporting BNP Paribas North American sector and advisory teams.',
  $bnp$BNP Paribas is hiring a Summer Analyst in Montréal for its North America Mobility Program. The four-month internship is part of a structured investment-banking development program and supports U.S.-based sector and advisory teams with transaction origination and execution.

Responsibilities include preparing presentations and deal pitches; researching companies and industries; supporting advisory processes; building valuation, merger-consequences and other financial models; providing industry and competitive analysis; and working with senior bankers to manage client deliverables.

Applicants should expect to graduate between fall 2027 and spring 2028 and demonstrate strong academic performance, analytical and quantitative ability, communication skills, accounting and valuation knowledge, and proficiency with Excel, PowerPoint and Word. Prior exposure to M&A, equity capital markets or leveraged finance is preferred. Continued employment after the program requires openness to potential mobility to BNP Paribas' New York office, subject to business needs and individual performance.$bnp$,
  'verified',
  now(),
  'bnp-paribas:1234567890100122401',
  'Verified from the employer-supplied BNP Paribas Canada posting on 2026-10-16. Employer reference 1234567890100122401; posted 2026-10-09; no application deadline was stated.',
  now(),
  now()
),
(
  'JR102588',
  'hoopp',
  'HOOPP',
  'Graduate Capital Markets Rotational Program (September 2027 - September 2028)',
  'Toronto, ON',
  'Toronto',
  'ON',
  'Canada',
  'Hybrid',
  'Institutional Investing',
  'Capital Markets',
  'Analyst',
  'Full-time',
  'Graduate Program',
  '2027-09-01',
  '2028-09-01',
  12,
  '2026-10-13',
  '2026-10-19',
  76000,
  124000,
  'CAD',
  'year',
  'https://hoopp.wd10.myworkdayjobs.com/HOOPPStudent/job/Toronto-Ontario-Canada/Graduate-Capital-Markets-Rotational-Program--September-2027---September-2028-_JR102588',
  'https://hoopp.wd10.myworkdayjobs.com/HOOPPStudent/job/Toronto-Ontario-Canada/Graduate-Capital-Markets-Rotational-Program--September-2027---September-2028-_JR102588',
  'HOOPP public careers site',
  'active',
  false,
  'Twelve-month Toronto graduate rotational program spanning HOOPP Capital Markets investment teams, with potential permanent placement after completion.',
  $hoopp$HOOPP is hiring new graduates for a twelve-month Capital Markets rotational program running from September 2027 to September 2028 in Toronto. Participants may rotate through Public Equities, Interest Rates, Discretionary Derivatives and Alternative Investments, Liquid & Macro Credit, Structured & Private Credit, Cross-Asset Thematic Investing, and Balance Sheet and Liquidity Management. Successful participants may be placed into permanent roles after completing the program.

Responsibilities include researching industries, investment structures and companies; evaluating academic and industry research; preparing financial analysis and complex models; writing investment recommendations; participating in investment and divestment discussions; supporting trading, due diligence and structuring analysis; monitoring direct investments and funds; informing sell, hold and follow-on decisions; and contributing to portfolio strategy, performance and risk analysis.

Applicants should be completing or have recently completed a university degree and demonstrate a strong interest in investment management, financial modelling ability, qualitative and quantitative analytical skills, communication skills and attention to detail. Programming knowledge, including Python, and progress toward a CFA or CPA designation are assets.

The application deadline is October 19, 2026. HOOPP states an annual base salary range of CAD $76,000 to $124,000.$hoopp$,
  'verified',
  now(),
  'hoopp:JR102588',
  'Verified from the employer-supplied HOOPP Workday posting on 2026-10-16. Requisition JR102588; posted approximately 2026-10-13; application deadline 2026-10-19.',
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
  term_end = EXCLUDED.term_end,
  term_length_months = EXCLUDED.term_length_months,
  date_posted = EXCLUDED.date_posted,
  application_deadline = EXCLUDED.application_deadline,
  salary_min = EXCLUDED.salary_min,
  salary_max = EXCLUDED.salary_max,
  salary_currency = EXCLUDED.salary_currency,
  salary_period = EXCLUDED.salary_period,
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
