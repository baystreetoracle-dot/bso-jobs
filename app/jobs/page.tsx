import type { Metadata } from "next";
import JobBoard from "@/components/job-board";
import { getActiveJobs } from "@/lib/jobs/server";

export const revalidate = 300;

const title = "Canadian Capital Markets Opportunities | BSO Jobs";
const description = "Explore curated Canadian capital-markets opportunities across investment banking, corporate finance, private equity, private credit, asset management and hedge funds.";

// Static (no searchParams), so the board is served from Vercel's cache and refreshed every five minutes.
// Filtered addresses (?company=) carry the canonical /jobs, so search engines still index one page.
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/jobs" },
  openGraph: { title, description, url: "/jobs", type: "website" },
};

export default async function JobsPage() {
  const jobs=await getActiveJobs();
  return <JobBoard mode="jobs" initialRows={jobs}/>;
}
