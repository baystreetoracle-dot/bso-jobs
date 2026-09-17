import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JobBoard from "@/components/job-board";
import { getActiveJobs } from "@/lib/jobs/server";
import { companyPath, slugify } from "@/lib/jobs/urls";

export const revalidate = 300;

async function companyJobs(slug:string){
  const jobs=await getActiveJobs();
  return jobs.filter(job=>slugify(job.company_name)===slug);
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const jobs=await companyJobs(slug);
  if(!jobs.length) return {};
  const company=jobs[0].company_name;
  const title=`${company} Jobs & Careers in Canada | BSO Jobs`;
  const description=`Explore current ${company} investment banking jobs and recruiting opportunities in Canada.`;
  const url=companyPath(company);
  return {title,description,alternates:{canonical:url},openGraph:{title,description,url,type:"website"}};
}

export default async function CompanyPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const jobs=await companyJobs(slug);
  if(!jobs.length) notFound();
  const company=jobs[0].company_name;
  const cities=Array.from(new Set(jobs.flatMap(job=>(job.city??"").split(";").map(city=>city.trim()).filter(Boolean)))).sort();
  const levels=Array.from(new Set(jobs.map(job=>job.seniority))).sort();
  return <JobBoard mode="company" initialRows={jobs} landing={{
    eyebrow:"Firm opportunities",
    title:`${company} Jobs in Canada`,
    intro:`View active ${company} investment banking opportunities currently tracked by BSO Jobs.`,
    asideTitle:`Current roles at ${company}.`,
    asideCopy:"Every listing links to the employer’s application page and is removed from the active inventory when it closes.",
    sections:[
      {title:`${company} Opportunities`,paragraphs:[`BSO Jobs currently tracks ${jobs.length} active ${jobs.length===1?"opportunity":"opportunities"} at ${company} in Canada. This page is generated from the same active database used by the main job board, so it does not maintain a separate or duplicated list.`]},
      {title:"Current hiring coverage",paragraphs:[cities.length?`Current locations represented in the inventory: ${cities.join(", ")}. Career levels currently represented: ${levels.join(", ")}.`:"Location details are shown on each active listing when supplied by the employer."]},
    ],
    links:[
      {href:"/jobs",label:"Browse all Investment Banking Jobs in Canada"},
      {href:"/companies",label:"Explore all firms currently hiring"},
      {href:"/jobs/investment-banking/toronto",label:"Investment Banking Jobs in Toronto"},
    ],
  }}/>;
}

