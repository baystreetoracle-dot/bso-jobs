import type { JobRow } from "./types";

export const SITE_URL = "https://www.baystreetoracle.ca";

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/-{2,}/g, "-");
}

export function jobPath(job: Pick<JobRow, "id" | "company_name" | "title" | "city" | "location_display">): string {
  const readable = slugify(`${job.company_name} ${job.title} ${job.city ?? job.location_display}`);
  return `/jobs/${readable}--${job.id}`;
}

export function jobIdFromSlug(slug: string): string | null {
  const match = slug.match(/--([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i);
  return match?.[1] ?? null;
}

export function companyPath(companyName: string): string {
  return `/companies/${slugify(companyName)}`;
}

