"use client";

import { ArrowRight, ArrowUpRight, BriefcaseBusiness, ChevronDown, CircleDollarSign, Clock3, Mail, MapPin, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, Fragment, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JobAlertInline, JobAlertJobPageCta, JobAlertModal, trackJobAlert, type AlertPreferences, type AlertSource, type AlertStep } from "@/components/job-alerts";
import { rankJobs } from "@/lib/jobs/ranking";
import type { JobLandingContent, JobRow } from "@/lib/jobs/types";
import { companyPath, jobPath } from "@/lib/jobs/urls";

type RecruitingUpdate = { label:string; note:string };
type Job = { id:string; externalJobId:string; companyId:string; company:string; title:string; location:string; city:string|null; province:string|null; category:string; seniority:string; storedSeniority:string; program:string; employmentType:string|null; workplaceType:string|null; specialization:string|null; datePosted:string|null; deadline:string|null; salaryMin:number|null; salaryMax:number|null; salaryCurrency:string|null; salaryPeriod:string|null; url:string; detailPath:string; summary:string; descriptionText:string; descriptionStatus:JobRow["description_status"]; recruitingUpdate:RecruitingUpdate|null; exclusive:boolean };
type LoadedJob = { id:string; externalJobId:string; featured:boolean; job:Job };
type BoardMode = "home"|"jobs"|"companies"|"landing"|"company"|"detail";

