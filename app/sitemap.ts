import type { MetadataRoute } from "next";
import { getActiveJobs } from "@/lib/jobs/server";
import { SITE_URL, companyPath, jobPath } from "@/lib/jobs/urls";

export const revalidate = 300;

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const jobs=await getActiveJobs();
  const latest=jobs.reduce((value,job)=>job.updated_at>value?job.updated_at:value,"2026-09-01T00:00:00.000Z");
  const fixed:MetadataRoute.Sitemap=[
    {url:SITE_URL,lastModified:latest,changeFrequency:"weekly",priority:1},
    {url:`${SITE_URL}/jobs`,lastModified:latest,changeFrequency:"daily",priority:.95},
    {url:`${SITE_URL}/companies`,lastModified:latest,changeFrequency:"daily",priority:.75},
    ...["toronto","internships","analyst","associate"].map(segment=>({url:`${SITE_URL}/jobs/investment-banking/${segment}`,lastModified:latest,changeFrequency:"daily" as const,priority:.85})),
  ];
  const companyEntries=Array.from(new Set(jobs.map(job=>job.company_name))).map(company=>{
    const updated=jobs.filter(job=>job.company_name===company).reduce((value,job)=>job.updated_at>value?job.updated_at:value,"2026-09-01T00:00:00.000Z");
    return {url:`${SITE_URL}${companyPath(company)}`,lastModified:updated,changeFrequency:"daily" as const,priority:.7};
  });
  const jobEntries=jobs.map(job=>({url:`${SITE_URL}${jobPath(job)}`,lastModified:job.updated_at,changeFrequency:"daily" as const,priority:.8}));
  return [...fixed,...companyEntries,...jobEntries];
}

