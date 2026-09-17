import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JobBoard from "@/components/job-board";
import { getActiveJobs } from "@/lib/jobs/server";
import type { JobLandingContent, JobRow } from "@/lib/jobs/types";

export const revalidate = 300;

type Segment = "toronto" | "internships" | "analyst" | "associate";
type PageDefinition = {
  title: string;
  description: string;
  content: Omit<JobLandingContent, "sections">;
  filter: (job: JobRow) => boolean;
};

const pageDetails:Record<Segment,PageDefinition> = {
  toronto: {
    title:"Investment Banking Jobs in Toronto | BSO Jobs",
    description:"Explore current investment banking jobs and internships in Toronto across Canadian banks, global investment banks and independent advisory firms.",
    content:{eyebrow:"Toronto recruiting",title:"Investment Banking Jobs in Toronto",intro:"Track current investment banking internships, analyst and associate opportunities in Toronto across Canadian banks, global investment banks and independent advisory firms.",asideTitle:"Current Toronto opportunities.",asideCopy:"Active roles physically located in Toronto, drawn from the same verified BSO Jobs inventory.",links:[]},
    filter:job=>job.city?.toLowerCase().split(";").map(city=>city.trim()).includes("toronto")===true||/\btoronto\b/i.test(job.location_display),
  },
  internships: {
    title:"Investment Banking Internships in Canada | BSO Jobs",
    description:"Explore current investment banking internships, summer analyst programs, winter placements and co-op opportunities across Canada.",
    content:{eyebrow:"Student recruiting",title:"Investment Banking Internships in Canada",intro:"Find current investment banking internships, co-op placements and student analyst opportunities across Canada.",asideTitle:"Current student opportunities.",asideCopy:"Listings are included only when the stored program or seniority taxonomy clearly identifies an internship, co-op or student role.",links:[]},
    filter:job=>["intern","student"].includes(job.seniority.toLowerCase())||["internship","co-op"].includes((job.program_type??"").toLowerCase()),
  },
  analyst: {
    title:"Investment Banking Analyst Jobs in Canada | BSO Jobs",
    description:"Explore active investment banking analyst jobs across Canada, including opportunities in Toronto, Calgary, Montreal and Vancouver.",
    content:{eyebrow:"Analyst recruiting",title:"Investment Banking Analyst Jobs in Canada",intro:"Browse current investment banking analyst positions at Canadian banks, global firms and independent advisory platforms.",asideTitle:"Current analyst opportunities.",asideCopy:"These listings use the existing BSO Jobs seniority taxonomy and include only active roles classified as Analyst.",links:[]},
    filter:job=>job.seniority.toLowerCase()==="analyst",
  },
  associate: {
    title:"Investment Banking Associate Jobs in Canada | BSO Jobs",
    description:"Explore active investment banking associate jobs across Canada at banks and independent advisory firms.",
    content:{eyebrow:"Associate recruiting",title:"Investment Banking Associate Jobs in Canada",intro:"Browse current investment banking associate positions across Canada using BSO Jobs' active opportunity database.",asideTitle:"Current associate opportunities.",asideCopy:"These listings use the existing BSO Jobs seniority taxonomy and include only active roles classified as Associate.",links:[]},
    filter:job=>job.seniority.toLowerCase()==="associate",
  },
};

function isSegment(value:string):value is Segment{return value in pageDetails;}

export function generateStaticParams(){return Object.keys(pageDetails).map(segment=>({segment}));}

export async function generateMetadata({params}:{params:Promise<{segment:string}>}):Promise<Metadata>{
  const {segment}=await params;
  if(!isSegment(segment)) return {};
  const page=pageDetails[segment];
  const url=`/jobs/investment-banking/${segment}`;
  return {title:page.title,description:page.description,alternates:{canonical:url},openGraph:{title:page.title,description:page.description,url,type:"website"}};
}