const companyLogos: Record<string,string> = {
  "AIMCo":"/company-logos/bso-supplied/aimco.webp",
  "Agentis Capital":"/company-logos/bso-supplied/agentis-capital.webp",
  "Agentis Capital Advisors":"/company-logos/bso-supplied/agentis-capital.webp",
  "Alvarez & Marsal":"/company-logos/bso-supplied/alvarez-marsal.webp",
  "Anson Funds":"/company-logos/bso-supplied/anson-funds.webp",
  "ATB Capital Markets":"/company-logos/bso-supplied/atb-capital-markets.webp",
  "ATB Cormark Capital Markets":"/company-logos/bso-supplied/atb-capital-markets.webp",
  "Baker Tilly Canada Capital":"/company-logos/bso-supplied/baker-tilly-canada.webp",
  "Bank of America":"/company-logos/bso-supplied/bank-of-america.webp",
  "Barclays":"/company-logos/bso-supplied/barclays-bank.webp",
  "BCI":"/company-logos/bso-supplied/bci.webp",
  "BDO Canada":"/company-logos/bso-supplied/bdo.webp",
  "BDO M&A & Capital Markets":"/company-logos/bso-supplied/bdo.webp",
  "Bloom Burton":"/company-logos/bso-supplied/bloom-burton-co.webp",
  "BMO Capital Markets":"/company-logos/bso-supplied/bmo-capital-markets.webp",
  "BNP Paribas":"/company-logos/bso-supplied/bnp-paribas.webp",
  "Canaccord Genuity":"/company-logos/bso-supplied/canaccord-financial.webp",
  "Cantor Fitzgerald":"/company-logos/bso-supplied/cantor-fitzgerald.webp",
  "Brookfield Asset Management":"/company-logos/bso-supplied/brookfield-asset-management.webp",
  "CIBC Capital Markets":"/company-logos/bso-supplied/cibc-capital-markets.webp",
  "CI Financial":"/company-logos/bso-supplied/ci-financial.webp",
  "Canada Infrastructure Bank":"/company-logos/bso-supplied/canada-infrastructure-bank.webp",
  "Choice Properties REIT":"/company-logos/bso-supplied/choice-properties-reit.webp",
  "Clairvest":"/company-logos/bso-supplied/clairvest.webp",
  "Citi":"/company-logos/bso-supplied/citi.webp",
  "Crédit Agricole":"/company-logos/bso-supplied/credit-agricole-cib.webp",
  "Crédit Agricole CIB":"/company-logos/bso-supplied/credit-agricole-cib.webp",
  "Deloitte Corporate Finance":"/company-logos/bso-supplied/deloitte.webp",
  "Desjardins Capital Markets":"/company-logos/bso-supplied/desjardins.webp",
  "Evercore":"/company-logos/bso-supplied/evercore-inc.webp",
  "EY Corporate Finance":"/company-logos/bso-supplied/ey-parthenon.webp",
  "EY-Parthenon Corporate Finance":"/company-logos/bso-supplied/ey-parthenon.webp",
  "Fort Capital":"/company-logos/bso-supplied/fort-capital.webp",
  "Goldman Sachs":"/company-logos/bso-supplied/goldman-sachs.webp",
  "Haywood Securities":"/company-logos/bso-supplied/haywood-securities.webp",
  "iA Capital Markets":"/company-logos/bso-supplied/ia-capital-markets.webp",
  "Fengate Asset Management":"/company-logos/bso-supplied/fengate-asset-management.webp",
  "Franklin Templeton / Franklin Bissett":"/company-logos/bso-supplied/franklin-templeton.webp",
  "HOOPP":"/company-logos/bso-supplied/hoopp.webp",
  "IMCO":"/company-logos/bso-supplied/imco.webp",
  "INFOR Financial":"/company-logos/bso-supplied/infor-financial.webp",
  "Jefferies":"/company-logos/bso-supplied/jefferies.webp",
  "J.P. Morgan":"/company-logos/bso-supplied/jpmorgan.webp",
  "JPMorgan":"/company-logos/bso-supplied/jpmorgan.webp",
  "KPMG Corporate Finance":"/company-logos/bso-supplied/kpmg.webp",
  "Macquarie":"/company-logos/bso-supplied/macquariegroup.webp",
  "Macquarie Capital":"/company-logos/bso-supplied/macquariegroup.webp",
  "Maxit Capital":"/company-logos/bso-supplied/maxit-capital.webp",
  "Mizuho / Greenhill":"/company-logos/bso-supplied/greenhill-co.webp",
  "MNP Corporate Finance":"/company-logos/bso-supplied/mnp.webp",
  "Morgan Stanley":"/company-logos/bso-supplied/morgan-stanley.webp",
  "MUFG":"/company-logos/bso-supplied/mufg.webp",
  "National Bank Capital Markets":"/company-logos/bso-supplied/national-bank.webp",
  "Natixis":"/company-logos/bso-supplied/natixis-corporate-investment-banking.webp",
  "Origin Merchant Partners":"/company-logos/bso-supplied/origin-merchant-partners.webp",
  "Peters & Co.":"/company-logos/bso-supplied/peters-and-co.webp",
  "PwC":"/company-logos/bso-supplied/pwc.webp",
  "PwC Corporate Finance / Deals":"/company-logos/bso-supplied/pwc.webp",
  "Raymond Chabot Grant Thornton":"/company-logos/bso-supplied/grant-thornton-us.webp",
  "Raymond James Ltd.":"/company-logos/bso-supplied/raymond-james-financial-inc.webp",
  "Nicola Wealth":"/company-logos/bso-supplied/nicola-wealth.webp",
  "Ontario Teachers' Pension Plan":"/company-logos/bso-supplied/ontario-teachers-pension-plan.webp",
  "PSP Investments":"/company-logos/bso-supplied/psp-investments.webp",
  "Peakhill Capital":"/company-logos/bso-supplied/peakhill-capital.webp",
  "Point72":"/company-logos/bso-supplied/point72.webp",
  "Purpose Investments":"/company-logos/bso-supplied/purpose-investments.webp",
  "RBC Capital Markets":"/company-logos/bso-supplied/rbc-capital-markets.webp",
  "Red Cloud Securities":"/company-logos/bso-supplied/red-cloud-securities.webp",
  "Richter":"/company-logos/bso-supplied/richter.webp",
  "Rothschild & Co.":"/company-logos/bso-supplied/rothschildandco.webp",
  "RSM Canada":"/company-logos/bso-supplied/rsm.webp",
  "Scotiabank Global Banking and Markets":"/company-logos/bso-supplied/scotiabank-gbm.webp",
  "SCP Resource Finance":"/company-logos/bso-supplied/scp-resource-finance.webp",
  "Société Générale":"/company-logos/bso-supplied/societe-generale.webp",
  "Stifel Canada":"/company-logos/bso-supplied/stifel-financial-corp.webp",
  "TD Securities":"/company-logos/bso-supplied/td.webp",
  "TPH":"/company-logos/bso-supplied/tudor-pickering-holt.webp",
  "UBS":"/company-logos/bso-supplied/ubs.webp",
  "University Pension Plan Ontario":"/company-logos/bso-supplied/university-pension-plan-ontario.webp",
  "Ventum Financial":"/company-logos/bso-supplied/ventum-financial.webp",
  "Wells Fargo":"/company-logos/bso-supplied/wellsfargo.webp"
};
const firmGroups = [
  {label:"Big 6 Canadian bank",weight:60,companies:new Set<string>(["RBC Capital Markets","TD Securities","BMO Capital Markets","Scotiabank Global Banking and Markets","CIBC Capital Markets","National Bank Capital Markets"])},
  {label:"Global bulge bracket",weight:58,companies:new Set<string>(["Goldman Sachs","J.P. Morgan","JPMorgan","Morgan Stanley","Bank of America","Citi","Barclays","UBS","BNP Paribas","Société Générale"])},
  {label:"Independent advisory",weight:48,companies:new Set<string>(["Evercore","Rothschild & Co.","Rothschild & Co","Perella Weinberg Partners","PWP","TPH","Mizuho / Greenhill"])},
  {label:"Global bank",weight:44,companies:new Set<string>(["Jefferies","Macquarie","Macquarie Capital","Wells Fargo","Cantor Fitzgerald","MUFG","Crédit Agricole","Crédit Agricole CIB","Natixis"])},
  {label:"Independent dealer",weight:34,companies:new Set<string>(["Canaccord Genuity","Stifel Canada","Raymond James Ltd.","Desjardins Capital Markets","ATB Capital Markets","ATB Cormark Capital Markets","INFOR Financial","Origin Merchant Partners","Peters & Co.","Agentis Capital","Agentis Capital Advisors","Bloom Burton","Bloom Burton & Co."])},
  {label:"Corporate finance advisory",weight:28,companies:new Set<string>(["iA Capital Markets","Deloitte Corporate Finance","KPMG Corporate Finance","PwC","PwC Corporate Finance / Deals","EY Corporate Finance","EY-Parthenon Corporate Finance","MNP Corporate Finance","Baker Tilly Canada Capital","Baker Tilly Canada Capital Corporation","BDO Canada","BDO M&A & Capital Markets","Alvarez & Marsal","RSM Canada","Richter","Doane Grant Thornton","Raymond Chabot Grant Thornton"])},
  {label:"Small-cap boutique",weight:20,companies:new Set<string>(["Ventum Financial","Maxit Capital","SCP Resource Finance","Red Cloud Securities","Haywood Securities","Paradigm Capital","Crosbie & Company","Fort Capital","Morrison Park Advisors","Osprey Capital Partners","Sampford Advisors","Research Capital Corporation","Leede Financial","Beacon Securities","Clarus Securities","Blair Franklin Capital Partners","IJW & Co.","FirePower Capital","Valitas Capital Partners","Clariti Strategic Advisors","NewPoint / Clairfield Canada"])},
  {label:"Micro-cap boutique",weight:12,companies:new Set<string>(["Yorkdale Partners","Capital Canada","Kluane Partners","Maison Placements","IBK Capital","Sequeira Partners","Mills Dunlop","Karst Peak Capital","Herculean Capital","Left Lane Associates","Oaklins Canada","Broadstone Capital","Alchemy Capital","Fairing Capital","Tequity Advisors","Distinct Capital Partners","Coldwater Corporate Finance","Westonview Capital","Broderick Capital","Penrose Partners","AIM Group Canada","4Front Capital Partners","RWT Growth"])},
] as const;
const corporateFinanceFirms = firmGroups[5].companies;
const firmGroup = (company:string) => firmGroups.find(group=>group.companies.has(company));
const displayCategory = (company:string, storedCategory:string) => storedCategory==="Corporate Finance"||corporateFinanceFirms.has(company) ? "Corporate Finance" : "Investment Banking";
const rankOrder = ["Intern / Co-op","Analyst","Associate","Vice President","Director","Managing Director"] as const;
const featuredExternalJobOrder = ["anson-investment-analyst-2026-09","R2052799","JR015548"];
const homepageFirmOrder = ["RBC Capital Markets","TD Securities","BMO Capital Markets","CIBC Capital Markets","Barclays","Jefferies"];
const homepageTrendingOrder = ["CSS-0012600","JR101593","7058","210790829","549798030828","R7181"];
const recruitingUpdates:Record<string,RecruitingUpdate> = {
  "24194": { label:"First rounds underway", note:"Confirmed by a verified anonymous source: First-round invitations have begun." },
};
const marqueeLogos = [
  {name:"Atlas Partners",src:"/company-logos/bso-banner/atlas-partners.webp",scale:"atlas"},
  {name:"Bank of America",src:"/company-logos/bso-banner/bank-of-america.webp"},
  {name:"BMO Capital Markets",src:"/company-logos/bso-banner/bmo-capital-markets.webp"},
  {name:"CIBC Capital Markets",src:"/company-logos/bso-banner/cibc-capital-markets.webp"},
  {name:"CPP Investments",src:"/company-logos/bso-banner/cpp-investments.webp"},
  {name:"INFOR Financial",src:"/company-logos/bso-banner/infor-financial.webp",scale:"compact"},
  {name:"Jefferies",src:"/company-logos/bso-banner/jefferies.webp",scale:"jefferies"},
  {name:"National Bank Capital Markets",src:"/company-logos/bso-banner/national-bank-capital-markets.webp"},
  {name:"RBC Capital Markets",src:"/company-logos/bso-banner/rbc-capital-markets.webp"},
  {name:"Scotiabank Global Banking and Markets",src:"/company-logos/bso-banner/scotiabank.webp"},
  {name:"Stifel",src:"/company-logos/bso-banner/stifel.webp",scale:"stifel"},
  {name:"TD Securities",src:"/company-logos/bso-banner/td-securities.webp"},
  {name:"UBS",src:"/company-logos/bso-banner/ubs.webp"},
];
const normalizeRank = (row:JobRow) => {
  const text=`${row.title} ${row.seniority} ${row.program_type??""} ${row.employment_type??""}`.toLowerCase();
  if(/\b(intern|internship|co[ -]?op|student)\b/.test(text))return "Intern / Co-op";
  if(/\banalyst\b|new grad(?:uate)?/.test(text))return "Analyst";
  if(/\bassociate\b/.test(text))return "Associate";
  if(/\bvice president\b|\bvp\b/.test(text))return "Vice President";
  if(/\bmanaging director\b|\bgroup head\b|executive \/ group head/.test(text))return "Managing Director";
  if(/\bdirector\b/.test(text))return "Director";
  return "Analyst";
};
const logo = (company:string) => companyLogos[company] ?? null;
const fmt = (date:string|null) => date ? new Intl.DateTimeFormat("en-CA",{month:"short",day:"numeric"}).format(new Date(`${date}T12:00:00`)) : "Open";
const fmtFull = (date:string|null) => date ? new Intl.DateTimeFormat("en-CA",{month:"long",day:"numeric",year:"numeric"}).format(new Date(`${date}T12:00:00`)) : "Not specified";
const compactPay = (value:number) => value>=1000?`${new Intl.NumberFormat("en-CA",{maximumFractionDigits:1}).format(value/1000)}K`:new Intl.NumberFormat("en-CA",{maximumFractionDigits:2}).format(value);
const salaryLabel = (job:Job) => {
  if(job.salaryMin===null||!job.salaryCurrency)return null;
  const currency=job.salaryCurrency.toUpperCase()==="CAD"?"CA$":`${job.salaryCurrency.toUpperCase()} `;
  const range=job.salaryMax!==null&&job.salaryMax!==job.salaryMin?`${currency}${compactPay(job.salaryMin)}–${compactPay(job.salaryMax)}`:`${currency}${compactPay(job.salaryMin)}`;
  const period=(job.salaryPeriod??"").toLowerCase();
  const suffix=period.includes("hour")?"/hr":period.includes("month")?"/mo":"/yr";
  return `${range}${suffix}${job.seniority==="Intern / Co-op"?" (prorated)":""}`;
};

