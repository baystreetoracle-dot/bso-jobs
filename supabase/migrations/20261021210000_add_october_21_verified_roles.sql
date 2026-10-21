-- Publish nine employer-verified roles from the October 21 collector review.
-- The proposed Fengate Winter 2027 role is intentionally excluded: its
-- current Workday board only lists the already-published Summer 2027 role.

INSERT INTO public.jobs (
  external_job_id, company_id, company_name, title,
  location_display, city, province, country, workplace_type,
  category, specialization, seniority, employment_type, program_type,
  term_start, term_end, term_length_months,
  date_posted, application_deadline,
  salary_min, salary_max, salary_currency, salary_period,
  application_url, source_url, source_name,
  status, featured, summary, description_text,
  description_status, description_verified_at, source_record_id,
  data_quality_notes, last_verified_at, updated_at
)
VALUES
(
  'R260029478', 'bmo-capital-markets', 'BMO Capital Markets',
  'Vice-President, Middle Market Mergers & Acquisitions (M&A)',
  'Toronto, ON', 'Toronto', 'ON', 'Canada', NULL,
  'Investment Banking', 'Mergers & Acquisitions', 'Vice President', 'Full-time', 'Full-time',
  NULL, NULL, NULL, '2026-10-21', '2026-11-11',
  130000, 150000, 'CAD', 'year',
  'https://jobs.bmo.com/ca/en/job/BOMOGLOBALR260029478EXTERNALENCA/Vice-President-Middle-Market-Mergers-and-Acquisitions-M-and-A',
  'https://jobs.bmo.com/ca/en/job/BOMOGLOBALR260029478EXTERNALENCA/Vice-President-Middle-Market-Mergers-and-Acquisitions-M-and-A',
  'BMO Capital Markets public careers site', 'active', false,
  'Toronto Vice-President role originating and executing middle-market M&A transactions for privately owned and entrepreneur-led businesses across Canada.',
  $bmo$BMO Capital Markets is hiring a Vice-President for its Middle Market Mergers & Acquisitions team in Toronto. The role leads sell-side and buy-side mandates from engagement through closing, develops financial models and valuation analysis, oversees transaction materials and buyer outreach, coordinates due diligence and supports negotiations.

The Vice-President will also develop relationships with business owners, private equity firms, family offices and strategic acquirers; originate advisory mandates; lead client pitches; and coach Analysts and Associates. BMO seeks candidates with at least five to seven years of relevant M&A advisory, investment-banking, corporate-development or corporate-finance experience and states a base salary of CAD $130,000 to $150,000 plus an annual performance bonus.$bmo$,
  'verified', now(), 'bmo:R260029478',
  'Verified against BMO''s employer-hosted posting on 2026-10-21. Requisition R260029478; posted 2026-10-21; application deadline 2026-11-11.',
  now(), now()
),
(
  'origin-2027-summer-analyst-montreal', 'origin-merchant-partners', 'Origin Merchant Partners',
  'Investment Banking Summer Analyst - Montreal Office',
  'Montréal, QC', 'Montréal', 'QC', 'Canada', 'On-site',
  'Investment Banking', 'Generalist', 'Intern / Co-op', 'Internship', 'Internship',
  NULL, NULL, 4, '2026-10-19', '2026-11-01',
  NULL, NULL, NULL, NULL,
  'https://www.originmerchant.com/wp-content/uploads/2026/10/Origin-Merchant-Partners-2027-Summer-Analyst-Montreal.pdf',
  'https://www.originmerchant.com/wp-content/uploads/2026/10/Origin-Merchant-Partners-2027-Summer-Analyst-Montreal.pdf',
  'Origin Merchant Partners public careers site', 'active', false,
  'Four-month Montréal investment-banking internship with Origin Merchant Partners for April/May through August 2027.',
  $origin$Origin Merchant Partners is hiring an Investment Banking Summer Analyst for its Montréal office for April or May through August 2027. Summer Analysts support advisory and financing transactions through financial and valuation analysis, detailed modelling, presentation preparation, company and industry research, due diligence, offering-document preparation and transaction marketing.

Applicants should demonstrate strong technical skills, finance knowledge, excellent French and English communication, an interest in capital markets and a strong academic record. Applications require a resume, academic transcripts and a cover letter addressed to Daisy Miller and emailed to careers@originmerchant.com by November 1, 2026.$origin$,
  'verified', now(), 'origin-merchant:origin-2027-summer-analyst-montreal',
  'Verified against the employer-hosted one-page Origin Merchant Partners PDF on 2026-10-21. The PDF was created 2026-10-19 and states a 2026-11-01 application deadline.',
  now(), now()
),
(
  'JR7235', 'bdo-ma', 'BDO M&A & Capital Markets',
  'Manager, Business Restructuring & Turnaround Services',
  'Toronto, ON / Oakville, ON', NULL, 'ON', 'Canada', NULL,
  'Corporate Finance', 'Restructuring', 'Other', 'Full-time', 'Full-time',
  NULL, NULL, NULL, '2026-10-19', NULL,
  NULL, NULL, NULL, NULL,
  'https://bdo.wd3.myworkdayjobs.com/BDO/job/Toronto---Wellington-St/Manager--Business-Restructuring---Turnaround-Services_JR7235',
  'https://bdo.wd3.myworkdayjobs.com/BDO/job/Toronto---Wellington-St/Manager--Business-Restructuring---Turnaround-Services_JR7235',
  'BDO public careers site', 'active', false,
  'Corporate restructuring and turnaround Manager role with BDO in Toronto or Oakville.',
  $bdo$BDO is hiring a Manager for its Corporate Restructuring team in Toronto or Oakville. The role advises companies, lenders, creditors, shareholders and other stakeholders through financial reviews, business turnarounds, insolvency proceedings and formal or informal restructurings.

Responsibilities include analyzing distressed businesses, developing restructuring and stabilization alternatives, preparing integrated cash-flow models and financial projections, leading engagement workstreams, presenting recommendations to senior stakeholders and coaching engagement-team members. Applicants require at least two years of relevant restructuring, insolvency, turnaround or financial-advisory experience and a Canadian CPA designation.$bdo$,
  'verified', now(), 'bdo-ma:JR7235',
  'Verified against BDO''s employer-hosted Workday posting on 2026-10-21. Requisition JR7235; posted 2026-10-19; no application deadline was stated.',
  now(), now()
),
(
  'JR101641', 'bci', 'BCI', 'Senior Principal (Infrastructure Debt)',
  'Victoria, BC', 'Victoria', 'BC', 'Canada', NULL,
  'Private Credit', 'Infrastructure Debt', 'Director', 'Full-time', 'Full-time',
  NULL, NULL, NULL, '2026-10-20', '2026-11-11',
  NULL, NULL, NULL, NULL,
  'https://bci.wd10.myworkdayjobs.com/BCI_Careers/job/Victoria-BC/Senior-Principal--Infrastructure-Debt-_JR101641',
  'https://bci.wd10.myworkdayjobs.com/BCI_Careers/job/Victoria-BC/Senior-Principal--Infrastructure-Debt-_JR101641',
  'BCI public careers site', 'active', false,
  'Senior infrastructure-debt investment role sourcing, underwriting, executing and managing private credit investments for BCI in Victoria.',
  $bci_debt$BCI is hiring a Senior Principal for its Infrastructure & Renewable Resources team in Victoria. The role sources, evaluates, executes and manages private infrastructure debt investments and external-fund relationships, leads diligence and investment analysis, develops Investment Committee materials and monitors investments.

Applicants should have seven to ten years of experience in private debt, investment banking, M&A, private equity, management consulting, financial advisory or ratings, including infrastructure-investment exposure and a lead role in private-credit transactions.$bci_debt$,
  'verified', now(), 'bci:JR101641',
  'Verified against BCI''s employer-hosted Workday posting on 2026-10-21. Requisition JR101641; posted 2026-10-20; Workday end date 2026-11-11 and stated posting close date 2026-11-10.',
  now(), now()
),
(
  'JR101639', 'bci', 'BCI', 'Managing Director, Partnership Portfolio',
  'Victoria, BC', 'Victoria', 'BC', 'Canada', NULL,
  'Private Credit', 'Partnership Portfolio', 'Managing Director', 'Full-time', 'Full-time',
  NULL, NULL, NULL, '2026-10-19', '2026-11-10',
  NULL, NULL, NULL, NULL,
  'https://bci.wd10.myworkdayjobs.com/BCI_Careers/job/Victoria-BC/Managing-Director--Partnership-Portfolio_JR101639',
  'https://bci.wd10.myworkdayjobs.com/BCI_Careers/job/Victoria-BC/Managing-Director--Partnership-Portfolio_JR101639',
  'BCI public careers site', 'active', false,
  'Senior BCI investment leadership role originating, underwriting and managing private-credit and structured-capital investments.',
  $bci_md$BCI is hiring a Managing Director for its Partnership Portfolio team in Victoria. The role leads the origination, underwriting, structuring, negotiation and management of private-credit and structured-capital investments through funds, co-investments and direct transactions.

The Managing Director is accountable for investment recommendations, portfolio strategy and assigned exposures throughout their life cycle, while developing investment partnerships and leading other investment professionals. Applicants typically require at least twelve years of relevant experience with significant co-investment or direct-investment responsibility in private credit.$bci_md$,
  'verified', now(), 'bci:JR101639',
  'Verified against BCI''s employer-hosted Workday posting on 2026-10-21. Requisition JR101639; posted 2026-10-19; Workday end date 2026-11-10 and stated posting close date 2026-11-09.',
  now(), now()
),
(
  'R4844', 'psp-investments', 'PSP Investments',
  'Intern, Portfolio Management, Real Estate Investments (January - April 2027)',
  'Montréal, QC', 'Montréal', 'QC', 'Canada', NULL,
  'Real Estate Investing', 'Real Estate', 'Intern / Co-op', 'Internship', 'Internship',
  '2027-01-01', '2027-04-30', 4, '2026-10-20', NULL,
  NULL, NULL, NULL, NULL,
  'https://investpsp.wd3.myworkdayjobs.com/psp_careers/job/Montreal/Intern--Portfolio-Management--Real-Estate-Investments--January---April-2027-_R4844',
  'https://investpsp.wd3.myworkdayjobs.com/psp_careers/job/Montreal/Intern--Portfolio-Management--Real-Estate-Investments--January---April-2027-_R4844',
  'PSP Investments public careers site', 'active', false,
  'Winter 2027 Montréal internship supporting portfolio data, reporting and systems for PSP Investments'' Real Estate group.',
  $psp$PSP Investments is hiring a Portfolio Management intern for its Real Estate Investments team in Montréal from January through April 2027. The role supports the Real Estate group through portfolio-data management, reporting, dashboards, system implementations, data governance and operational requests.

Applicants must be enrolled in a university program in Finance, Business, IT or a related discipline, possess strong Excel skills and return to their studies after the internship or complete the placement as part of their curriculum. Intermediate SQL knowledge is an asset.$psp$,
  'verified', now(), 'psp-investments:R4844',
  'Verified against PSP Investments'' employer-hosted Workday posting on 2026-10-21. Requisition R4844; posted 2026-10-20; no application deadline was provided by Workday.',
  now(), now()
),
(
  'R26-149', 'imco', 'IMCO', 'Intern, Real Estate (Summer 2027)',
  'Toronto, ON', 'Toronto', 'ON', 'Canada', 'Hybrid',
  'Real Estate Investing', 'Real Estate', 'Intern / Co-op', 'Internship', 'Internship',
  '2027-05-01', '2027-08-31', 4, '2026-10-19', '2026-11-03',
  45000, 65000, 'CAD', 'year',
  'https://imcoinvest.wd3.myworkdayjobs.com/IMCO/job/Toronto---16-York-St/Intern--Real-Estate_R26-149',
  'https://imcoinvest.wd3.myworkdayjobs.com/IMCO/job/Toronto---16-York-St/Intern--Real-Estate_R26-149',
  'IMCO public careers site', 'active', false,
  'Four-month Summer 2027 internship supporting IMCO''s Real Estate investment team in Toronto.',
  $imco_re$IMCO is hiring a Real Estate intern in Toronto from May through August 2027. The intern will support financial modelling, property-level cash-flow forecasting, valuation, performance attribution and underwriting; conduct market and comparable research; assist the Real Estate investments and portfolio-management teams; and monitor assets throughout the investment life cycle.

Applicants should have completed their second, third or fourth undergraduate year and demonstrate knowledge of real-estate investment, accounting and valuation. Excel and other Microsoft Office skills are required, while ARGUS knowledge is an asset. IMCO states an annualized salary range of CAD $45,000 to $65,000.$imco_re$,
  'verified', now(), 'imco:R26-149',
  'Verified against IMCO''s employer-hosted Workday posting on 2026-10-21. Requisition R26-149; posted 2026-10-19; Workday end date 2026-11-03. The posting asks candidates to submit by 2026-11-02.',
  now(), now()
),
(
  'R26-152', 'imco', 'IMCO', 'Intern, Total Portfolio and Capital Markets (Summer 2027)',
  'Toronto, ON', 'Toronto', 'ON', 'Canada', 'Hybrid',
  'Institutional Investing', 'Total Portfolio & Capital Markets', 'Intern / Co-op', 'Internship', 'Internship',
  '2027-05-01', '2027-08-31', 4, '2026-10-19', '2026-11-03',
  45000, 65000, 'CAD', 'year',
  'https://imcoinvest.wd3.myworkdayjobs.com/IMCO/job/Toronto---16-York-St/Intern--Total-Portfolio-and-Capital-Markets--Summer-2027-_R26-152',
  'https://imcoinvest.wd3.myworkdayjobs.com/IMCO/job/Toronto---16-York-St/Intern--Total-Portfolio-and-Capital-Markets--Summer-2027-_R26-152',
  'IMCO public careers site', 'active', false,
  'Four-month Summer 2027 Toronto internship rotating across IMCO''s Total Portfolio & Capital Markets teams.',
  $imco_tpcm$IMCO is hiring a Total Portfolio and Capital Markets intern in Toronto from May through August 2027. The role rotates across FX management, fixed-income portfolio management, centralized trading, portfolio construction, and investment research and economics.

Responsibilities include analyzing macroeconomic and financial-market data, building charts and reports, supporting investment decisions, working with portfolio managers to assess investments and learning the trade-execution life cycle. IMCO states an annualized salary range of CAD $45,000 to $65,000.$imco_tpcm$,
  'verified', now(), 'imco:R26-152',
  'Verified against IMCO''s employer-hosted Workday posting on 2026-10-21. Requisition R26-152; posted 2026-10-19; Workday end date 2026-11-03. The posting asks candidates to submit by 2026-11-02.',
  now(), now()
),
(
  'R26-157', 'imco', 'IMCO', 'Intern, Total Portfolio & Strategic Initiatives (Summer 2027)',
  'Toronto, ON', 'Toronto', 'ON', 'Canada', 'Hybrid',
  'Institutional Investing', 'Portfolio Strategy', 'Intern / Co-op', 'Internship', 'Internship',
  '2027-05-01', '2027-08-31', 4, '2026-10-19', '2026-11-03',
  45000, 65000, 'CAD', 'year',
  'https://imcoinvest.wd3.myworkdayjobs.com/IMCO/job/Toronto---16-York-St/Intern--Total-Portfolio---Strategic-Initiatives--Summer-2027-_R26-157',
  'https://imcoinvest.wd3.myworkdayjobs.com/IMCO/job/Toronto---16-York-St/Intern--Total-Portfolio---Strategic-Initiatives--Summer-2027-_R26-157',
  'IMCO public careers site', 'active', false,
  'Four-month Summer 2027 internship supporting IMCO''s total-portfolio management and strategic investment priorities in Toronto.',
  $imco_strategy$IMCO is hiring a Total Portfolio & Strategic Initiatives intern in Toronto from May through August 2027. The team works across Public Equities, Fixed Income, Real Estate, Global Infrastructure, Global Credit and Private Equity to improve portfolio outcomes and execute strategic initiatives.

The intern will support investment and enterprise teams through research, analysis, project management, stakeholder coordination, portfolio metrics and senior-stakeholder presentations. IMCO states an annualized salary range of CAD $45,000 to $65,000.$imco_strategy$,
  'verified', now(), 'imco:R26-157',
  'Verified against IMCO''s employer-hosted Workday posting on 2026-10-21. Requisition R26-157; posted 2026-10-19; Workday end date 2026-11-03. The posting asks candidates to submit by 2026-11-02.',
  now(), now()
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
  featured = EXCLUDED.featured,
  summary = EXCLUDED.summary,
  description_text = EXCLUDED.description_text,
  description_status = EXCLUDED.description_status,
  description_verified_at = EXCLUDED.description_verified_at,
  data_quality_notes = EXCLUDED.data_quality_notes,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = EXCLUDED.updated_at;
