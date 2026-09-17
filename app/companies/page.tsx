import type { Metadata } from "next";
import JobBoard from "@/components/job-board";
import { getActiveJobs } from "@/lib/jobs/server";

export const revalidate = 300;

export const metadata:Metadata = {
  title: "Investment Banking Firms Hiring in Canada | BSO Jobs",
  description: "Explore Canadian banks, global investment banks and independent advisory firms with active investment banking opportunities in Canada.",
  alternates: { canonical: "/companies" },
  openGraph: {
    title: "Investment Banking Firms Hiring in Canada | BSO Jobs",
    description: "Explore firms with active investment banking opportunities across Canada.",
    url: "/companies",
    type: "website",
  },
};

export default async function CompaniesPage() {
  const jobs=await getActiveJobs();
  return <JobBoard mode="companies" initialRows={jobs}/>;
}