function SalaryMeta({job,size=14}:{job:Job;size?:number}){
  const label=salaryLabel(job);
  if(!label)return null;
  return <span className="salary-meta" title="Employer-disclosed compensation"><CircleDollarSign size={size}/>{label}</span>;
}
const todayToronto = () => { const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"America/Toronto",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).map(({type,value})=>[type,value])); return `${parts.year}-${parts.month}-${parts.day}`; };
const fmtToday = (date:string) => new Intl.DateTimeFormat("en-CA",{month:"short",day:"numeric",year:"numeric"}).format(new Date(`${date}T12:00:00`));
const emptyAlertPreferences = ():AlertPreferences => ({careerPaths:[],seniorities:[],locations:[]});
const alertLocation = (city:string|null,location:string) => {
  const value=`${city??""} ${location}`.toLowerCase();
  if(/\btoronto\b/.test(value))return "Toronto";
  if(/\bcalgary\b/.test(value))return "Calgary";
  if(/\bmontr[eé]al\b/.test(value))return "Montreal";
  if(/\bvancouver\b/.test(value))return "Vancouver";
  return "Other";
};
const alertPreferencesForJob = (job:Job):AlertPreferences => ({
  careerPaths:job.category==="Investment Banking"?["Investment Banking"]:[],
  seniorities:["Intern / Co-op","Analyst","Associate"].includes(job.seniority)?[job.seniority]:[],
  locations:[alertLocation(job.city,job.location)],
});

