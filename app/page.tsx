import JobBoard from "@/components/job-board";
import { getActiveJobs } from "@/lib/jobs/server";

export const revalidate = 300;

export default async function Home() {
  const jobs = await getActiveJobs();
  return <JobBoard mode="home" initialRows={jobs}/>;
}
