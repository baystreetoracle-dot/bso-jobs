-- Apply the October 1 approved collector digest.
-- Adds the two approved roles, closes the nine approved stale roles,
-- refreshes the 70 approved employer-source matches, and moves Citi into the featured set.
-- Raw employer location formatting is intentionally not copied over the site's standardized
-- City, Province display, and missing source metadata does not erase curated enrichment.

INSERT INTO public.companies (
  company_id, name, parent_company, company_type, website_domain,
  headquarters_country, status, updated_at
)
VALUES (
  'citi', 'Citi', 'Citigroup Inc.', 'Global Bank', 'citi.com',
  'United States', 'active', now()
)
ON CONFLICT (company_id) DO UPDATE SET
  name = EXCLUDED.name,
  parent_company = EXCLUDED.parent_company,
  company_type = EXCLUDED.company_type,
  website_domain = EXCLUDED.website_domain,
  headquarters_country = EXCLUDED.headquarters_country,
  status = EXCLUDED.status,
  updated_at = now();

WITH approved AS (
  SELECT job_id, external_job_id, patch
  FROM jsonb_to_recordset($approved_updates$
[
  {
    "job_id": "3065c50c-5d14-4b50-ae20-f9352e70a170",
    "external_job_id": "R-0000178260",
    "patch": {
      "employment_type": "Full-time",
      "date_posted": "2026-06-22",
      "application_url": "https://rbc.wd3.myworkdayjobs.com/RBCGLOBAL1/job/VANCOUVER-British-Columbia-Canada/VP--Global-Investment-Banking--Mining---Metals_R-0000178260/apply",
      "source_url": "https://jobs.rbc.com/ca/en/job/RBCAA0088R0000178260EXTERNALENCA/VP-Global-Investment-Banking-Mining-and-Metals"
    }
  },
  {
    "job_id": "4381111b-9729-4ab6-ae42-d0721f3df8ce",
    "external_job_id": "R-0000187979",
    "patch": {
      "employment_type": "Full-time",
      "date_posted": "2026-09-15"
    }
  },
  {
    "job_id": "c82a70a7-51e5-48f5-9432-e3cd37c58a52",
    "external_job_id": "R-0000189164",
    "patch": {
      "employment_type": "Full-time",
      "date_posted": "2026-09-27"
    }
  },
  {
    "job_id": "07581876-6af4-4813-b0f5-7508345f81c0",
    "external_job_id": "R-0000189162",
    "patch": {
      "employment_type": "Full-time",
      "date_posted": "2026-09-27"
    }
  },
  {
    "job_id": "8c7fb4d9-cc8d-4ac0-9415-96c5e842651d",
    "external_job_id": "R_1479567",
    "patch": {
      "employment_type": "Full-time",
      "application_url": "https://td.wd3.myworkdayjobs.com/TD_Bank_Careers/job/Toronto-Ontario/Investment-Banking-Associate--Mergers---Acquisitions_R_1479567",
      "source_url": "https://td.wd3.myworkdayjobs.com/TD_Bank_Careers/job/Toronto-Ontario/Investment-Banking-Associate--Mergers---Acquisitions_R_1479567"
    }
  },
  {
    "job_id": "a6ca5ef2-061c-4099-aff4-b28126b00c53",
    "external_job_id": "2619733",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "54076d8a-a23b-435d-9d28-cc576a30e929",
    "external_job_id": "2619741",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "8011d29c-fe6f-4cc3-9c52-cccb030ab2aa",
    "external_job_id": "2617415",
    "patch": {
      "employment_type": "Full-time",
      "application_url": "https://cibc.wd3.myworkdayjobs.com/search/job/Calgary-AB/Director--Global-Investment-Banking_2617415-1",
      "source_url": "https://cibc.wd3.myworkdayjobs.com/search/job/Calgary-AB/Director--Global-Investment-Banking_2617415-1"
    }
  },
  {
    "job_id": "e4061dfd-e3cf-46db-806e-90059c080afc",
    "external_job_id": "2618453",
    "patch": {
      "title": "Global Investment Banking Analyst, Winter 2027 Analyst (Winnipeg)",
      "employment_type": "Full-time",
      "program_type": "Internship"
    }
  },
  {
    "job_id": "0aba84d6-3abc-4467-bc29-0b85dff2be57",
    "external_job_id": "R7181",
    "patch": {
      "title": "Mizuho | Greenhill – Investment Banking M&A Associate (Toronto)",
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "14b5e5f8-3a9b-488a-8937-c07d4d2be27d",
    "external_job_id": "9916",
    "patch": {
      "employment_type": "Full-time",
      "date_posted": "2026-09-15"
    }
  },
  {
    "job_id": "4dc2004e-8bee-442d-baeb-85f0a356bb69",
    "external_job_id": "url-27ffe3bfb3dd81d86db5",
    "patch": {
      "title": "Full-Time Analyst - Toronto"
    }
  },
  {
    "job_id": "58141e22-2f79-470d-8144-04148ca00ac2",
    "external_job_id": "url-4f36e26ae19ef78c45e7",
    "patch": {}
  },
  {
    "job_id": "17bfd01e-e12d-4f55-b9f8-96dcce73a28b",
    "external_job_id": "url-fdc62dbbc16752e3c7ba",
    "patch": {}
  },
  {
    "job_id": "bf31241e-f317-46b6-9342-67ea1d882e25",
    "external_job_id": "url-fdf089e355a5b20eb9b5",
    "patch": {}
  },
  {
    "job_id": "ea4d849a-d230-459c-bb6c-81163b894c7d",
    "external_job_id": "url-86df9e456a28d5f95a3b",
    "patch": {}
  },
  {
    "job_id": "0abc2abb-2210-4006-927f-8590a723d8e9",
    "external_job_id": "url-1792c8806c930381ae7b",
    "patch": {}
  },
  {
    "job_id": "fbcf29a4-5f28-44ab-93ff-f68da25e91ac",
    "external_job_id": "url-fbe980c02f63eae34c18",
    "patch": {}
  },
  {
    "job_id": "55ef2f7b-cecd-4ac8-816c-612f98520150",
    "external_job_id": "url-ed9bd4e76e96de5b1dc6",
    "patch": {}
  },
  {
    "job_id": "d1f63514-a69b-4ce7-ae70-bf171cbf99a6",
    "external_job_id": "url-3cea082d969252af8346",
    "patch": {}
  },
  {
    "job_id": "07810e7e-348f-4c51-bda6-b1993237321d",
    "external_job_id": "url-20f013d7615fc4370ae0",
    "patch": {
      "company_name": "Agentis Capital",
      "title": "Investment Banking Summer Analyst - Summer 2027"
    }
  },
  {
    "job_id": "c0f4eaff-f6f2-431a-9fc2-2a98d94989c7",
    "external_job_id": "url-8dcfcd849b5f0e12cb84",
    "patch": {}
  },
  {
    "job_id": "0c2a9b37-43cc-4e45-aabe-c0775cace3b3",
    "external_job_id": "url-454f7011de1c7ec2259d",
    "patch": {}
  },
  {
    "job_id": "ba2399a1-e68f-4b69-96a8-3fc0b8639b32",
    "external_job_id": "url-7693d4c8928247a718e2",
    "patch": {
      "company_name": "EY-Parthenon Corporate Finance",
      "title": "Associate (Manager), M&A (Montreal)"
    }
  },
  {
    "job_id": "6226a99b-9185-4fc4-a826-bb48b0bc57b8",
    "external_job_id": "url-92155691fa9c22f93892",
    "patch": {}
  },
  {
    "job_id": "7ad6abb2-ca82-45da-b388-8ff8787765bd",
    "external_job_id": "url-f9db8b56f2d994595409",
    "patch": {}
  },
  {
    "job_id": "46fc87d8-f774-45b5-b0bd-6cd19d863291",
    "external_job_id": "JR7113",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "e4b828c1-17f8-46ad-b72a-432af1454acd",
    "external_job_id": "JR7107",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "109cb2a6-89f6-4eb1-b6bb-595eabad73f2",
    "external_job_id": "JR7076",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "da034a4b-491b-45d7-bebc-bcda25b658d6",
    "external_job_id": "JR7077",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "dc41f769-9fc5-4853-bd64-515d50b74e45",
    "external_job_id": "url-a5f0fdf423687b116def",
    "patch": {
      "title": "Investment Banking Summer Analyst - Summer 2027"
    }
  },
  {
    "job_id": "65f4a16a-a31f-4510-a36a-abc560978e1e",
    "external_job_id": "JR00735",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "e17a138e-812a-4c7e-bbf3-9e39ae1743f4",
    "external_job_id": "JR00837",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "ca506d77-0f49-404b-a61d-f2a0d9391a10",
    "external_job_id": "JR00848",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "8ac047c4-e277-413b-8e9a-f85d52a3c1d1",
    "external_job_id": "6990",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "97116892-2537-4ec0-a384-b373c559ba34",
    "external_job_id": "7222",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "1f8fb989-fbab-4485-9b61-65b49fb5ef46",
    "external_job_id": "7004",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "4311cb1b-3960-4582-8775-c420b1044b3b",
    "external_job_id": "7008",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "c27c50b0-06a2-480f-8ea1-631f92f58551",
    "external_job_id": "7006",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "e7d91e5c-087c-49db-b382-d7ba7f7a93fe",
    "external_job_id": "7007",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "03a777e4-9677-49e6-9071-3c152c6bd5d3",
    "external_job_id": "7188",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "8fd013c2-62f4-435d-9a64-b267e7d61dd0",
    "external_job_id": "7225",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "f72346f2-9b90-4582-bf1e-8366be1ca544",
    "external_job_id": "7248",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "89722985-1ddd-494c-a427-e4523ac4e03a",
    "external_job_id": "7058",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "d4eec857-0fa3-4c29-9fee-74af1e0d781e",
    "external_job_id": "JR101581",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "4efb8406-d1a1-474d-903e-4eb5b9b8e588",
    "external_job_id": "JR101582",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "3b4fccec-81a6-4f36-95d0-7490d75eafdd",
    "external_job_id": "JR101593",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "4fb3380f-0063-4715-8b10-d09059bfb882",
    "external_job_id": "JR101589",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "ac2f3296-e51f-4b08-854e-f69116064a0a",
    "external_job_id": "JR101352",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "1a869314-e43b-4e0d-9772-2626aca345d2",
    "external_job_id": "R4973",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "9ed23a4d-3b24-4b28-ad8d-f478874e8403",
    "external_job_id": "R4942",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "9cd913a4-672c-4130-9810-7a0cdd697586",
    "external_job_id": "R4937",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "cd443c2d-3f23-4037-a1fb-7c292d5640ea",
    "external_job_id": "R4902",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "418e1381-db9d-45b4-8bb6-7f317b3a11fa",
    "external_job_id": "R4874",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "c6e327e0-079a-4357-a2ce-2665f812b75b",
    "external_job_id": "R4582",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "b4edb582-3232-42b1-a686-e0e5a25443b3",
    "external_job_id": "R4752",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "640f7f50-ec80-4f5a-93e2-d6a40f607bc4",
    "external_job_id": "R4729",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "6a1fe8fa-5abd-44e7-adb1-4818918d8477",
    "external_job_id": "R4523",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "834336b7-7dea-4527-966e-4101cb555c3b",
    "external_job_id": "R4631",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "94cef183-e7a1-4ad8-a1cc-40c83de191f4",
    "external_job_id": "JR100915",
    "patch": {
      "specialization": "Private Credit",
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "87f61d29-a4e6-4517-949e-1b7186925490",
    "external_job_id": "JR102500",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "60cd7bbf-27cd-4946-bc74-bfee40b2d52d",
    "external_job_id": "JR102503",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "aa7c5517-6b6e-4e80-8b9a-34f77b40f510",
    "external_job_id": "JR102445",
    "patch": {}
  },
  {
    "job_id": "dffe72a3-bfb7-480b-a0e7-7155932f2205",
    "external_job_id": "R26-99",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "cd6c622d-877a-467a-8cac-d5ab1d683437",
    "external_job_id": "R26-138",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "8669c845-9064-4cc5-8d92-7dc051f95eab",
    "external_job_id": "R2047917",
    "patch": {
      "specialization": "Private Credit",
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "f9589125-33c1-4af9-8dfa-bb73f8a2203d",
    "external_job_id": "R2052799",
    "patch": {
      "specialization": "Private Equity",
      "employment_type": "Full-time",
      "date_posted": "2026-09-11"
    }
  },
  {
    "job_id": "ed1823a9-8ac4-407c-8d88-db8b639e5620",
    "external_job_id": "JR5966",
    "patch": {
      "employment_type": "Full-time",
      "date_posted": "2026-09-18"
    }
  },
  {
    "job_id": "1d20b848-7b7d-4f24-8d7e-8e57759523ce",
    "external_job_id": "JR19",
    "patch": {
      "employment_type": "Full-time"
    }
  },
  {
    "job_id": "5c3dad67-7bcb-4597-9fa2-8cd67910fc0f",
    "external_job_id": "JR15",
    "patch": {
      "employment_type": "Full-time"
    }
  }
]
$approved_updates$::jsonb) AS row(job_id uuid, external_job_id text, patch jsonb)
)
UPDATE public.jobs AS jobs
SET
  company_name = CASE WHEN approved.patch ? 'company_name' THEN approved.patch->>'company_name' ELSE jobs.company_name END,
  title = CASE WHEN approved.patch ? 'title' THEN approved.patch->>'title' ELSE jobs.title END,
  specialization = CASE WHEN approved.patch ? 'specialization' THEN approved.patch->>'specialization' ELSE jobs.specialization END,
  seniority = CASE WHEN approved.patch ? 'seniority' THEN approved.patch->>'seniority' ELSE jobs.seniority END,
  employment_type = CASE WHEN approved.patch ? 'employment_type' THEN approved.patch->>'employment_type' ELSE jobs.employment_type END,
  program_type = CASE WHEN approved.patch ? 'program_type' THEN approved.patch->>'program_type' ELSE jobs.program_type END,
  date_posted = CASE WHEN approved.patch ? 'date_posted' THEN NULLIF(approved.patch->>'date_posted', '')::date ELSE jobs.date_posted END,
  application_deadline = CASE WHEN approved.patch ? 'application_deadline' THEN NULLIF(approved.patch->>'application_deadline', '')::date ELSE jobs.application_deadline END,
  application_url = CASE WHEN approved.patch ? 'application_url' THEN approved.patch->>'application_url' ELSE jobs.application_url END,
  source_url = CASE WHEN approved.patch ? 'source_url' THEN approved.patch->>'source_url' ELSE jobs.source_url END,
  last_verified_at = now(),
  updated_at = now()
FROM approved
WHERE jobs.id = approved.job_id
  AND jobs.external_job_id = approved.external_job_id;

INSERT INTO public.jobs (
  external_job_id, company_id, company_name, title, location_display, city, province, country,
  workplace_type, category, specialization, seniority, employment_type, program_type,
  date_posted, salary_min, salary_max, salary_currency, salary_period,
  application_url, source_url, source_name, source_record_id, status, featured,
  summary, description_text, description_status, description_verified_at,
  data_quality_notes, last_verified_at, updated_at
)
VALUES (
  '26997599', 'citi', 'Citi', 'Investment Banking Analyst - Metals & Mining',
  'Toronto, ON', 'Toronto', 'ON', 'Canada', 'Hybrid', 'Investment Banking',
  'Metals & Mining', 'Analyst', 'Full-time', 'Full-time', '2026-09-30',
  120000, 160000, 'CAD', 'year',
  'https://citi.wd5.myworkdayjobs.com/2/job/Toronto---Canada/Investment-Banking-Analyst---Metals---Mining_26997599-1/apply',
  'https://jobs.citi.com/job/toronto/investment-banking-analyst-metals-and-mining/287/101370856224',
  'Citi public careers site', 'citi:26997599', 'active', true,
  'Toronto-based Investment Banking Analyst role with Citi''s Metals & Mining coverage team, supporting M&A advisory and capital-raising transactions.',
  $citi_description$Citi is hiring an Investment Banking Analyst for its Metals & Mining coverage team in Toronto. The full-time, hybrid role supports client transactions involving mergers and acquisitions, strategic advisory and capital raising.

The Analyst works with senior bankers on live assignments and client proposals, organizes and analyzes financial data, prepares valuation materials and written recommendations, conducts company and industry research, and builds financial models.

Applicants should have one to five years of relevant experience and a bachelor's degree in finance or a closely related business field, or equivalent experience. Citi lists an employer-disclosed annual base salary range of CAD $120,000 to $160,000.$citi_description$,
  'verified', now(),
  'Employer-hosted Citi posting verified active on October 1, 2026. Employer-disclosed salary range recorded in Canadian dollars.',
  now(), now()
)
ON CONFLICT (source_record_id) DO UPDATE SET
  company_id = EXCLUDED.company_id, company_name = EXCLUDED.company_name, title = EXCLUDED.title,
  location_display = EXCLUDED.location_display, city = EXCLUDED.city, province = EXCLUDED.province,
  country = EXCLUDED.country, workplace_type = EXCLUDED.workplace_type, category = EXCLUDED.category,
  specialization = EXCLUDED.specialization, seniority = EXCLUDED.seniority,
  employment_type = EXCLUDED.employment_type, program_type = EXCLUDED.program_type,
  date_posted = EXCLUDED.date_posted, salary_min = EXCLUDED.salary_min, salary_max = EXCLUDED.salary_max,
  salary_currency = EXCLUDED.salary_currency, salary_period = EXCLUDED.salary_period,
  application_url = EXCLUDED.application_url, source_url = EXCLUDED.source_url,
  source_name = EXCLUDED.source_name, status = EXCLUDED.status, featured = true,
  summary = EXCLUDED.summary, description_text = EXCLUDED.description_text,
  description_status = EXCLUDED.description_status, description_verified_at = EXCLUDED.description_verified_at,
  data_quality_notes = EXCLUDED.data_quality_notes, last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

INSERT INTO public.jobs (
  external_job_id, company_id, company_name, title, location_display, city, province, country,
  category, specialization, seniority, employment_type, program_type,
  date_posted, application_deadline, application_url, source_url, source_name,
  source_record_id, status, summary, description_text, description_status,
  description_verified_at, data_quality_notes, last_verified_at, updated_at
)
VALUES (
  'JR100930', 'aimco', 'AIMCo', 'Portfolio Manager/Director, Portfolio Construction',
  'Calgary, AB', 'Calgary', 'AB', 'Canada', 'Asset Management',
  'Public Equities / Portfolio Construction', 'Director', 'Full-time', 'Full-time',
  '2026-09-30', '2026-10-19',
  'https://aimco.wd10.myworkdayjobs.com/AIMCoCareers/job/Calgary/Portfolio-Manager-Director--Portfolio-Construction_JR100930',
  'https://aimco.wd10.myworkdayjobs.com/AIMCoCareers/job/Calgary/Portfolio-Manager-Director--Portfolio-Construction_JR100930',
  'AIMCo public careers site', 'aimco:JR100930', 'active',
  'Calgary-based Portfolio Manager/Director role advancing portfolio construction across AIMCo''s public-equities and absolute-return strategies.',
  $aimco_description$AIMCo is hiring a Portfolio Manager/Director for its Public Equities portfolio-construction team in Calgary. Reporting to the Managing Director, the role translates investment insights, client objectives and risk considerations into portfolio design across index, fundamental, systematic and portable-alpha strategies.

The position develops portfolio-construction frameworks, supports capital-allocation and risk-budgeting decisions, designs and monitors derivatives overlays, performs attribution and scenario analysis, and works with portfolio managers, quantitative researchers, risk teams and external partners.

Applicants should have at least ten years of institutional-investment experience with substantial exposure to public-equities portfolio construction, asset allocation, portfolio strategy, quantitative research or multi-strategy portfolios. Direct portable-alpha experience, quantitative or systematic strategy experience, an advanced quantitative or finance degree, and a CFA or equivalent designation are preferred.$aimco_description$,
  'verified', now(),
  'Employer-hosted AIMCo Workday posting verified active on October 1, 2026. Closing date is October 19, 2026.',
  now(), now()
)
ON CONFLICT (source_record_id) DO UPDATE SET
  company_id = EXCLUDED.company_id, company_name = EXCLUDED.company_name, title = EXCLUDED.title,
  location_display = EXCLUDED.location_display, city = EXCLUDED.city, province = EXCLUDED.province,
  country = EXCLUDED.country, category = EXCLUDED.category, specialization = EXCLUDED.specialization,
  seniority = EXCLUDED.seniority, employment_type = EXCLUDED.employment_type,
  program_type = EXCLUDED.program_type, date_posted = EXCLUDED.date_posted,
  application_deadline = EXCLUDED.application_deadline, application_url = EXCLUDED.application_url,
  source_url = EXCLUDED.source_url, source_name = EXCLUDED.source_name, status = EXCLUDED.status,
  summary = EXCLUDED.summary, description_text = EXCLUDED.description_text,
  description_status = EXCLUDED.description_status, description_verified_at = EXCLUDED.description_verified_at,
  data_quality_notes = EXCLUDED.data_quality_notes, last_verified_at = EXCLUDED.last_verified_at,
  updated_at = now();

UPDATE public.jobs
SET status = 'closed', featured = false, updated_at = now()
WHERE external_job_id = ANY (ARRAY[
  '7059', 'JR100895', 'JR100896', 'JR100893', 'JR100900',
  'JR100908', 'JR100894', 'JR100898', 'JR100892'
]);

UPDATE public.jobs
SET featured = false, updated_at = now()
WHERE external_job_id = 'JR015548';

