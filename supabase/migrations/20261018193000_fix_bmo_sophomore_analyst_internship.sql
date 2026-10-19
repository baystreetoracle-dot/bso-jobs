-- The BMO Summer 2027 Sophomore Analyst role is a student internship, not a
-- full-time analyst role. Keep its stored seniority aligned with its program.
UPDATE public.jobs
SET
  seniority = 'Intern / Co-op',
  employment_type = 'Internship',
  program_type = 'Internship',
  summary = 'Summer 2027 Investment Banking internship with BMO Capital Markets in Toronto, focused on Infrastructure Debt Capital Markets.',
  data_quality_notes = concat_ws(
    ' ',
    nullif(data_quality_notes, ''),
    'Classified as Intern / Co-op because the employer describes a May-August Sophomore Summer Analyst internship for enrolled undergraduate students.'
  ),
  updated_at = now()
WHERE source_record_id = 'bmo:R260028848';
