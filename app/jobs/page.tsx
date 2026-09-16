import JobBoard from "@/components/job-board";

export default async function JobsPage({searchParams}:{searchParams:Promise<{company?:string}>}) {
  const {company}=await searchParams;
  return <JobBoard mode="jobs" initialCompany={company}/>;
}
