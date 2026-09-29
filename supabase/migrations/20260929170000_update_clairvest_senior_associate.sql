-- Replace the workbook/LinkedIn Clairvest placeholder with the verified employer PDF.
UPDATE public.jobs
SET
  title = 'Private Equity Senior Associate',
  seniority = 'Associate',
  category = 'Private Equity',
  specialization = 'Private Equity',
  application_url = 'https://www.clairvest.com/wp-content/uploads/Website-JD-Senior-Associate.pdf',
  source_url = 'https://www.clairvest.com/wp-content/uploads/Website-JD-Senior-Associate.pdf',
  source_name = 'Clairvest employer job posting',
  summary = 'Toronto-based Private Equity Senior Associate role at Clairvest supporting investment origination, due diligence, transaction execution and portfolio-company value creation.',
  description_text = $description$
Clairvest is hiring a Private Equity Senior Associate for its Toronto investments team. The role supports investment origination, due diligence, structuring, transaction execution and the ongoing management of portfolio companies. Senior Associates work closely with Partners and Managing Directors, participate in portfolio-company board activity and help management teams execute growth, operational-improvement and value-creation plans.

Responsibilities include coordinating investment due diligence and external advisers, supporting management meetings and post-acquisition planning, monitoring portfolio-company financial and operating performance, preparing quarterly investment reporting, supporting tuck-in acquisitions and maintaining relationships with external advisers. The role also contributes to investment sourcing by developing sector theses, building relationships with market participants and managing prospective opportunities.

Clairvest is seeking candidates with at least three to five years of relevant experience in strategy consulting, investment banking, corporate development or entrepreneurial operating roles. Candidates should have strong financial, valuation, analytical and communication skills. An undergraduate degree is required; an MBA, postgraduate education or a professional designation such as the CFA, CA or CPA is considered an asset.

The position is based in person at Clairvest's Yonge and St. Clair office in Toronto.
$description$,
  description_status = 'verified',
  description_verified_at = now(),
  data_quality_notes = 'Title, responsibilities, qualifications and Toronto in-office requirement verified against Clairvest''s employer-hosted Senior Associate PDF. Senior Associate is normalized to Associate under the BSO career-level taxonomy.',
  last_verified_at = now(),
  updated_at = now()
WHERE source_record_id = 'clairvest:workbook-27b07956318c3434ddc5';

