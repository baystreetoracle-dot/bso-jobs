# BSO Jobs Collector Algorithm and Operating Rules

The owner's rules for the job collector, saved verbatim (Nov 16, 2026). The collector lives under
`scripts/job-collector`. Do not replace it. Inspect and extend the existing adapters, source registry,
normalization, reconciliation and reporting modules.

> **Owner update, Nov 16, 2026 (supersedes the approval wording in sections 1, 16, 17 and 19 where they
> conflict):** the owner wants the jobs platform to run by itself without approvals. The collector itself
> stays dry-run-only exactly as written below; a separate, tightly limited apply step may publish the
> near-certain buckets automatically (see `docs/agents/jobs.md` once written). Everything uncertain still
> goes to review.
>
> **Owner feedback on relevance, Nov 16, 2026:** the filter let through roles that are M&A-adjacent but
> operational, e.g. BMO "Senior Manager, T&O M&A, Strategic Initiatives" (Technology & Operations
> integration / strategic-initiatives work, not investment banking), and fundraising roles. Tighten the
> gates so these are rejected: "M&A" alone in a title is not Investment Banking evidence when the team is
> T&O, technology, operations, integration, strategy, PMO, transformation or corporate development
> support; fundraising, capital formation, investor relations and distribution are always excluded.
>
> **Owner feedback, Nov 16, 2026 (second):** HOOPP "Investment Data Governance Analyst" should never have been
> on the board. "Investment" in a title is not evidence of an investing seat: investment data, data governance,
> data management, investment operations, accounting, reporting and analytics roles inside an investment team
> are excluded, however the team is named.

## 1. Safety model

The collector must remain dry-run-only by default. The normal command is:

```
npm run jobs:dry
```

The collector itself must:

- reject execution without `--dry-run`
- reject `--write`, `--apply`, `--publish` and `--deploy`
- read Supabase only
- never alter jobs, companies or statuses
- never close or reopen a job automatically
- write reports only under `scripts/job-collector/reports`

A production migration may only be prepared after Thomas explicitly reviews and approves the dry-run results.
Do not apply that migration or push production changes without explicit approval.

## 2. Source priority

Use firms' public employer infrastructure only. Preference order:

1. Public ATS or structured JSON endpoint
2. Structured endpoint used by the employer's careers site
3. Server-rendered employer job pages
4. Employer-hosted HTML scraping
5. Manually supplied employer posting or PDF

Never use LinkedIn, Indeed or another aggregator as the primary source when an employer page exists.

Existing reusable adapters include: Workday, Phenom, Eightfold, Jibe, Tal.net, Goldman Sachs structured adapter,
official HTML, static employer careers pages, custom RBC integration. Reuse an existing adapter before creating a
firm-specific scraper.

Run sources with limited concurrency (currently four sources at a time) and allow the full scan to continue when
an individual source fails.

## 3. Candidate collection

For every configured firm:

1. Fetch every available job from the authoritative source.
2. Complete pagination.
3. Fetch structured job details where available.
4. Preserve: employer requisition ID, title, location, description, ATS metadata, employment type, posting date,
   deadline, application URL, canonical source URL.
5. Record source success, failure, endpoint and raw-job count.

A source is not considered complete when: a page or API request fails; pagination is incomplete; detail
extraction fails materially; zero records are returned unexpectedly; parsing produces unreliable identities.

## 4. Geographic gate

Only accept jobs physically located in Canada. Use structured location data whenever possible. Do not accept a
role simply because Canada appears somewhere in the description.

Normalize common locations: Toronto, ON; Calgary, AB; Vancouver, BC; Montreal, QC; Edmonton, AB; Victoria, BC;
Winnipeg, MB. Multi-location Canadian jobs may contain multiple locations separated by `/`. Reject jobs with no
confirmed Canadian work location as `nonCanadian`.

## 5. Career-path taxonomy

Use only these public-facing career paths: Investment Banking, Corporate Finance, Private Equity, Private Credit,
Hedge Fund, Asset Management.

Do not publish: Institutional Investing, Real Estate Investing.

Normalize pension-fund, public-market, infrastructure, fixed-income and real-estate investment roles into
`Asset Management` unless they clearly qualify as Private Equity, Private Credit or Hedge Fund. Real-estate
direct-investment roles remain under `Asset Management`, with `specialization = "Real Estate"`.

Roles at Deloitte Corporate Finance, KPMG Corporate Finance, EY-Parthenon Corporate Finance, BDO M&A & Capital
Markets and comparable accounting-firm advisory arms should generally use `Corporate Finance`, not Investment
Banking.

This taxonomy supersedes any stale `Institutional Investing` or `Real Estate Investing` labels still present in
older collector source configuration.

## 6. Investment Banking relevance gate