const mapRow = (row:JobRow):LoadedJob => ({
  id:row.id,
  externalJobId:row.external_job_id,
  featured:row.featured,
  job:{
    id:row.id,
    externalJobId:row.external_job_id,
    companyId:row.company_id,
    company:row.company_name,
    title:row.title,
    location:row.location_display,
    city:row.city,
    province:row.province,
    category:displayCategory(row.company_name,row.category),
    seniority:normalizeRank(row),
    storedSeniority:row.seniority,
    program:row.program_type??row.employment_type??"Not specified",
    employmentType:row.employment_type,
    workplaceType:row.workplace_type,
    specialization:row.specialization,
    datePosted:row.date_posted,
    deadline:row.application_deadline,
    salaryMin:row.salary_min,
    salaryMax:row.salary_max,
    salaryCurrency:row.salary_currency,
    salaryPeriod:row.salary_period,
    url:row.application_url,
    detailPath:jobPath(row),
    summary:row.summary??"",
    descriptionText:row.description_text??"",
    descriptionStatus:row.description_status,
    recruitingUpdate:recruitingUpdates[row.external_job_id]??null,
    exclusive:/BSO Exclusive/i.test(`${row.source_name} ${row.data_quality_notes??""}`),
  },
});

function YouTubeIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="m10 9 5 3-5 3Z" fill="currentColor"/></svg>}
function InstagramIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.4" cy="6.7" r="1.1" fill="currentColor"/></svg>}
function LinkedInIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.2 8.8H2V22h3.2V8.8ZM3.6 2A2 2 0 1 0 3.6 6a2 2 0 0 0 0-4ZM12.2 8.8H9.1V22h3.2v-6.5c0-1.7.3-3.4 2.5-3.4 2.2 0 2.2 2 2.2 3.5V22h3.2v-7.2c0-3.5-.8-6.3-5-6.3-2 0-3.3 1.1-3.9 2.1h-.1V8.8Z" fill="currentColor"/></svg>}

function Reveal({children,className="",delay=0}:{children:ReactNode;className?:string;delay?:number}) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const node=ref.current;if(!node)return;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){node.classList.add("is-visible");observer.disconnect();}},{threshold:.12});observer.observe(node);return()=>observer.disconnect();},[]);
  return <div ref={ref} className={`reveal ${className}`} style={{transitionDelay:`${delay}ms`}}>{children}</div>;
}

function CompanyLogo({company,size="small"}:{company:string;size?:"small"|"large"}) {
  const [failed,setFailed]=useState(false);
  const logoUrl=logo(company);
  return <div className={`company-logo ${size}`}>{failed||!logoUrl?<span>{company.split(" ").map(w=>w[0]).slice(0,2).join("")}</span>:<img src={logoUrl} alt={`${company} logo`} onError={()=>setFailed(true)}/>}</div>;
}

