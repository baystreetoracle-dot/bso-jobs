CREATE TABLE "public"."companies" (
  "company_id"           text                     NOT NULL,
  "name"                 text                     NOT NULL,
  "parent_company"       text,
  "company_type"         text,
  "website_domain"       text,
  "headquarters_country" text,
  "status"               text                     NOT NULL DEFAULT 'active'::text,
  "notes"                text,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"           timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "companies_name_key" UNIQUE (name),
  CONSTRAINT "companies_pkey" PRIMARY KEY (company_id),
  CONSTRAINT "companies_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);

ALTER TABLE "public"."companies"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."jobs" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "external_job_id"      text                     NOT NULL,
  "company_id"           text                     NOT NULL,
  "company_name"         text                     NOT NULL,
  "title"                text                     NOT NULL,
  "location_display"     text                     NOT NULL,
  "city"                 text,
  "province"             text,
  "country"              text                     NOT NULL,
  "workplace_type"       text,
  "category"             text                     NOT NULL,
  "specialization"       text,
  "seniority"            text                     NOT NULL,
  "employment_type"      text,
  "program_type"         text,
  "term_start"           date,
  "term_end"             date,
  "term_length_months"   integer,
  "date_posted"          date,
  "application_deadline" date,
  "salary_min"           numeric,
  "salary_max"           numeric,
  "salary_currency"      text,
  "salary_period"        text,
  "application_url"      text                     NOT NULL,
  "source_url"           text                     NOT NULL,
  "source_name"          text                     NOT NULL,
  "status"               text                     NOT NULL DEFAULT 'active'::text,
  "featured"             boolean                  NOT NULL DEFAULT false,
  "summary"              text,
  "source_record_id"     text                     NOT NULL,
  "data_quality_notes"   text,
  "last_verified_at"     timestamp with time zone,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"           timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "jobs_check" CHECK (((salary_min IS NULL) OR (salary_max IS NULL) OR (salary_max >= salary_min))),
  CONSTRAINT "jobs_company_id_external_job_id_key" UNIQUE (company_id, external_job_id),
  CONSTRAINT "jobs_pkey" PRIMARY KEY (id),
  CONSTRAINT "jobs_salary_max_check" CHECK (((salary_max IS NULL) OR (salary_max >= (0)::numeric))),
  CONSTRAINT "jobs_salary_min_check" CHECK (((salary_min IS NULL) OR (salary_min >= (0)::numeric))),
  CONSTRAINT "jobs_source_record_id_key" UNIQUE (source_record_id),
  CONSTRAINT "jobs_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'closed'::text, 'draft'::text]))),
  CONSTRAINT "jobs_term_length_months_check" CHECK (((term_length_months IS NULL) OR (term_length_months > 0))),
  CONSTRAINT "jobs_workplace_type_check" CHECK (((workplace_type IS NULL) OR (workplace_type = ANY (ARRAY['On-site'::text, 'Hybrid'::text, 'Remote'::text]))))
);

ALTER TABLE "public"."jobs"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."jobs"
  ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(company_id) ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE INDEX jobs_application_deadline_idx ON public.jobs USING btree (application_deadline);

CREATE INDEX jobs_category_idx ON public.jobs USING btree (category);

CREATE INDEX jobs_city_idx ON public.jobs USING btree (city);

CREATE INDEX jobs_company_id_idx ON public.jobs USING btree (company_id);

CREATE INDEX jobs_featured_idx ON public.jobs USING btree (featured)
  WHERE (featured = true);

CREATE INDEX jobs_status_idx ON public.jobs USING btree (status);

CREATE POLICY "Public can read active companies" ON "public"."companies"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((status = 'active'::text));

CREATE POLICY "Public can read active jobs" ON "public"."jobs"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((status = 'active'::text));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."companies" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."jobs" TO "anon", "authenticated", "postgres", "service_role";