An Investment Banking role requires strong role-specific evidence from one or more of: title; team or department
metadata; ATS platform or cost-centre metadata; description; dedicated pure-play Investment Banking firm mandate.

Strong evidence includes: Investment Banking; Global Investment Banking; Mergers & Acquisitions / M&A; Financial
Sponsors; Leveraged Finance; Syndicated and Leveraged Finance; Equity Capital Markets; Debt Capital Markets;
Restructuring; Infrastructure or Project Finance Advisory; Real Estate Investment Banking; an explicit
investment-banking coverage or product group.

Do not assume every role inside Capital Markets, Global Banking & Markets or Corporate & Investment Banking is
Investment Banking.

Corporate Finance roles require a Corporate Finance, M&A or Deal Advisory title plus actual transaction,
acquisition, divestiture, capital-raising or advisory context.

Pure-play advisory boutiques may qualify conventional banking titles such as Analyst, Associate, Vice President
or Director when the firm's business is clearly dedicated to Investment Banking.

## 7. Buy-side relevance gate

A buy-side role needs evidence of both (1) a recognized investment strategy and (2) direct investment
responsibility.

Recognized strategies: Private Equity; Private Credit or Direct Lending; Public Equities; Fixed Income or Public
Credit; Infrastructure; Natural Resources; Real Estate investments; long/short, event-driven or hedge-fund
strategies; manager selection or external portfolios; asset allocation or total-fund management.

Direct-investment evidence: sourcing investments; underwriting; due diligence; investment recommendations;
investment-committee work; financial modelling or valuation; transaction execution; security selection;
portfolio construction; asset allocation; investment thesis development; fundamental research tied to investment
decisions; acquisition or disposition analysis; direct portfolio management.

An investment-related employer or title alone is insufficient.

## 8. Exclusions

Reject roles dominated by: Corporate Banking; Commercial Banking; Sales and Trading; Equity or Credit Research
without portfolio responsibility; Wealth Management; Risk; Compliance; Audit; Legal; Technology; Software or
Engineering; Data Engineering; investment data, data governance or data management (including inside an
investment team); Operations; middle office or back office; Settlements; administrative support; CRM
or client support; investor relations; fundraising or distribution; Marketing; Human Resources; fund accounting;
financial reporting; Treasury; performance reporting; portfolio analytics without investment authority; ESG
without direct investment responsibility; CPA recruitment programs.

If a role appears investment-adjacent but does not establish direct investing or advisory responsibility, place
it in manual review rather than automatically qualifying it.

## 9. Seniority normalization

Normalize seniority using the title first, then explicit description language, required experience and program
type. Allowed values: Intern / Co-op; Analyst; Associate; Vice President; Director; Managing Director;
Executive / Group Head; Unspecified.

Rules: student, intern, internship and co-op roles → Intern / Co-op. Analyst, senior analyst and new-graduate
analyst → Analyst. Associate and senior associate → Associate. Vice President or VP → Vice President. Director or
Executive Director → Director. Managing Director → Managing Director. Group Head, Global Head, Co-Head or
equivalent → Executive / Group Head.

When the title does not identify seniority: 10+ years required → usually Director; 6–9 years → usually Vice
President; 3–5 years → usually Associate; fewer than 3 years → usually Analyst.

If evidence remains unclear, use `Unspecified` and add a manual-review quality note. Do not reject an otherwise
qualified role solely because seniority is unclear.

## 10. Program type

Keep program type separate from seniority. Normalize into: Internship; Co-op; New Graduate Program; Full-time;
Contract; Unspecified. Do not infer a program type without reasonable evidence.

## 11. Specialization

When supported, populate specializations such as: Mergers & Acquisitions; Diversified Industries; Financial
Sponsors; Leveraged Finance; Equity Capital Markets; Debt Capital Markets; Restructuring; Infrastructure /
Project Finance; Mining & Metals; Real Estate; Private Equity; Private Credit; Public Equities; Public Credit /
Fixed Income; Infrastructure; Natural Resources; External Managers. Do not fabricate a
specialization.

## 12. Job identity and deduplication

Prefer the employer's stable requisition or ATS job ID. Set:

```
external_job_id = stable employer requisition ID
source_record_id = <canonical-source-key>:<external_job_id>
```

If no stable employer ID exists, derive a deterministic ID from the canonical employer URL. Never use only title
and location as the primary identity.

Canonicalize URLs by removing: `utm_*`, `source`, `src`, `gh_src`, `feedId`, campaign parameters, fragments,
unnecessary locale prefixes, trailing slashes.

Match existing jobs in this order: (1) `company_id + external_job_id`; (2) `source_record_id`; (3) canonical
source URL; (4) canonical application URL; (5) normalized company + title + location composite.