export default function JobBoard({mode="home",initialCompany=null,initialRows,landing=null}:{mode?:BoardMode;initialCompany?:string|null;initialRows:JobRow[];landing?:JobLandingContent|null}) {
  const today=useMemo(()=>todayToronto(),[]);
  const rankedRows=useMemo(()=>rankJobs(initialRows,{today,diversity:true}),[initialRows,today]);
  const loadedJobs=useMemo(()=>rankedRows.map(({job})=>mapRow(job)),[rankedRows]); const loading=false; const loadError:string|null=null;
  const organicRankById=useMemo(()=>new Map(rankedRows.map(item=>[item.job.id,item])),[rankedRows]);
  const [query,setQuery]=useState(""); const [category,setCategory]=useState("All fields"); const [level,setLevel]=useState("All levels"); const [selected,setSelected]=useState<Job|null>(null); const [companyFilter,setCompanyFilter]=useState<string|null>(initialCompany); const [menuOpen,setMenuOpen]=useState(false); const [subscribed,setSubscribed]=useState(false); const [subscriptionPending,setSubscriptionPending]=useState(false); const [subscriptionError,setSubscriptionError]=useState<string|null>(null);
  const jobs=useMemo(()=>loadedJobs.map(({job})=>job),[loadedJobs]);
  const featuredJobs=useMemo(()=>{const preferred=featuredExternalJobOrder.flatMap(externalJobId=>{const match=loadedJobs.find(item=>item.externalJobId===externalJobId);return match?[match.job]:[]});const preferredIds=new Set(preferred.map(job=>job.id));const editorial=loadedJobs.filter(({featured,job})=>featured&&!preferredIds.has(job.id)).map(({job})=>job);const selectedIds=new Set([...preferredIds,...editorial.map(job=>job.id)]);return [...preferred,...editorial,...jobs.filter(job=>!selectedIds.has(job.id))].slice(0,3)},[jobs,loadedJobs]);
  const trendingJobs=useMemo(()=>{const excludedIds=new Set(featuredJobs.map(job=>job.id));const preferred=homepageTrendingOrder.flatMap(externalJobId=>{const match=loadedJobs.find(item=>item.externalJobId===externalJobId);return match&&!excludedIds.has(match.job.id)?[match.job]:[]});const selectedIds=new Set([...excludedIds,...preferred.map(job=>job.id)]);return [...preferred,...jobs.filter(job=>!selectedIds.has(job.id))].slice(0,6)},[featuredJobs,jobs,loadedJobs]);
  const companies=useMemo(()=>Array.from(new Set(jobs.map(job=>job.company))).map(name=>({name,type:firmGroup(name)?.label??"Financial institution",count:jobs.filter(job=>job.company===name).length})),[jobs]);
  const categories=["All fields",...Array.from(new Set(jobs.map(j=>j.category)))]; const levels=["All levels",...rankOrder.filter(rank=>jobs.some(job=>job.seniority===rank))];
  const filtered=useMemo(()=>{const matches=jobs.filter(j=>`${j.company} ${j.title} ${j.category} ${j.location} ${j.seniority}`.toLowerCase().includes(query.toLowerCase())&&(category==="All fields"||j.category===category)&&(level==="All levels"||j.seniority===level)&&(!companyFilter||j.company===companyFilter));if(category==="All fields"&&!companyFilter)return matches;return [...matches].sort((a,b)=>{const left=organicRankById.get(a.id),right=organicRankById.get(b.id);return (right?.baseScore??0)-(left?.baseScore??0)||(right?.rotation??0)-(left?.rotation??0);});},[jobs,query,category,level,companyFilter,organicRankById]);
  const reset=()=>{setQuery("");setCategory("All fields");setLevel("All levels");setCompanyFilter(null)};
  const subscribe=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();setSubscriptionPending(true);setSubscriptionError(null);const form=event.currentTarget;const data=new FormData(form);try{const response=await fetch("/api/newsletter",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:data.get("email"),website:data.get("website")})});const result=await response.json().catch(()=>null);if(!response.ok)throw new Error(result?.error??"Unable to subscribe right now. Please try again.");setSubscribed(true);form.reset();}catch(error){setSubscriptionError(error instanceof Error?error.message:"Unable to subscribe right now. Please try again.");}finally{setSubscriptionPending(false);}};
  const displayedJobs=mode==="home"?trendingJobs:filtered;
  const displayedCompanies=mode==="home"?homepageFirmOrder.flatMap(name=>{const company=companies.find(item=>item.name===name);return company?[company]:[]}):companies;
  const detailJob=mode==="detail"?jobs[0]??null:null;
  const [alertOpen,setAlertOpen]=useState(false); const [alertStep,setAlertStep]=useState<AlertStep>("email"); const [alertEmail,setAlertEmail]=useState(""); const [alertPreferences,setAlertPreferences]=useState<AlertPreferences>(emptyAlertPreferences); const [alertSource,setAlertSource]=useState<AlertSource>("delayed-modal"); const [alertPending,setAlertPending]=useState(false); const [alertError,setAlertError]=useState<string|null>(null);
  const [inlineAlertSubmitted,setInlineAlertSubmitted]=useState(false);
  const pageAlertPreferences=useMemo<AlertPreferences>(()=>({careerPaths:mode==="jobs"||/investment banking/i.test(landing?.title??"")?["Investment Banking"]:[],seniorities:["Intern / Co-op","Analyst","Associate"].includes(level)?[level]:[],locations:/\btoronto\b/i.test(landing?.title??"")?["Toronto"]:[]}),[landing?.title,level,mode]);
  const alertTitle=alertPreferences.locations.includes("Toronto")&&alertPreferences.careerPaths.includes("Investment Banking")?"Get Toronto investment banking alerts.":"Never miss a Bay Street opening.";
  const openJobAlert=useCallback((source:AlertSource,preferences:AlertPreferences,email="")=>{setAlertSource(source);setAlertPreferences(preferences);setAlertEmail(email);setAlertStep("email");setAlertError(null);setAlertOpen(true);trackJobAlert("job_alert_modal_viewed",source);},[]);
  const closeJobAlert=useCallback(()=>{if(alertStep!=="success")trackJobAlert("job_alert_modal_dismissed",alertSource);sessionStorage.setItem("bso-job-alert-dismissed","1");setAlertOpen(false);setAlertPending(false);setAlertError(null);},[alertSource,alertStep]);
  const saveAlert=useCallback(async(email:string,source:AlertSource,preferences:AlertPreferences,savePreferences:boolean)=>{const response=await fetch("/api/job-alerts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,website:"",signupSource:source,careerPaths:preferences.careerPaths,seniorityPreferences:preferences.seniorities,locationPreferences:preferences.locations,savePreferences})});const result=await response.json().catch(()=>null);if(!response.ok)throw new Error(result?.error??"Unable to save your alert right now. Please try again.");},[]);
  const submitAlertEmail=useCallback(async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();setAlertPending(true);setAlertError(null);try{await saveAlert(alertEmail,alertSource,alertPreferences,false);localStorage.setItem("bso-job-alert-subscribed","1");trackJobAlert("job_alert_email_submitted",alertSource);setAlertStep("preferences");}catch(error){setAlertError(error instanceof Error?error.message:"Unable to save your alert right now. Please try again.");}finally{setAlertPending(false);}},[alertEmail,alertPreferences,alertSource,saveAlert]);
  const startInlineAlert=useCallback(async(email:string)=>{const source:AlertSource="jobs-inline";trackJobAlert("job_alert_inline_started",source);setAlertPending(true);setAlertError(null);try{await saveAlert(email,source,pageAlertPreferences,false);localStorage.setItem("bso-job-alert-subscribed","1");setInlineAlertSubmitted(true);trackJobAlert("job_alert_email_submitted",source);openJobAlert(source,pageAlertPreferences,email);setAlertStep("preferences");}catch(error){const message=error instanceof Error?error.message:"Unable to save your alert right now. Please try again.";setAlertError(message);throw new Error(message);}finally{setAlertPending(false);}},[openJobAlert,pageAlertPreferences,saveAlert]);
  const saveAlertPreferences=useCallback(async()=>{setAlertPending(true);setAlertError(null);try{await saveAlert(alertEmail,alertSource,alertPreferences,true);trackJobAlert("job_alert_preferences_saved",alertSource);setAlertStep("success");}catch(error){setAlertError(error instanceof Error?error.message:"Unable to save your preferences right now. Please try again.");}finally{setAlertPending(false);}},[alertEmail,alertPreferences,alertSource,saveAlert]);
  const skipAlertPreferences=useCallback(()=>{trackJobAlert("job_alert_preferences_skipped",alertSource);setAlertStep("success");},[alertSource]);
  useEffect(()=>{if(!["jobs","landing","company","detail"].includes(mode)||selected||alertOpen)return;if(sessionStorage.getItem("bso-job-alert-dismissed")||localStorage.getItem("bso-job-alert-subscribed"))return;const timer=window.setTimeout(()=>openJobAlert(mode==="jobs"?"delayed-modal":"contextual-page",detailJob?alertPreferencesForJob(detailJob):pageAlertPreferences),27_000);return()=>window.clearTimeout(timer);},[alertOpen,detailJob,mode,openJobAlert,pageAlertPreferences,selected]);
  const inlineAlertIndex=(mode==="jobs"||mode==="landing")&&displayedJobs.length>=3?Math.min(5,displayedJobs.length-1):-1;
  const alertController={open:alertOpen,step:alertStep,email:alertEmail,preferences:alertPreferences,pending:alertPending,error:alertError,source:alertSource,contextualTitle:alertTitle,setEmail:setAlertEmail,setPreferences:setAlertPreferences,close:closeJobAlert,submitEmail:submitAlertEmail,savePreferences:saveAlertPreferences,skipPreferences:skipAlertPreferences};

  return <main>
    <header className="site-header"><Link className="brand" href="/"><img className="brand-logo" src="/bso-logo.png" alt="Bay Street Oracle"/><span className="brand-name">BAY STREET ORACLE</span><span className="brand-product">JOBS</span></Link><nav className={menuOpen?"open":""}><Link href="/jobs" onClick={()=>setMenuOpen(false)}>Jobs</Link><Link href="/companies" onClick={()=>setMenuOpen(false)}>Companies</Link><Link href="/#newsletter" onClick={()=>setMenuOpen(false)}>Newsletter</Link><a className="nav-employer" href="mailto:info@baystreetoracle.ca?subject=BSO%20Hiring%20Campaign" onClick={()=>setMenuOpen(false)}>For employers</a></nav><button className="menu-button" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Toggle menu"><span/><span/></button></header>

    {mode==="home"?<section className="hero" id="top"><div className="hero-copy"><p className="eyebrow light">The Canadian capital-markets job board</p><h1>Find your next seat<br/>on Bay Street.</h1><p>Curated roles and firms for people building careers in Canadian finance.</p></div><div className="hero-stat"><strong>{jobs.length}</strong><span>active opportunities<br/>as of {fmtToday(today)}</span></div><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/></section>:mode==="jobs"?<section className="directory-hero" id="top"><p className="eyebrow light">The complete job board</p><h1>Investment Banking Jobs in Canada</h1><p>BSO Jobs curates current investment banking jobs and internships across Canada, with opportunities spanning student programs through senior hiring.</p></section>:mode==="landing"||mode==="company"?<section className="directory-hero seo-directory-hero" id="top"><p className="eyebrow light">{landing?.eyebrow}</p><h1>{landing?.title}</h1><p>{landing?.intro}</p></section>:null}

    {mode==="home"&&<section className="logo-marquee" aria-label="Firms across the Bay Street community"><p>Followed by leaders across Bay Street</p><div className="logo-marquee-window"><div className="logo-marquee-track">{[0,1].map(copy=><div className="logo-marquee-group" key={copy} aria-hidden={copy===1}>{marqueeLogos.map(logo=><div className="logo-marquee-item" key={`${copy}-${logo.name}`}><Image className={logo.scale??""} src={logo.src} alt={`${logo.name} logo`} width={240} height={96}/></div>)}</div>)}</div></div><small className="logo-marquee-note">Logos represent organizations within our audience and do not imply endorsement or affiliation.</small></section>}

    {mode==="jobs"&&<section className="filter-wrap directory-filter" aria-label="Search jobs"><div className="search-band"><Search size={22}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search role, firm, division or city" aria-label="Search jobs"/><span>{filtered.length} roles</span></div><div className="select-row"><label><span>Field</span><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(v=><option key={v}>{v}</option>)}</select><ChevronDown size={15}/></label><label><span>Level</span><select value={level} onChange={e=>setLevel(e.target.value)}>{levels.map(v=><option key={v}>{v}</option>)}</select><ChevronDown size={15}/></label>{companyFilter&&<span className="active-filter">{companyFilter}</span>}{(query||category!=="All fields"||level!=="All levels"||companyFilter)&&<button onClick={reset}><X size={14}/> Clear</button>}</div></section>}

    {mode==="home"&&<section className="featured-section"><Reveal className="section-heading"><div><p className="eyebrow">BSO selects</p><h2>Opportunities to watch.</h2></div><p>High-interest roles with approaching deadlines, selected for relevance to Canada&apos;s capital-markets community.</p></Reveal><div className="featured-grid">{loading?<div className="empty">Loading featured opportunities…</div>:loadError?<div className="empty">Featured opportunities are unavailable right now.</div>:featuredJobs.slice(0,3).map((job,i)=><Reveal key={`${job.company}-${job.title}`} delay={i*90}><article className="featured-card" onClick={()=>setSelected(job)}><div className="featured-top"><CompanyLogo company={job.company} size="large"/><span>{String(i+1).padStart(2,"0")}</span></div><p className="company-name">{job.company}</p><h3>{job.title}</h3>{job.exclusive&&<span className="bso-exclusive-tag">BSO Exclusive</span>}{job.recruitingUpdate&&<span className="process-tag">{job.recruitingUpdate.label}</span>}<SalaryMeta job={job}/><div className="featured-bottom"><span><Clock3 size={15}/>{fmt(job.deadline)}</span><ArrowUpRight/></div></article></Reveal>)}{!loading&&!loadError&&!featuredJobs.length&&<div className="empty">No featured opportunities right now.</div>}</div></section>}

    {(mode==="home"||mode==="jobs"||mode==="landing"||mode==="company")&&<section className={`jobs-section ${mode==="home"?"jobs-preview":"jobs-directory"}`} id="jobs"><Reveal className="jobs-aside"><p className="eyebrow">{mode==="home"?"Selected opportunities":"Current opportunities"}</p><h2>{landing?.asideTitle??(companyFilter?`Roles at ${companyFilter}`:mode==="home"?"Trending roles.":"The market, organized.")}</h2><p>{landing?.asideCopy??(mode==="home"?"A curated mix of timely opportunities across Canadian investment banking.":"Every active role links directly to the employer. Use search and filters to narrow the list.")}</p></Reveal><div className="job-list">{loading?<div className="empty">Loading opportunities…</div>:loadError?<div className="empty" role="alert">Unable to load opportunities. Please try again later.</div>:displayedJobs.map((job,i)=><Fragment key={job.id}><Reveal delay={Math.min(i,5)*35}><article className="job-card" onClick={()=>setSelected(job)}><CompanyLogo company={job.company}/><div className="job-copy"><p className="company-name">{job.company}</p><h3>{job.title}</h3>{job.recruitingUpdate&&<span className="process-tag">{job.recruitingUpdate.label}</span>}<div className="meta"><span><MapPin size={14}/>{job.location}</span><span><BriefcaseBusiness size={14}/>{job.seniority}</span><SalaryMeta job={job}/></div></div><span className="category">{job.category}</span><div className="job-action"><p>{job.deadline?"Apply by":"Deadline"}<strong>{fmt(job.deadline)}</strong></p><Link href={job.detailPath} onClick={event=>event.stopPropagation()}>View <ArrowUpRight size={15}/></Link></div></article></Reveal>{i===inlineAlertIndex&&<JobAlertInline onSubmit={startInlineAlert} submitted={inlineAlertSubmitted}/>}</Fragment>)}{!loading&&!loadError&&!displayedJobs.length&&<div className="empty">No active opportunities currently match this page.</div>}</div>{mode==="home"&&<div className="section-cta"><Link href="/jobs">View all opportunities <ArrowRight size={17}/></Link></div>}</section>}

    {(mode==="landing"||mode==="company")&&landing&&<section className="seo-support" aria-label={`About ${landing.title}`}><div className="seo-support-grid">{landing.sections.map(section=><section key={section.title}><h2>{section.title}</h2>{section.paragraphs?.map(paragraph=><p key={paragraph}>{paragraph}</p>)}{section.items&&<ul>{section.items.map(item=><li key={item}>{item}</li>)}</ul>}</section>)}</div><nav className="seo-links" aria-label="Related job searches">{landing.links.map(link=><Link href={link.href} key={link.href}>{link.label}<ArrowRight size={15}/></Link>)}</nav></section>}

    {mode==="detail"&&detailJob&&<article className="job-detail"><div className="job-detail-main"><CompanyLogo company={detailJob.company} size="large"/><p className="eyebrow"><Link href={companyPath(detailJob.company)}>{detailJob.company}</Link></p><h1>{detailJob.title}</h1><div className="modal-meta"><span><MapPin size={15}/>{detailJob.location}</span><span><BriefcaseBusiness size={15}/>{detailJob.program}</span><SalaryMeta job={detailJob} size={15}/></div>{detailJob.recruitingUpdate&&<p className="modal-process-note"><strong>{detailJob.recruitingUpdate.label}</strong>{detailJob.recruitingUpdate.note}</p>}<p className="job-detail-summary">{detailJob.summary}</p><dl><div><dt>Firm</dt><dd>{detailJob.company}</dd></div><div><dt>Career level</dt><dd>{detailJob.seniority}</dd></div><div><dt>Program</dt><dd>{detailJob.program}</dd></div>{salaryLabel(detailJob)&&<div><dt>Compensation</dt><dd>{salaryLabel(detailJob)} <small className="salary-note">Employer disclosed</small></dd></div>}{detailJob.employmentType&&<div><dt>Employment</dt><dd>{detailJob.employmentType}</dd></div>}{detailJob.specialization&&<div><dt>Group</dt><dd>{detailJob.specialization}</dd></div>}{detailJob.workplaceType&&<div><dt>Workplace</dt><dd>{detailJob.workplaceType}</dd></div>}<div><dt>Posted</dt><dd>{fmtFull(detailJob.datePosted)}</dd></div><div><dt>Deadline</dt><dd>{fmtFull(detailJob.deadline)}</dd></div></dl>{detailJob.descriptionStatus==="verified"&&detailJob.descriptionText&&<section className="job-description"><p className="eyebrow">From the employer</p><h2>Role description</h2><div>{detailJob.descriptionText}</div><p className="job-description-source">Verified against the employer posting.</p></section>}<a className="apply-button" href={detailJob.url} target="_blank" rel="noreferrer">Apply on employer site <ArrowUpRight size={18}/></a><JobAlertJobPageCta careerPath={detailJob.category} onClick={()=>{trackJobAlert("job_alert_job_page_started","job-page");openJobAlert("job-page",alertPreferencesForJob(detailJob));}}/></div><aside><p className="eyebrow">Explore related opportunities</p><Link href={companyPath(detailJob.company)}>See all {detailJob.company} opportunities <ArrowRight size={15}/></Link>{detailJob.city?.toLowerCase().includes("toronto")&&<Link href="/jobs/investment-banking/toronto">See all Investment Banking Jobs in Toronto <ArrowRight size={15}/></Link>}{detailJob.seniority==="Intern / Co-op"&&<Link href="/jobs/investment-banking/internships">See all Investment Banking Internships in Canada <ArrowRight size={15}/></Link>}{detailJob.storedSeniority==="Analyst"&&<Link href="/jobs/investment-banking/analyst">See all Investment Banking Analyst Jobs in Canada <ArrowRight size={15}/></Link>}{detailJob.storedSeniority==="Associate"&&<Link href="/jobs/investment-banking/associate">See all Investment Banking Associate Jobs in Canada <ArrowRight size={15}/></Link>}<Link href="/jobs">Browse all Investment Banking Jobs in Canada <ArrowRight size={15}/></Link></aside></article>}

    {(mode==="home"||mode==="companies")&&<section className={`companies-section ${mode==="home"?"companies-preview":"companies-directory"}`} id="companies"><Reveal className="section-heading inverse"><div><p className="eyebrow light">Explore the street</p>{mode==="companies"?<h1>Find roles by firm.</h1>:<h2>Find roles by firm.</h2>}</div><p>{mode==="home"?"A quick look at firms currently hiring across Canadian finance.":"Every firm with a live opportunity, organized by its place in the market."}</p></Reveal><div className="company-grid">{displayedCompanies.map((company,i)=><Reveal key={company.name} delay={(i%4)*55}><Link className="company-card" href={companyPath(company.name)}><CompanyLogo company={company.name} size="large"/><div><h3>{company.name}</h3><p>{company.type}</p></div><span>{company.count} {company.count===1?"role":"roles"}</span><ArrowRight/></Link></Reveal>)}</div>{mode==="home"&&<div className="section-cta inverse"><Link href="/companies">View all firms <ArrowRight size={17}/></Link></div>}</section>}

    {mode==="home"&&<section className="newsletter-section" id="newsletter"><Reveal><div className="newsletter-inner"><div className="newsletter-icon"><Mail/></div><div><p className="eyebrow light">The BSO briefing</p><h2>The roles and intelligence that matter—once a week.</h2><p>Join 40,000+ readers across Canada&apos;s capital-markets community.</p></div><form onSubmit={subscribe}>{subscribed?<p className="signup-success" aria-live="polite">You&apos;re on the list. Welcome to BSO.</p>:<><input id="newsletter-email" name="email" type="email" placeholder="Your email address" aria-label="Email address" autoComplete="email" required/><input className="newsletter-honeypot" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true"/><button type="submit" disabled={subscriptionPending}>{subscriptionPending?"Joining…":<>Join the briefing <ArrowRight size={17}/></>}</button><small>By subscribing, you agree to receive The BSO Briefing. Unsubscribe anytime.</small>{subscriptionError&&<p className="signup-error" role="alert">{subscriptionError}</p>}</>}</form></div></Reveal></section>}

    <footer><Link className="footer-brand" href="/"><img src="/bso-logo.png" alt=""/><span>THE BAY STREET ORACLE</span></Link><div><Link href="/jobs">Jobs</Link><Link href="/companies">Companies</Link><Link href="/#newsletter">Newsletter</Link></div><div><p>Not NYC.<br/>Not trying to be.</p><a href="mailto:info@baystreetoracle.ca">info@baystreetoracle.ca</a><div className="footer-socials"><a href="https://www.youtube.com/@baystreetoracle" target="_blank" rel="noreferrer" aria-label="Bay Street Oracle on YouTube"><YouTubeIcon/></a><a href="https://www.instagram.com/baystreetoracle/" target="_blank" rel="noreferrer" aria-label="Bay Street Oracle on Instagram"><InstagramIcon/></a><a href="https://www.linkedin.com/company/baystreetoracle/" target="_blank" rel="noreferrer" aria-label="Bay Street Oracle on LinkedIn"><LinkedInIcon/></a></div></div><small>© 2026 The Bay Street Oracle</small></footer>

    {selected&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><section className="job-modal" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true"><button className="modal-close" onClick={()=>setSelected(null)} aria-label="Close"><X/></button><CompanyLogo company={selected.company} size="large"/><p className="eyebrow">{selected.company}</p><h2>{selected.title}</h2><div className="modal-meta"><span><MapPin size={15}/>{selected.location}</span><span><BriefcaseBusiness size={15}/>{selected.program}</span><SalaryMeta job={selected} size={15}/></div>{selected.recruitingUpdate&&<p className="modal-process-note"><strong>{selected.recruitingUpdate.label}</strong>{selected.recruitingUpdate.note}</p>}<p className="modal-summary">{selected.summary}</p><dl><div><dt>Field</dt><dd>{selected.category}</dd></div><div><dt>Level</dt><dd>{selected.seniority}</dd></div>{salaryLabel(selected)&&<div><dt>Compensation</dt><dd>{salaryLabel(selected)}</dd></div>}<div><dt>Deadline</dt><dd>{fmt(selected.deadline)}</dd></div></dl><Link className="detail-link" href={selected.detailPath}>View full job details</Link><a className="apply-button" href={selected.url} target="_blank" rel="noreferrer">Apply on employer site <ArrowUpRight size={18}/></a></section></div>}
    <JobAlertModal controller={alertController}/>
  </main>;
}