const baseSupporting:Record<Exclude<Segment,"toronto">,JobLandingContent["sections"]>={
  internships:[
    {title:"Canadian Investment Banking Student Recruiting",paragraphs:["This page collects roles that the BSO Jobs data clearly identifies as internships, co-op placements or student opportunities. That includes summer and winter analyst programs when the stored program type or seniority supports the classification. Roles are not added merely because a title sounds junior.","Recruiting terminology varies by firm. A posting may be called an intern, co-op student, summer analyst or student analyst while describing a similar entry point. Review the program label, location and deadline on each listing, then use the employer’s application page for the complete requirements and process details."]},
    {title:"Using the Internship Board",paragraphs:["Opportunities are drawn from the active Canada-wide job inventory and link directly to the employer. BSO Jobs does not infer missing recruiting dates or program structures. If a record does not clearly establish that it is a student or internship opportunity, it remains on the broader job board instead of appearing here.","Application windows can be short, particularly for structured student programs. The deadline displayed is the date stored in BSO Jobs when one is available; listings without a published deadline remain marked open and should be checked on the employer’s site."]},
  ],
  analyst:[
    {title:"Investment Banking Analyst Recruiting in Canada",paragraphs:["This page focuses on active roles classified as Analyst in the BSO Jobs database. It can include positions in mergers and acquisitions, industry coverage and other investment banking groups when the underlying posting establishes that mandate.","Student and internship roles are maintained separately when the data identifies them as such, even if the employer uses analyst language in the title. That distinction keeps this page useful for candidates seeking analyst-level hiring rather than inflating the inventory with every student program."]},
    {title:"Reviewing Analyst Opportunities",paragraphs:["Compare the firm, city, group and employment or program type shown on each listing. Some analyst positions are generalist roles, while others belong to a specific sector or product team. BSO Jobs presents only the factual classification available in the source record and links to the employer for full responsibilities and qualifications.","The inventory updates as active roles are verified and application deadlines pass. For a wider view that includes internships, associates and senior hiring, return to the complete Canada-wide investment banking job board."]},
  ],
  associate:[
    {title:"Investment Banking Associate Recruiting in Canada",paragraphs:["This page collects current positions classified as Associate in the BSO Jobs database. Active openings may span Canadian banks, global investment banks and independent advisory firms, with location and group information shown when the employer provides it.","Associate titles can overlap with senior associate or manager terminology at some firms. BSO Jobs uses the stored seniority classification rather than expanding the page through title assumptions. Corporate finance advisory opportunities remain described according to the firm and role information in the underlying record."]},
    {title:"Reviewing Associate Opportunities",paragraphs:["Use the listing details to compare location, specialization, program type and deadline. Each role links to the original employer application page, which remains the authoritative source for experience requirements, qualifications and the application process.","This inventory is intentionally limited to active Canadian opportunities. When a deadline passes or a role is marked closed, it is removed from the active listings and from the indexable job inventory rather than continuing to appear as an open position."]},
  ],
};

export default async function InvestmentBankingLanding({params}:{params:Promise<{segment:string}>}){
  const {segment}=await params;
  if(!isSegment(segment)) notFound();
  const page=pageDetails[segment];
  const jobs=(await getActiveJobs()).filter(page.filter);
  const firms=Array.from(new Set(jobs.map(job=>job.company_name))).sort();
  const levels=Object.entries(jobs.reduce<Record<string,number>>((counts,job)=>{counts[job.seniority]=(counts[job.seniority]??0)+1;return counts;},{})).sort((a,b)=>b[1]-a[1]);
  const sections=segment==="toronto"?[
    {title:"Investment Banking Opportunities in Toronto",paragraphs:["Toronto is the largest concentration of roles in the current BSO Jobs inventory. This page brings the city’s active investment banking openings into one focused view, covering student programs, analyst and associate recruiting, and experienced hiring when those opportunities are available.","Listings remain connected to the underlying BSO Jobs database, so deadlines, role status and application links follow the same source records used throughout the main job board. A role appears here only when its stored location identifies Toronto; broader Canada-wide or multi-city listings are not forced into the Toronto inventory without that evidence."]},
    {title:"Firms Currently Hiring in Toronto",paragraphs:[firms.length?`The current Toronto inventory includes ${firms.join(", ")}. Firm availability changes as applications open and close, so this list is generated directly from active opportunities rather than maintained as a static directory.`:"There are no active Toronto listings in the current inventory. The page will update as new roles are added."],items:firms.map(firm=>`${firm} — ${jobs.filter(job=>job.company_name===firm).length} active ${jobs.filter(job=>job.company_name===firm).length===1?"role":"roles"}`)},
    {title:"Opportunities by Seniority",paragraphs:["Use the role title, seniority classification and program type together when reviewing a posting. Student and co-op opportunities may use analyst language in their titles, while full-time analyst and associate positions follow a different recruiting path."],items:levels.map(([level,count])=>`${level} — ${count} ${count===1?"opportunity":"opportunities"}`)},
  ]:baseSupporting[segment];
  const links=[
    {href:"/jobs",label:"Browse all Investment Banking Jobs in Canada"},
    {href:"/jobs/investment-banking/toronto",label:"Investment Banking Jobs in Toronto"},
    {href:"/jobs/investment-banking/internships",label:"Investment Banking Internships in Canada"},
    {href:"/jobs/investment-banking/analyst",label:"Investment Banking Analyst Jobs in Canada"},
    {href:"/jobs/investment-banking/associate",label:"Investment Banking Associate Jobs in Canada"},
  ].filter(link=>!link.href.endsWith(`/${segment}`));
  return <JobBoard mode="landing" initialRows={jobs} landing={{...page.content,sections,links}}/>;
}
