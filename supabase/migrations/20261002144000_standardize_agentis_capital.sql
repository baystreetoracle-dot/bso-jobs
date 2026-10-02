-- Consolidate legacy Agentis naming under the canonical company record.
UPDATE public.jobs
SET
  company_id = 'agentis',
  company_name = 'Agentis Capital',
  updated_at = now()
WHERE company_id = 'agentis-capital-advisors'
   OR company_name = 'Agentis Capital Advisors';

-- The Fall Analyst posting is an internship, not a full-time Analyst role.
UPDATE public.jobs
SET
  seniority = 'Intern',
  program_type = 'Internship',
  updated_at = now()
WHERE company_id = 'agentis'
  AND external_job_id = 'url-8dcfcd849b5f0e12cb84';

DELETE FROM public.companies
WHERE company_id = 'agentis-capital-advisors';

UPDATE public.companies
SET
  name = 'Agentis Capital',
  parent_company = NULL,
  company_type = 'Investment Bank / Advisory',
  website_domain = 'agentiscapital.com',
  updated_at = now()
WHERE company_id = 'agentis';
