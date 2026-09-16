"use client";

import { ArrowRight, ArrowUpRight, BriefcaseBusiness, ChevronDown, Clock3, Mail, MapPin, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Job = { company:string; title:string; location:string; category:string; seniority:string; program:string; deadline:string|null; url:string; summary:string };
type JobRow = { id:string; external_job_id:string; company_name:string; title:string; location_display:string; category:string; seniority:string; program_type:string|null; employment_type:string|null; application_deadline:string|null; application_url:string; summary:string|null; featured:boolean };
type LoadedJob = { id:string; externalJobId:string; featured:boolean; job:Job };

const companyLogos: Record<string,string> = {
  "Agentis Capital Advisors":"/company-logos/agentis-capital-logo.webp",
  "Alvarez & Marsal":"/company-logos/alvarez-marsal-logo.webp",
  "ATB Capital Markets":"/company-logos/atb-capital-markets-logo.webp",
  "Baker Tilly Canada Capital":"/company-logos/baker-tilly-canada-logo.webp",
  "Bank of America":"/company-logos/bank-of-america-logo.webp",
  "Barclays":"/company-logos/barclays-bank-logo.webp",
  "BDO Canada":"/company-logos/bdo-logo.webp",
  "Bloom Burton":"/company-logos/bloom-burton-co-logo.webp",
  "BMO Capital Markets":"/company-logos/bmo-capital-markets-logo.webp",
  "BNP Paribas":"/company-logos/bnp-paribas-logo.webp",
  "Canaccord Genuity":"/company-logos/canaccord-financial-logo.webp",
  "Cantor Fitzgerald":"/company-logos/cantor-fitzgerald.webp",
  "CIBC Capital Markets":"/company-logos/cibc-capital-markets-logo.webp",
  "Citi":"/company-logos/citi-logo.webp",
  "Crédit Agricole":"/company-logos/credit-agricole-cib-logo.webp",
  "Crédit Agricole CIB":"/company-logos/credit-agricole-cib-logo.webp",
  "Deloitte Corporate Finance":"/company-logos/deloitte-logo.webp",
  "Desjardins Capital Markets":"/company-logos/desjardins.webp",
  "Evercore":"/company-logos/evercore-inc-logo.webp",
  "EY Corporate Finance":"/company-logos/ey-parthenon-logo.webp",
  "EY-Parthenon Corporate Finance":"/company-logos/ey-parthenon-logo.webp",
  "Fort Capital":"/company-logos/fort-capital-logo.webp",
  "Goldman Sachs":"/company-logos/goldman-sachs-logo.webp",
  "Haywood Securities":"/company-logos/haywood-securities-logo.webp",
  "iA Capital Markets":"/company-logos/ia-capital-markets-logo.webp",
  "INFOR Financial":"/company-logos/infor-financial.webp",
  "Jefferies":"/company-logos/jefferies-logo.webp",
  "J.P. Morgan":"/company-logos/jpmorgan-logo.webp",
  "JPMorgan":"/company-logos/jpmorgan-logo.webp",
  "KPMG Corporate Finance":"/company-logos/kpmg-logo.webp",
  "Macquarie":"/company-logos/macquariegroup-logo.webp",
  "Macquarie Capital":"/company-logos/macquariegroup-logo.webp",
  "Maxit Capital":"/company-logos/maxit-capital.webp",
  "Mizuho / Greenhill":"/company-logos/greenhill-co-logo.webp",
  "MNP Corporate Finance":"/company-logos/mnp-logo.webp",
  "Morgan Stanley":"/company-logos/morgan-stanley-logo.webp",
  "MUFG":"/company-logos/mufg-logo.webp",
  "National Bank Financial Markets":"/company-logos/national-bank-logo.webp",
  "Natixis":"/company-logos/natixis-corporate-investment-banking-logo.webp",
  "Origin Merchant Partners":"/company-logos/origin-merchant-partners-logo.webp",
  "Peters & Co.":"/company-logos/peters-and-co.webp",
  "PwC":"/company-logos/pwc-logo.webp",
  "PwC Corporate Finance / Deals":"/company-logos/pwc-logo.webp",
  "Raymond Chabot Grant Thornton":"/company-logos/grant-thornton-us-logo.webp",
  "Raymond James Ltd.":"/company-logos/raymond-james-financial-inc-logo.webp",
  "RBC Capital Markets":"/company-logos/rbc-capital-markets-logo.webp",
  "Red Cloud Securities":"/company-logos/red-cloud-securities.webp",
  "Richter":"/company-logos/richter-logo.webp",
  "Rothschild & Co.":"/company-logos/rothschildandco-logo.webp",
  "RSM Canada":"/company-logos/rsm-logo.webp",
  "Scotiabank Global Banking and Markets":"/company-logos/scotiabank-gbm-logo.webp",
  "SCP Resource Finance":"/company-logos/scp-resource-finance-logo.webp",
  "Société Générale":"/company-logos/societe-generale-logo.webp",
  "Stifel Canada":"/company-logos/stifel-financial-corp-logo.webp",
  "TD Securities":"/company-logos/td-logo.webp",
  "TPH":"/company-logos/tudor-pickering-holt-logo.webp",
  "UBS":"/company-logos/ubs-logo.webp",
  "Ventum Financial":"/company-logos/ventum-financial-logo.webp",
  "Wells Fargo":"/company-logos/wellsfargo-logo.webp"
};
const firmGroups = [
  {label:"Big 6 Canadian bank",weight:60,companies:new Set<string>(["RBC Capital Markets","TD Securities","BMO Capital Markets","Scotiabank Global Banking and Markets","CIBC Capital Markets","National Bank Financial Markets","National Bank Capital Markets"])},
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
const displayCategory = (company:string) => corporateFinanceFirms.has(company) ? "Corporate Finance" : "Investment Banking";
const rankOrder = ["Intern / Co-op","Analyst","Associate","Vice President","Director","Managing Director"] as const;
const featuredCompanyOrder = ["BMO Capital Markets","Macquarie Capital","Morgan Stanley"];
const homepageFirmOrder = ["RBC Capital Markets","TD Securities","BMO Capital Markets","CIBC Capital Markets","Barclays","Jefferies"];
const homepageTrendingOrder = ["R_1508614","2618460","R260021697","210762506","R7181","JR015548"];
const marqueeLogos = [
  {name:"Atlas Partners",src:"/banner-logos/atlas-partners.webp",scale:"atlas"},
  {name:"Bank of America",src:"/banner-logos/bank-of-america.webp"},
  {name:"BMO Capital Markets",src:"/banner-logos/bmo-capital-markets.webp"},
  {name:"CIBC Capital Markets",src:"/banner-logos/cibc-capital-markets.webp"},
  {name:"CPP Investments",src:"/banner-logos/cpp-investments.webp"},
  {name:"INFOR Financial",src:"/banner-logos/infor-financial.webp",scale:"compact"},
  {name:"Jefferies",src:"/banner-logos/jefferies.webp",scale:"jefferies"},
  {name:"National Bank Capital Markets",src:"/banner-logos/national-bank-capital-markets.webp"},
  {name:"RBC Capital Markets",src:"/banner-logos/rbc-capital-markets.webp"},
  {name:"Scotiabank Global Banking and Markets",src:"/banner-logos/scotiabank.webp"},
  {name:"Stifel",src:"/banner-logos/stifel.webp",scale:"stifel"},
  {name:"TD Securities",src:"/banner-logos/td-securities.webp"},
  {name:"UBS",src:"/banner-logos/ubs.webp"},
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
const deadlineScore = (deadline:string|null,today:string) => {
  if(!deadline)return 0;
  const days=Math.ceil((new Date(`${deadline}T12:00:00Z`).getTime()-new Date(`${today}T12:00:00Z`).getTime())/86_400_000);
  if(days<=3)return 42; if(days<=7)return 34; if(days<=14)return 26; if(days<=30)return 16; if(days<=60)return 8; return 0;
};
const dailyShuffle = (job:Job,today:string) => {
  const seed=`${today}|${job.company}|${job.title}|${job.deadline??"open"}`;
  let hash=2166136261;
  for(let i=0;i<seed.length;i++){hash^=seed.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return ((hash>>>0)%1500)/100;
};
const rankingScore = (job:Job,today:string) => (firmGroup(job.company)?.weight??8)+deadlineScore(job.deadline,today)+dailyShuffle(job,today);
const logo = (company:string) => companyLogos[company] ?? null;
const fmt = (date:string|null) => date ? new Intl.DateTimeFormat("en-CA",{month:"short",day:"numeric"}).format(new Date(`${date}T12:00:00`)) : "Open";
const todayToronto = () => { const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"America/Toronto",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).map(({type,value})=>[type,value])); return `${parts.year}-${parts.month}-${parts.day}`; };
const fmtToday = (date:string) => new Intl.DateTimeFormat("en-CA",{month:"short",day:"numeric",year:"numeric"}).format(new Date(`${date}T12:00:00`));

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

export default function JobBoard({mode="home",initialCompany=null}:{mode?:"home"|"jobs"|"companies";initialCompany?:string|null}) {
  const [loadedJobs,setLoadedJobs]=useState<LoadedJob[]>([]); const [loading,setLoading]=useState(true); const [loadError,setLoadError]=useState<string|null>(null);
  const [query,setQuery]=useState(""); const [category,setCategory]=useState("All fields"); const [level,setLevel]=useState("All levels"); const [selected,setSelected]=useState<Job|null>(null); const [companyFilter,setCompanyFilter]=useState<string|null>(initialCompany); const [menuOpen,setMenuOpen]=useState(false); const [subscribed,setSubscribed]=useState(false);
  const today=useMemo(()=>todayToronto(),[]);
  useEffect(()=>{let cancelled=false;async function loadJobs(){try{const supabase=getSupabaseBrowserClient();const {data,error}=await supabase.from("jobs").select("id,external_job_id,company_name,title,location_display,category,seniority,program_type,employment_type,application_deadline,application_url,summary,featured").eq("status","active").or(`application_deadline.is.null,application_deadline.gte.${today}`).order("application_deadline",{ascending:true,nullsFirst:false});if(error)throw error;if(cancelled)return;setLoadedJobs(((data??[]) as JobRow[]).map(row=>({id:row.id,externalJobId:row.external_job_id,featured:row.featured,job:{company:row.company_name,title:row.title,location:row.location_display,category:displayCategory(row.company_name),seniority:normalizeRank(row),program:row.program_type??row.employment_type??"Not specified",deadline:row.application_deadline,url:row.application_url,summary:row.summary??""}})));}catch(error){if(!cancelled)setLoadError(error instanceof Error?error.message:"Unable to load jobs.");}finally{if(!cancelled)setLoading(false);}}loadJobs();return()=>{cancelled=true};},[today]);
  const jobs=useMemo(()=>loadedJobs.map(({job})=>job).sort((a,b)=>rankingScore(b,today)-rankingScore(a,today)||a.company.localeCompare(b.company)||a.title.localeCompare(b.title)),[loadedJobs,today]);
  const featuredJobs=useMemo(()=>loadedJobs.filter(({featured})=>featured).map(({job})=>job).sort((a,b)=>featuredCompanyOrder.indexOf(a.company)-featuredCompanyOrder.indexOf(b.company)),[loadedJobs]);
  const trendingJobs=useMemo(()=>homepageTrendingOrder.flatMap(externalJobId=>{const match=loadedJobs.find(job=>job.externalJobId===externalJobId);return match?[match.job]:[];}),[loadedJobs]);
  const companies=useMemo(()=>Array.from(new Set(jobs.map(job=>job.company))).map(name=>({name,type:firmGroup(name)?.label??"Financial institution",count:jobs.filter(job=>job.company===name).length})),[jobs]);
  const categories=["All fields",...Array.from(new Set(jobs.map(j=>j.category)))]; const levels=["All levels",...rankOrder.filter(rank=>jobs.some(job=>job.seniority===rank))];
  const filtered=useMemo(()=>jobs.filter(j=>`${j.company} ${j.title} ${j.category} ${j.location} ${j.seniority}`.toLowerCase().includes(query.toLowerCase())&&(category==="All fields"||j.category===category)&&(level==="All levels"||j.seniority===level)&&(!companyFilter||j.company===companyFilter)),[jobs,query,category,level,companyFilter]);
  const reset=()=>{setQuery("");setCategory("All fields");setLevel("All levels");setCompanyFilter(null)};
  const displayedJobs=mode==="home"?trendingJobs:filtered;
  const displayedCompanies=mode==="home"?homepageFirmOrder.flatMap(name=>{const company=companies.find(item=>item.name===name);return company?[company]:[]}):companies;

  return <main>
    <header className="site-header"><Link className="brand" href="/"><img className="brand-logo" src="/bso-logo.png" alt="Bay Street Oracle"/><span className="brand-name">BAY STREET ORACLE</span><span className="brand-product">JOBS</span></Link><nav className={menuOpen?"open":""}><Link href="/jobs" onClick={()=>setMenuOpen(false)}>Jobs</Link><Link href="/companies" onClick={()=>setMenuOpen(false)}>Companies</Link><Link href="/#newsletter" onClick={()=>setMenuOpen(false)}>Newsletter</Link><a className="nav-employer" href="mailto:info@baystreetoracle.ca?subject=BSO%20Hiring%20Campaign" onClick={()=>setMenuOpen(false)}>For employers</a></nav><button className="menu-button" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Toggle menu"><span/><span/></button></header>

    {mode==="home"?<section className="hero" id="top"><div className="hero-copy"><p className="eyebrow light">The Canadian capital-markets job board</p><h1>Find your next seat<br/>on Bay Street.</h1><p>Curated roles and firms for people building careers in Canadian finance.</p></div><div className="hero-stat"><strong>{loading?"—":jobs.length}</strong><span>active opportunities<br/>as of {fmtToday(today)}</span></div><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/></section>:mode==="jobs"?<section className="directory-hero" id="top"><p className="eyebrow light">The complete job board</p><h1>All opportunities.</h1><p>{jobs.length} active Canadian finance roles, ranked and filterable.</p></section>:null}

    {mode==="home"&&<section className="logo-marquee" aria-label="Firms across the Bay Street community"><p>Followed by leaders across Bay Street</p><div className="logo-marquee-window"><div className="logo-marquee-track">{[0,1].map(copy=><div className="logo-marquee-group" key={copy} aria-hidden={copy===1}>{marqueeLogos.map(logo=><div className="logo-marquee-item" key={`${copy}-${logo.name}`}><Image className={logo.scale??""} src={logo.src} alt={`${logo.name} logo`} width={240} height={96}/></div>)}</div>)}</div></div></section>}

    {mode==="jobs"&&<section className="filter-wrap directory-filter" aria-label="Search jobs"><div className="search-band"><Search size={22}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search role, firm, division or city" aria-label="Search jobs"/><span>{filtered.length} roles</span></div><div className="select-row"><label><span>Field</span><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(v=><option key={v}>{v}</option>)}</select><ChevronDown size={15}/></label><label><span>Level</span><select value={level} onChange={e=>setLevel(e.target.value)}>{levels.map(v=><option key={v}>{v}</option>)}</select><ChevronDown size={15}/></label>{companyFilter&&<span className="active-filter">{companyFilter}</span>}{(query||category!=="All fields"||level!=="All levels"||companyFilter)&&<button onClick={reset}><X size={14}/> Clear</button>}</div></section>}

    {mode==="home"&&<section className="featured-section"><Reveal className="section-heading"><div><p className="eyebrow">BSO selects</p><h2>Opportunities to watch.</h2></div><p>High-interest roles with approaching deadlines, selected for relevance to Canada&apos;s capital-markets community.</p></Reveal><div className="featured-grid">{loading?<div className="empty">Loading featured opportunities…</div>:loadError?<div className="empty">Featured opportunities are unavailable right now.</div>:featuredJobs.slice(0,3).map((job,i)=><Reveal key={`${job.company}-${job.title}`} delay={i*90}><article className="featured-card" onClick={()=>setSelected(job)}><div className="featured-top"><CompanyLogo company={job.company} size="large"/><span>{String(i+1).padStart(2,"0")}</span></div><p className="company-name">{job.company}</p><h3>{job.title}</h3><div className="featured-bottom"><span><Clock3 size={15}/>{fmt(job.deadline)}</span><ArrowUpRight/></div></article></Reveal>)}{!loading&&!loadError&&!featuredJobs.length&&<div className="empty">No featured opportunities right now.</div>}</div></section>}

    {mode!=="companies"&&<section className={`jobs-section ${mode==="home"?"jobs-preview":"jobs-directory"}`} id="jobs"><Reveal className="jobs-aside"><p className="eyebrow">{mode==="home"?"Selected opportunities":"All opportunities"}</p><h2>{companyFilter?`Roles at ${companyFilter}`:mode==="home"?"Trending roles.":"The market, organized."}</h2><p>{mode==="home"?"A curated mix of timely opportunities across Canadian investment banking.":"Every active role links directly to the employer. Use search and filters to narrow the list."}</p></Reveal><div className="job-list">{loading?<div className="empty">Loading opportunities…</div>:loadError?<div className="empty" role="alert">Unable to load opportunities. Please try again later.</div>:displayedJobs.map((job,i)=><Reveal key={`${job.company}-${job.title}`} delay={Math.min(i,5)*35}><article className="job-card" onClick={()=>setSelected(job)}><CompanyLogo company={job.company}/><div className="job-copy"><p className="company-name">{job.company}</p><h3>{job.title}</h3><div className="meta"><span><MapPin size={14}/>{job.location}</span><span><BriefcaseBusiness size={14}/>{job.seniority}</span></div></div><span className="category">{job.category}</span><div className="job-action"><p>{job.deadline?"Apply by":"Deadline"}<strong>{fmt(job.deadline)}</strong></p><button>View <ArrowUpRight size={15}/></button></div></article></Reveal>)}{!loading&&!loadError&&!displayedJobs.length&&<div className="empty">No opportunities match those filters.</div>}</div>{mode==="home"&&<div className="section-cta"><Link href="/jobs">View all opportunities <ArrowRight size={17}/></Link></div>}</section>}

    {mode!=="jobs"&&<section className={`companies-section ${mode==="home"?"companies-preview":"companies-directory"}`} id="companies"><Reveal className="section-heading inverse"><div><p className="eyebrow light">Explore the street</p><h2>Find roles by firm.</h2></div><p>{mode==="home"?"A quick look at firms currently hiring across Canadian finance.":"Every firm with a live opportunity, organized by its place in the market."}</p></Reveal><div className="company-grid">{displayedCompanies.map((company,i)=><Reveal key={company.name} delay={(i%4)*55}><Link className="company-card" href={`/jobs?company=${encodeURIComponent(company.name)}`}><CompanyLogo company={company.name} size="large"/><div><h3>{company.name}</h3><p>{company.type}</p></div><span>{company.count} {company.count===1?"role":"roles"}</span><ArrowRight/></Link></Reveal>)}</div>{mode==="home"&&<div className="section-cta inverse"><Link href="/companies">View all firms <ArrowRight size={17}/></Link></div>}</section>}

    {mode==="home"&&<section className="newsletter-section" id="newsletter"><Reveal><div className="newsletter-inner"><div className="newsletter-icon"><Mail/></div><div><p className="eyebrow light">The BSO briefing</p><h2>The roles and intelligence that matter—once a week.</h2><p>Join 40,000+ readers across Canada&apos;s capital-markets community.</p></div><form onSubmit={e=>{e.preventDefault();setSubscribed(true)}}>{subscribed?<p className="signup-success" aria-live="polite">You&apos;re on the list. Welcome to BSO.</p>:<><input id="newsletter-email" type="email" placeholder="Your email address" aria-label="Email address" required/><button>Join the briefing <ArrowRight size={17}/></button><small>Free. High signal. Unsubscribe anytime.</small></>}</form></div></Reveal></section>}

    <footer><Link className="footer-brand" href="/"><img src="/bso-logo.png" alt=""/><span>THE BAY STREET ORACLE</span></Link><div><Link href="/jobs">Jobs</Link><Link href="/companies">Companies</Link><Link href="/#newsletter">Newsletter</Link></div><div><p>Not NYC.<br/>Not trying to be.</p><a href="mailto:info@baystreetoracle.ca">info@baystreetoracle.ca</a><div className="footer-socials"><a href="https://www.youtube.com/@baystreetoracle" target="_blank" rel="noreferrer" aria-label="Bay Street Oracle on YouTube"><YouTubeIcon/></a><a href="https://www.instagram.com/baystreetoracle/" target="_blank" rel="noreferrer" aria-label="Bay Street Oracle on Instagram"><InstagramIcon/></a><a href="https://www.linkedin.com/company/baystreetoracle/" target="_blank" rel="noreferrer" aria-label="Bay Street Oracle on LinkedIn"><LinkedInIcon/></a></div></div><small>© 2026 The Bay Street Oracle</small></footer>

    {selected&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><section className="job-modal" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true"><button className="modal-close" onClick={()=>setSelected(null)} aria-label="Close"><X/></button><CompanyLogo company={selected.company} size="large"/><p className="eyebrow">{selected.company}</p><h2>{selected.title}</h2><div className="modal-meta"><span><MapPin size={15}/>{selected.location}</span><span><BriefcaseBusiness size={15}/>{selected.program}</span></div><p className="modal-summary">{selected.summary}</p><dl><div><dt>Field</dt><dd>{selected.category}</dd></div><div><dt>Level</dt><dd>{selected.seniority}</dd></div><div><dt>Deadline</dt><dd>{fmt(selected.deadline)}</dd></div></dl><a className="apply-button" href={selected.url} target="_blank" rel="noreferrer">Apply on employer site <ArrowUpRight size={18}/></a></section></div>}
  </main>;
}
