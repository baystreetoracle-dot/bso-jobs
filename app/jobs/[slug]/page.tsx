import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import JobBoard from "@/components/job-board";
import { getActiveJobById } from "@/lib/jobs/server";
import { jobPostingJsonLd } from "@/lib/jobs/structured-data";
import { jobIdFromSlug, jobPath } from "@/lib/jobs/urls";

export const revalidate = 300;

async function jobFromSlug(slug:string){
  const id=jobIdFromSlug(slug);
  return id?getActiveJobById(id):null;
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const job=await jobFromSlug(slug);
  if(!job) return {title:"Job no longer available | BSO Jobs",robots:{index:false,follow:true}};
  const canonical=jobPath(job);
  const location=job.city??job.location_display;
  const title=`${job.title} – ${location} | BSO Jobs`;
  const description=job.summary??`${job.title} at ${job.company_name} in ${job.location_display}. View role details and apply on the employer’s website.`;
  return {title,description,alternates:{canonical},openGraph:{title,description,url:canonical,type:"website"}};
}

export default async function JobPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const job=await jobFromSlug(slug);
  if(!job) notFound();
  const canonical=jobPath(job);
  if(`/jobs/${slug}`!==canonical) permanentRedirect(canonical);
  const jsonLd=jobPostingJsonLd(job);
  return <>
    {jsonLd&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/>}
    <JobBoard mode="detail" initialRows={[job]}/>
  </>;
}

