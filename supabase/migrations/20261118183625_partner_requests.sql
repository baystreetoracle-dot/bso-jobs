create table public.partner_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  package text not null check (package in ('In-feed post','In-feed + Story','Campaign','Custom')),
  payment text not null check (payment in ('Paid online by card','Send an invoice','We''ll need a PO or vendor onboarding')),
  name text not null check (char_length(name) between 1 and 200),
  firm text not null check (char_length(firm) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320 and email like '%_@_%'),
  preferred_date date,
  objective text check (objective is null or char_length(objective) <= 4000),
  links text check (links is null or char_length(links) <= 1000),
  billing_contact text check (billing_contact is null or char_length(billing_contact) <= 500),
  source text not null default 'partners.baystreetoracle.ca' check (char_length(source) <= 100),
  status text not null default 'new' check (status in ('new','contacted','invoiced','paid','scheduled','live','completed','cancelled'))
);
comment on table public.partner_requests is 'Sponsorship briefs and invoice requests submitted from partners.baystreetoracle.ca.';
alter table public.partner_requests enable row level security;
revoke all on public.partner_requests from anon, authenticated;
grant insert (package, payment, name, firm, email, preferred_date, objective, links, billing_contact) on public.partner_requests to anon;
create policy "Visitors can submit a new request" on public.partner_requests
  for insert to anon with check (status = 'new');
;
