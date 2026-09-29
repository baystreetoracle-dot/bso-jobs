import type { Metadata } from "next";
import JobBoard from "@/components/job-board";
import { getActiveJobs } from "@/lib/jobs/server";

export const revalidate = 300;

export const metadata:Metadata = {
  title: "Finance Firms Hiring in Canada | BSO Jobs",
  description: "Explore firms with active opportunities across Canadian investment banking, corporate finance, private equity, private credit, asset management and hedge funds.",
  alternates: { canonical: "/companies" },
  openGraph: {
    title: "Finance Firms Hiring in Canada | BSO Jobs",
    description: "Explore firms with active investing and advisory opportunities across Canada.",
    url: "/companies",
    type: "website",
  },
};

export default async function CompaniesPage() {
  const jobs=await getActiveJobs();
  return <JobBoard mode="companies" initialRows={jobs}/>;
}
