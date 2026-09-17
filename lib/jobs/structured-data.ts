import type { JobRow } from "./types";
import { SITE_URL, companyPath, jobPath } from "./urls";

function employmentType(value: string | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized.includes("full")) return "FULL_TIME";
  if (normalized.includes("part")) return "PART_TIME";
  if (normalized.includes("contract")) return "CONTRACTOR";
  if (normalized.includes("intern")) return "INTERN";
  return undefined;
}

function descriptionHtml(value: string): string {
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Google markup is emitted only for a source-verified, complete description. */
export function jobPostingJsonLd(job: JobRow): Record<string, unknown> | null {
  if (!job.date_posted || job.description_status !== "verified" || !job.description_text || job.description_text.length < 500) return null;

  const salary = job.salary_min !== null && job.salary_currency
    ? {
        "@type": "MonetaryAmount",
        currency: job.salary_currency,
        value: {
          "@type": "QuantitativeValue",
          minValue: job.salary_min,
          ...(job.salary_max !== null ? { maxValue: job.salary_max } : {}),
          ...(job.salary_period ? { unitText: job.salary_period.toUpperCase() } : {}),
        },
      }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: descriptionHtml(job.description_text),
    datePosted: job.date_posted,
    ...(job.application_deadline ? { validThrough: `${job.application_deadline}T23:59:59-04:00` } : {}),
    ...(employmentType(job.employment_type) ? { employmentType: employmentType(job.employment_type) } : {}),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company_name,
      url: `${SITE_URL}${companyPath(job.company_name)}`,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(job.city ? { addressLocality: job.city } : {}),
        ...(job.province ? { addressRegion: job.province } : {}),
        addressCountry: "CA",
      },
    },
    ...(salary ? { baseSalary: salary } : {}),
    directApply: false,
    url: `${SITE_URL}${jobPath(job)}`,
    identifier: {
      "@type": "PropertyValue",
      name: job.company_name,
      value: job.external_job_id,
    },
  };
}
