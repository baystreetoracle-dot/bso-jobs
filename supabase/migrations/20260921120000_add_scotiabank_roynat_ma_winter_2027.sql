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
VALUES (
  '273162',
  'scotiabank',
  'Scotiabank Global Banking and Markets',
  'ASPIRE Commercial Banking - Roynat Capital, M&A - Winter 2027 Co-op / Internship - Toronto',
  'Toronto, ON',
  'Toronto',
  'ON',
  'Canada',
  NULL,
  'Corporate Finance',
  'Mid-Market Mergers & Acquisitions',
  'Intern',
  'Internship',
  'Co-op',
  '2027-01-01',
  '2027-08-31',
  8,
  NULL,
  '2026-10-05',
  NULL,
  NULL,
  NULL,
  NULL,
  'https://jobs.scotiabank.com/job/Toronto-ASPIRE-Commercial-Banking-Roynat-Capital%2C-M%26A-Winter-2027-Co-op-Internship-Toronto-ON/605918317/',
  'https://jobs.scotiabank.com/job/Toronto-ASPIRE-Commercial-Banking-Roynat-Capital%2C-M%26A-Winter-2027-Co-op-Internship-Toronto-ON/605918317/',
  'Scotiabank Careers',
  'active',
  false,
  'Eight-month Winter 2027 co-op/internship with Roynat Capital''s Mid-Market M&A team in Toronto, offering exposure to corporate finance, valuation and transaction analysis.',
  $job$Location: Toronto, ON

Term: January - August 2027

Work Hours: 37.5 hours per week

Application Deadline: October 5, 2026

Kickstart your career with Scotiabank's Commercial Aspire Program. This is an opportunity to gain real-world experience, build your network, and explore Canadian Commercial Banking while contributing meaningfully to the team. Aspire is designed for ambitious students who are curious, collaborative, and eager to learn.

This opportunity provides hands-on exposure to a team that advises Canadian businesses on mergers, acquisitions, divestitures, and other strategic transactions. Students will gain experience analyzing companies, evaluating opportunities, supporting transaction execution, and developing an understanding of how strategic transactions help businesses achieve their growth objectives.

The Roynat Capital Mid-Market Mergers & Acquisitions team partners with business owners, entrepreneurs, and management teams to support mergers, acquisitions, divestitures, and other strategic transactions. The team provides strategic advice, market insights, valuation support, and execution expertise throughout the transaction lifecycle. The role offers exposure to complex transactions, financial analysis, valuation concepts, and corporate finance and M&A advisory.

Responsibilities

- Conduct company, industry, and market research to support strategic transaction opportunities.
- Assist with financial analysis, valuation exercises, and transaction-related materials.
- Support the preparation of client presentations, pitch materials, and transaction documentation.
- Analyze financial statements and business performance to help evaluate potential opportunities and risks.
- Gain exposure to mergers, acquisitions, divestitures, and other strategic transactions.
- Develop an understanding of how strategic transactions support business growth, succession planning, and long-term value creation.
- Build relationships with internal and external stakeholders while supporting various stages of a transaction.
- Ensure that the Bank's risk appetite and risk culture are considered in day-to-day activities and decisions.

Candidate profile

- Client-centric and passionate about enhancing the client experience.
- Collaborative and able to work effectively with others.
- Organized and able to manage multiple priorities with strong attention to detail.
- Comfortable operating in a fast-paced, team-oriented environment.
- Analytical and able to use data to inform decisions and recommendations.
- Intellectually curious and interested in solving complex business and financial problems.

Requirements

- Enrolled in an undergraduate or graduate degree in Business, Commerce, Finance, Accounting, Economics, or a related field.
- Advanced coursework in corporate finance, valuation, financial modeling, mergers and acquisitions, or investment analysis is considered an asset.
- Strong Microsoft Office skills, including Word, Excel, PowerPoint, and Outlook.
- Excellent written and verbal communication skills.
- Good presentation skills and consistent professionalism.
- A natural curiosity and eagerness to learn about Commercial Banking.

Application process

Complete a PLUM Profile and save a screenshot, complete the short one-way video interview linked from the employer posting, and apply online with the PLUM Profile screenshot uploaded when prompted for a resume.$job$,
  'verified',
  now(),
  'scotiabank:273162',
  'Verified against the official Scotiabank careers posting on 2026-09-21. Classified as Corporate Finance because the role is with Roynat Capital Mid-Market M&A inside Commercial Banking, not Global Banking and Markets Investment Banking. Employer requisition ID 273162; public career-page record 605918317.',
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
  term_start = EXCLUDED.term_start,
  term_end = EXCLUDED.term_end,
  term_length_months = EXCLUDED.term_length_months,
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
