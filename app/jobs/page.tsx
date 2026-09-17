import type { Metadata } from "next";
import JobBoard from "@/components/job-board";
import { getActiveJobs } from "@/lib/jobs/server";

export const revalidate = 300;

const title = "Investment Banking Jobs in Canada | BSO Jobs";
const description = "Explore current investment banking jobs and internships across Canada. Find analyst, associate and student opportunities in Toronto, Calgary, Montreal and Vancouver.";

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