Within one scan, suppress duplicates using: (1) company + external ID; (2) canonical source URL; (3) normalized
company + title + location.

Prefer an official employer record over a workbook version of the same job. Never create a second company row
when an existing normalized company already exists.

## 13. Normalized job fields

Qualified jobs should populate: `external_job_id`, `company_id`, `company_name`, `title`, `location_display`,
`city`, `province`, `country`, `workplace_type`, `category`, `specialization`, `seniority`, `employment_type`,
`program_type`, `term_start`, `term_end`, `term_length_months`, `date_posted`, `application_deadline`,
`salary_min`, `salary_max`, `salary_currency`, `salary_period`, `application_url`, `source_url`, `source_name`,
`summary`, `description_text`, `description_status`, `source_record_id`, `data_quality_notes`, `status`,
`last_verified_at`, `updated_at`.

Newly observed live jobs should propose `status = "active"`. Do not alter `featured`; it is editorially
controlled.

## 14. Description and compensation

The BSO summary should be concise and objective: firm; role level; career path; team or specialization;
location; program or term where relevant; unusual eligibility requirement; stated salary when available. Avoid
repetitive duty lists. Preserve a factual employer-description field sufficient to support job-detail pages and
structured data.

Extract salary only when it is explicitly stated by the employer. Preserve minimum, maximum, currency, period.
Convert a clearly stated biweekly amount to annual only when the conversion is unambiguous. Never estimate
compensation.

## 15. Reconciliation

Compare every qualified job with the Supabase read-only snapshot. Classify it as: New; Proposed metadata update;
Unchanged; Reopening review; Proposed closure; Manual review; Duplicate suppressed.

Show field-level diffs for proposed updates:

```
CURRENT VALUE → PROPOSED VALUE
```

A job already marked closed must never be automatically reopened. Send it to reopening review.

## 16. Safe stale-job handling

Only propose a closure when all conditions are true:

1. The existing job is active.
2. It belongs to the firm scanned.
3. The entire authoritative structured source completed successfully.
4. Pagination and detail extraction were complete.
5. The source returned a non-zero, credible result set.
6. The existing job was not observed by requisition ID, source record, canonical URL or normalized composite.
7. The record is not manual, employer-supplied, curated or BSO Exclusive.

Manual, employer-supplied and BSO Exclusive records must never be automatically closed. HTML/static-page scans
should not automatically establish closure authority unless their completeness is proven. If any source request,
pagination step or parsing stage is incomplete, propose no closures for that source. Closure proposals are
review items only. Never apply them automatically.

## 17. Dry-run reporting

Every full run must generate Markdown and JSON reports containing: source health for every firm; sources reached
and failed; raw jobs scanned; Canadian jobs; qualified jobs; new jobs; proposed updates; unchanged jobs; proposed
closures; reopening reviews; manual-review jobs; duplicates suppressed; rejection counts; representative rejected
examples; source and parsing errors.

Rejection buckets: nonCanadian; notInvestmentBanking; corporateBanking; markets; research; riskCompliance;
technologyData; operationsSupport; accountingFinance; clientCommercial; esg; notFrontOfficeInvestment; ambiguous;
duplicate; parsingSourceError.

For qualified roles, print: company; title; location; category; specialization; seniority; program type;
employer requisition ID; application URL; qualification reason; confidence; manual-review flags.

## 18. Ranking algorithm

Ranking is separate from collection and must never determine whether a job qualifies.

Current maximum component weights: firm/platform strength 28; career-path relevance 24; role scarcity 18; BSO
audience/seniority fit 12; freshness 10; BSO Exclusive or direct-employer signal 6; Canadian location relevance 2.

Freshness: posted within 2 days 10; within 7 days 7; within 14 days 4; within 30 days 2; older 0; missing date 2.

Audience fit prioritizes Intern / Co-op, Analyst, Associate. Higher-ranked firms receive stronger firm scores,
but freshness, scarcity, career path and exclusivity must still influence the result.

To prevent a monotonous board:

1. Group jobs into five-point score bands.
2. Preserve higher bands ahead of lower bands.
3. Within a band, penalize repeated career paths appearing too frequently in the most recent eight positions.
4. Use a deterministic daily hash for rotation and tie-breaking.
5. Never use true randomness that causes the order to change on every page load.

Exclude expired deadlines from ranking.

## 19. Commands

```
npm run jobs:dry
npm run jobs:ib:dry
npm run jobs:buyside:dry
npm run jobs:rbc:dry
npm run jobs:td:dry
npm run jobs:goldman:dry
npm run jobs:canadian-independent:dry
npm run jobs:ranking:dry
```

After each dry run, stop and present the results for review. Do not generate or apply a production migration
until Thomas explicitly approves the selected additions, updates, reopenings and closures.
