export type JobRow = {
  id: string;
  external_job_id: string;
  company_id: string;
  company_name: string;
  title: string;
  location_display: string;
  city: string | null;
  province: string | null;
  country: string;
  workplace_type: string | null;
  category: string;
  specialization: string | null;
  seniority: string;
  employment_type: string | null;
  program_type: string | null;
  term_start: string | null;
  term_end: string | null;
  term_length_months: number | null;
  date_posted: string | null;
  application_deadline: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: string | null;
  application_url: string;
  source_url: string;
  source_name: string;
  status: "active" | "closed" | "draft";
  featured: boolean;
  summary: string | null;
  source_record_id: string;
  data_quality_notes: string | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JobLandingSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

export type JobLandingContent = {
  eyebrow: string;
  title: string;
  intro: string;
  asideTitle: string;
  asideCopy: string;
  sections: JobLandingSection[];
  links: Array<{ href: string; label: string }>;
};

