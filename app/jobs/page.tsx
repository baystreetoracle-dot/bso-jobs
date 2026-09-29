import type { Metadata } from "next";
import JobBoard from "@/components/job-board";
import { getActiveJobs } from "@/lib/jobs/server";

export const revalidate = 300;

const title = "Finance Jobs in Canada | BSO Jobs";
const description = "Explore current Canadian opportunities across investment banking, corporate finance, private equity, private credit, asset management and hedge funds.";

export async function generateMetadata({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}):Promise<Metadata> {
  const params = await searchParams;
  const filtered = Object.keys(params).length > 0;
  return {
    title,
    description,
    alternates: { canonical: "/jobs" },
    openGraph: { title, description, url: "/jobs", type: "website" },
    robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function JobsPage({searchParams}:{searchParams:Promise<{company?:string}>}) {
  const {company}=await searchParams;
  const jobs=await getActiveJobs();
  return <JobBoard mode="jobs" initialCompany={company} initialRows={jobs}/>;
}
