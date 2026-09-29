"use client";

import { useEffect, useMemo, useState } from "react";

type Decision = "approve" | "reject" | "review";
type DecisionMap = Record<string, Decision>;

type NewJob = {
  id: string; company: string; title: string; location: string; careerPath: string;
  seniority: string; datePosted?: string | null; source: string; confidence: number | null;
  reason: string; description: string; url: string; requisition: string; origin: string;
  specialization?: string | null; programType?: string | null; exclusive?: boolean;
};

type ReviewItem = {
  id: string; company: string; title: string; location: string; careerPath: string;
  seniority: string; confidence: number | null; reason: string; description: string;
  url: string; source: string;
};

type RejectedItem = ReviewItem & { bucket: string; careerPath: string };

type SourceItem = {
  company: string; source: string; sourceType: string; careersUrl: string; endpoint: string;
  success: boolean; status: "failed" | "success" | "success-zero"; scanned: number; canadian: number;
  qualifying: number; rejected: number; manualReview: number; notes: string; failureCategory: string | null;
  httpStatus: string | null; alternativeAttempted: boolean; lastAttempted: string; lastSuccessful: string | null;
  recommendedAction: string | null;
};

type RankingItem = {
  rank: number; id: string; reviewId: string | null; reviewState: string; company: string; title: string;
  location: string; careerPath: string; seniority: string; datePosted: string | null; score: number;
  baseScore: number; band: number; why: string;
  components: { firm: number; careerPath: number; rarity: number; seniority: number; freshness: number; exclusive: number; location: number; diversityAdjustment: number };
};

type Report = {
  generatedAt: string;
  reportFile: string;
  manualAdditions: number;
  excludedCpaJobs: number;
  newJobs: NewJob[];
  ranking: RankingItem[];
  editorialPreview: { featured: RankingItem[]; trending: RankingItem[] };
  updates: Array<{ id: string; company: string; title: string; location: string; reason: string; confidence: number | null; url: string; changes: Array<{ field: string; existing: unknown; proposed: unknown }> }>;
  rejected: RejectedItem[];
  rejectionTotals: Record<string, number>;
  manualReview: ReviewItem[];
  reopening: Array<ReviewItem & { proposedStatus: string; currentStatus: string }>;
  duplicates: ReviewItem[];
  sources: SourceItem[];
};

const PATHS = ["Investment Banking", "Private Equity", "Private Credit", "Institutional Investing", "Asset Management", "Real Estate Investing", "Hedge Fund"];

function roleFamily(job: NewJob) {
  if (job.company === "Agentis Capital" && /investment banking.*analyst/i.test(job.title)) return "Investment Banking Analyst";
  if (job.company === "KPMG Corporate Finance") {
    if (/associate vice president.*corporate finance/i.test(job.title)) return "Associate Vice President, Corporate Finance";
    if (/associate.*corporate finance/i.test(job.title)) return "Associate, Corporate Finance";
    if (/analyst.*corporate finance/i.test(job.title)) return "Analyst, Corporate Finance";
  }
  return job.title
    .replace(/\s*[-–—]\s*(?:Toronto|Calgary|Vancouver|Montreal|Montréal|Winnipeg|Edmonton|Ottawa|Halifax).*$/i, "")
    .replace(/\s*\((?:Toronto|Calgary|Vancouver|Montreal|Montréal|Winnipeg|Edmonton|Ottawa|Halifax)[^)]*\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(value?: string | null) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not set";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function Confidence({ value }: { value: number | null }) {
  if (value === null) return <span className="cr-confidence neutral">Not scored</span>;
  const label = `${Math.round(value * 100)}%`;
  return <span className={`cr-confidence ${value >= 0.9 ? "high" : value >= 0.75 ? "medium" : "low"}`}>{label}</span>;
}

function DecisionControl({ id, decisions, setDecision }: { id: string; decisions: DecisionMap; setDecision: (id: string, value: Decision) => void }) {
  const current = decisions[id];
  return (
    <div className="cr-decisions" aria-label="Local review decision">
      {(["approve", "reject", "review"] as Decision[]).map((value) => (
        <button key={value} type="button" className={current === value ? `active ${value}` : ""} onClick={() => setDecision(id, value)}>
          {value === "review" ? "Needs review" : value}
        </button>
      ))}
    </div>
  );
}

function DetailText({ value }: { value: string }) {
  if (!value) return <p className="cr-empty">No description excerpt was available in this dry-run record.</p>;
  return <p className="cr-excerpt">{value}</p>;
}

export function CollectorReview({ report }: { report: Report }) {
  const storageKey = `bso-collector-review:${report.generatedAt}`;
  const [tab, setTab] = useState<"approved" | "proposed" | "needs" | "rejected" | "duplicates" | "failed" | "sources" | "ranking">("proposed");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [decisions, setDecisions] = useState<DecisionMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [pathFilter, setPathFilter] = useState("All");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [seniorityFilter, setSeniorityFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [rejectedQuery, setRejectedQuery] = useState("");
  const [rejectedBucket, setRejectedBucket] = useState("All");
  const [rejectedPage, setRejectedPage] = useState(1);
  const [sourceSort, setSourceSort] = useState<"failed" | "qualifying" | "scanned" | "company">("failed");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setDecisions(JSON.parse(localStorage.getItem(storageKey) ?? "{}")); } catch { setDecisions({}); }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(storageKey, JSON.stringify(decisions));
  }, [decisions, hydrated, storageKey]);

  const setDecision = (id: string, value: Decision) => setDecisions((current) => ({ ...current, [id]: value }));
  const companies = useMemo(() => [...new Set(report.newJobs.map((job) => job.company))].sort(), [report.newJobs]);
  const locations = useMemo(() => [...new Set(report.newJobs.map((job) => job.location))].sort(), [report.newJobs]);
  const seniorities = useMemo(() => [...new Set(report.newJobs.map((job) => job.seniority))].sort(), [report.newJobs]);
  const scopedJobs = useMemo(() => report.newJobs.filter((job) => tab === "approved" ? decisions[job.id] === "approve" : tab === "proposed" ? !decisions[job.id] : true), [decisions, report.newJobs, tab]);
  const visibleJobs = useMemo(() => {
    const search = query.trim().toLowerCase();
    return scopedJobs.filter((job) =>
      (pathFilter === "All" || job.careerPath === pathFilter)
      && (companyFilter === "All" || job.company === companyFilter)
      && (locationFilter === "All" || job.location === locationFilter)
      && (seniorityFilter === "All" || job.seniority === seniorityFilter)
      && (!search || `${job.company} ${job.title} ${job.location} ${job.careerPath}`.toLowerCase().includes(search)),
    );
  }, [scopedJobs, pathFilter, companyFilter, locationFilter, seniorityFilter, query]);
  const visibleGroups = useMemo(() => {
    const groups = new Map<string, { key: string; company: string; title: string; jobs: NewJob[] }>();
    for (const job of visibleJobs) {
      const title = roleFamily(job);
      const key = `${job.company}|${job.careerPath}|${job.seniority}|${title}`;
      const group = groups.get(key) ?? { key, company: job.company, title, jobs: [] };
      group.jobs.push(job);
      groups.set(key, group);
    }
    return [...groups.values()].sort((a, b) => a.company.localeCompare(b.company) || a.title.localeCompare(b.title));
  }, [visibleJobs]);

  const decisionCounts = { approve: 0, reject: 0, review: 0, unreviewed: 0 };
  for (const job of report.newJobs) {
    const decision = decisions[job.id];
    if (decision) decisionCounts[decision] += 1;
    else decisionCounts.unreviewed += 1;
  }

  const tabs = [
    ["approved", "Approved", decisionCounts.approve], ["proposed", "Proposed", decisionCounts.unreviewed],
    ["needs", "Needs review", decisionCounts.review + report.manualReview.length + report.reopening.length],
    ["rejected", "Rejected", decisionCounts.reject + report.rejected.length], ["duplicates", "Duplicates", report.duplicates.length],
    ["failed", "Failed sources", report.sources.filter((source) => !source.success).length], ["sources", "Source health", report.sources.length],
    ["ranking", "Ranking debug", report.ranking.length],
  ] as const;

  return (
    <main className="collector-review">
      <header className="cr-header">
        <div>
          <p className="cr-kicker">Local collector console</p>
          <h1>Review before anything moves.</h1>
          <p>Report generated {formatDate(report.generatedAt)} · {report.reportFile} · {report.manualAdditions} curated additions · {report.excludedCpaJobs} CPA posting excluded</p>
        </div>
        <div className="cr-safety"><strong>DRY RUN</strong><span>NO PRODUCTION CHANGES</span></div>
      </header>

      <section className="cr-summary" aria-label="Dry-run summary">
        {[[report.newJobs.length, "New"], [report.updates.length, "Updates"], [report.manualReview.length, "Review"], [report.reopening.length, "Reopening review"], [report.duplicates.length, "Duplicates"], [report.sources.filter((source) => !source.success).length, "Failed sources"]].map(([value, label]) => (
          <div key={label}><strong>{value}</strong><span>{label}</span></div>
        ))}
      </section>

      <section className="cr-local-note">
        <span>●</span><p><strong>Local review state only.</strong> Decisions are saved in this browser and never sent to Supabase. Refreshing keeps them; clearing browser storage resets them.</p>
      </section>

      <nav className="cr-tabs" aria-label="Review sections">
        {tabs.map(([value, label, count]) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}<span>{count}</span></button>)}
      </nav>

      {(tab === "approved" || tab === "proposed") && <section>
        <div className="cr-section-heading-inline"><div><p className="cr-kicker">{tab === "approved" ? "Explicit local approvals" : "Awaiting your decision"}</p><h2>{tab === "approved" ? "Approved jobs" : "Proposed jobs"}</h2></div><p>{tab === "approved" ? "Only jobs shown here are eligible for a future production write." : "Nothing here is approved until you explicitly mark it Approved."}</p></div>
        <div className="cr-review-progress">
          <div><strong>{decisionCounts.approve}</strong> approved</div><div><strong>{decisionCounts.reject}</strong> rejected</div>
          <div><strong>{decisionCounts.review}</strong> needs review</div><div><strong>{decisionCounts.unreviewed}</strong> untouched</div>
        </div>
        <div className="cr-path-filters">
          {["All", ...PATHS].map((value) => <button key={value} className={pathFilter === value ? "active" : ""} onClick={() => setPathFilter(value)}>{value}</button>)}
        </div>
        <div className="cr-filter-panel">
          <label className="cr-search"><span>Search roles</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Company, title, city…" /></label>
          <label><span>Company</span><select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)}><option>All</option>{companies.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Location</span><select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}><option>All</option>{locations.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Seniority</span><select value={seniorityFilter} onChange={(event) => setSeniorityFilter(event.target.value)}><option>All</option>{seniorities.map((value) => <option key={value}>{value}</option>)}</select></label>
        </div>
        <div className="cr-selection-bar">
          <span><strong>{visibleJobs.length}</strong> postings in <strong>{visibleGroups.length}</strong> role groups · <strong>{selected.size}</strong> selected</span>
          <div>
            <button onClick={() => setSelected(new Set(visibleJobs.map((job) => job.id)))}>Select all</button>
            <button onClick={() => setSelected(new Set())}>Select none</button>
            <button className="approve" disabled={!selected.size} onClick={() => selected.forEach((id) => setDecision(id, "approve"))}>Approve selected</button>
            <button className="reject" disabled={!selected.size} onClick={() => selected.forEach((id) => setDecision(id, "reject"))}>Reject selected</button>
          </div>
        </div>
        <div className="cr-job-list">
          {visibleGroups.map((group) => group.jobs.length === 1
            ? <NewJobCard key={group.key} job={group.jobs[0]} selected={selected} setSelected={setSelected} decisions={decisions} setDecision={setDecision} />
            : <article className="cr-role-group" key={group.key}>
              <div className="cr-group-heading">
                <div><p>{group.company}</p><h2>{group.title}</h2><span>{group.jobs.length} location / requisition branches</span></div>
                <div className="cr-group-actions">
                  <button type="button" onClick={() => setSelected((current) => { const next = new Set(current); group.jobs.forEach((job) => next.add(job.id)); return next; })}>Select group</button>
                  <button type="button" onClick={() => group.jobs.forEach((job) => setDecision(job.id, "approve"))}>Approve group</button>
                  <button type="button" onClick={() => group.jobs.forEach((job) => setDecision(job.id, "reject"))}>Reject group</button>
                </div>
              </div>
              <div className="cr-group-locations">{[...new Set(group.jobs.map((job) => job.location))].map((location) => <span key={location}>{location}</span>)}</div>
              <details className="cr-group-branches"><summary>Review individual branches</summary><div>{group.jobs.map((job) => <NewJobCard key={job.id} job={job} selected={selected} setSelected={setSelected} decisions={decisions} setDecision={setDecision} compact />)}</div></details>
            </article>)}
          {!visibleJobs.length && <p className="cr-no-results">{tab === "approved" ? "No jobs have been approved yet." : "No jobs match these filters."}</p>}
        </div>
        {tab === "proposed" && <section className="cr-section-list cr-proposed-updates">
          <div className="cr-section-intro"><p className="cr-kicker">Separate approval required</p><h2>Proposed metadata updates</h2><p>These changes affect existing records and remain untouched unless individually approved.</p></div>
          {report.updates.map((item) => <article className="cr-panel" key={item.id}><div className="cr-panel-title"><div><p>{item.company} · {item.location}</p><h3>{item.title}</h3></div><Confidence value={item.confidence} /></div><div className="cr-diff"><div className="header"><span>Field</span><span>Current value</span><span>Proposed value</span></div>{item.changes.map((change) => <div key={change.field}><strong>{change.field.replaceAll("_", " ")}</strong><code>{formatValue(change.existing)}</code><code>{formatValue(change.proposed)}</code></div>)}</div><div className="cr-card-footer"><DecisionControl id={item.id} decisions={decisions} setDecision={setDecision} />{item.url && <a href={item.url} target="_blank" rel="noreferrer">Open posting ↗</a>}</div></article>)}
        </section>}
      </section>}

      {tab === "needs" && <>
        <section className="cr-section-list"><div className="cr-section-intro"><p className="cr-kicker">Your local flags</p><h2>Jobs marked Needs review</h2><p>These remain ineligible for production until you change their decision to Approved.</p></div>{report.newJobs.filter((job) => decisions[job.id] === "review").map((job) => <NewJobCard key={job.id} job={job} selected={selected} setSelected={setSelected} decisions={decisions} setDecision={setDecision} />)}{!report.newJobs.some((job) => decisions[job.id] === "review") && <p className="cr-no-results">No proposed jobs are locally marked Needs review.</p>}</section>
        <ReviewList title="Classifier and source exceptions" eyebrow="Collector manual review" items={report.manualReview} decisions={decisions} setDecision={setDecision} />
        <ReviewList title="Closed roles seen again" eyebrow="Explicit reopening approval required" items={report.reopening} decisions={decisions} setDecision={setDecision} reopening />
      </>}
      {tab === "rejected" && <RejectedJobs report={report} decisions={decisions} setDecision={setDecision} query={rejectedQuery} setQuery={setRejectedQuery} bucket={rejectedBucket} setBucket={setRejectedBucket} page={rejectedPage} setPage={setRejectedPage} selected={selected} setSelected={setSelected} />}
      {tab === "duplicates" && <ReviewList title="Suppressed duplicate candidates" eyebrow="No insert proposed" items={report.duplicates} decisions={decisions} setDecision={setDecision} />}

      {tab === "failed" && <FailedSources sources={report.sources.filter((source) => !source.success)} />}
      {tab === "sources" && <SourceHealth sources={report.sources} sort={sourceSort} setSort={setSourceSort} />}
      {tab === "ranking" && <RankingDebug items={report.ranking} preview={report.editorialPreview} decisions={decisions} />}
    </main>
  );
}

function RankingDebug({ items, preview, decisions }: { items: RankingItem[]; preview: Report["editorialPreview"]; decisions: DecisionMap }) {
  return <section className="cr-section-list">
    <div className="cr-section-intro"><p className="cr-kicker">Internal editorial model</p><h2>Organic ranking simulation</h2><p>Scores are internal only. Featured, Trending and future sponsored placements remain separate. Daily rotation only changes ordering inside narrow five-point bands.</p></div>
    <div className="cr-editorial-preview"><EditorialPreview title="Featured / BSO Selects" items={preview.featured} /><EditorialPreview title="Trending roles" items={preview.trending} /></div>
    <div className="cr-ranking-weights"><span>Firm <strong>28</strong></span><span>Career path <strong>24</strong></span><span>Rarity <strong>18</strong></span><span>Seniority <strong>12</strong></span><span>Freshness <strong>10</strong></span><span>Exclusive/direct <strong>6</strong></span><span>Canada <strong>2</strong></span></div>
    <div className="cr-ranking-table">
      <div className="header"><span>Rank</span><span>Opportunity</span><span>Path / level</span><span>Score</span><span>Component explanation</span></div>
      {items.map((item) => {
        const localDecision = item.reviewId ? decisions[item.reviewId] : null;
        return <div key={`${item.id}-${item.rank}`}><span className="cr-rank-number">{item.rank}</span><span><strong>{item.company}</strong><b>{item.title}</b><small>{item.location} · {item.reviewState}{localDecision ? ` · Locally ${localDecision}` : ""}</small></span><span>{item.careerPath}<small>{item.seniority}</small></span><span><strong className="cr-score">{item.score}</strong><small>Band {item.band} · Base {item.baseScore}</small></span><span className="cr-component-list"><small>Firm {item.components.firm}/28 · Path {item.components.careerPath}/24 · Rarity {item.components.rarity}/18 · Seniority {item.components.seniority}/12 · Freshness {item.components.freshness}/10 · Signal {item.components.exclusive}/6 · Canada {item.components.location}/2 · Diversity {item.components.diversityAdjustment}</small><em>Ranks highly for: {item.why}.</em></span></div>;
      })}
    </div>
  </section>;
}

function EditorialPreview({ title, items }: { title: string; items: RankingItem[] }) {
  return <section><p className="cr-kicker">Editorial preview</p><h3>{title}</h3><ol>{items.map((item) => <li key={`${title}-${item.id}`}><span>{item.company}</span><strong>{item.title}</strong><small>{item.reviewState}</small></li>)}</ol></section>;
}

function NewJobCard({ job, selected, setSelected, decisions, setDecision, compact = false }: {
  job: NewJob;
  selected: Set<string>;
  setSelected: (value: Set<string> | ((current: Set<string>) => Set<string>)) => void;
  decisions: DecisionMap;
  setDecision: (id: string, value: Decision) => void;
  compact?: boolean;
}) {
  return <article className={`cr-job ${compact ? "compact" : ""} ${decisions[job.id] ?? ""}`}>
    <input className="cr-checkbox" type="checkbox" checked={selected.has(job.id)} aria-label={`Select ${job.title} in ${job.location}`} onChange={(event) => setSelected((current) => { const next = new Set(current); if (event.target.checked) next.add(job.id); else next.delete(job.id); return next; })} />
    <div className="cr-job-main">
      <div className="cr-job-heading"><div><p>{job.company}{job.exclusive && <strong className="cr-exclusive">BSO Exclusive</strong>}</p><h2>{job.title}</h2></div><Confidence value={job.confidence} /></div>
      <div className="cr-tags"><span>{job.careerPath}</span>{job.specialization && <span>{job.specialization}</span>}<span>{job.seniority}</span>{job.programType && <span>{job.programType}</span>}<span>{job.location}</span><span>Posted {formatDate(job.datePosted)}</span></div>
      <dl className="cr-reason"><dt>Why it qualified</dt><dd>{job.reason}</dd></dl>
      <details><summary>View description excerpt and source details</summary><DetailText value={job.description} /><div className="cr-source-grid"><span>Source: {job.source}</span><span>Requisition: {job.requisition}</span><span>Origin: {job.origin}</span></div></details>
      <div className="cr-card-footer"><DecisionControl id={job.id} decisions={decisions} setDecision={setDecision} />{job.url && <a href={job.url} target="_blank" rel="noreferrer">{job.exclusive ? "View BSO exclusive ↗" : "Open original posting ↗"}</a>}</div>
    </div>
  </article>;
}

const rejectionLabels: Record<string, string> = {
  nonCanadian: "Non-Canadian location", notInvestmentBanking: "Outside current BSO scope",
  corporateBanking: "Corporate Banking", markets: "Sales & Trading / Markets", research: "Equity or Credit Research",
  riskCompliance: "Risk / Compliance", technologyData: "Technology / Data", operationsSupport: "Investment Operations / Support",
  accountingFinance: "Fund Accounting / Finance", clientCommercial: "Investor Relations / Client Service",
  esg: "ESG / Sustainable Investing", notFrontOfficeInvestment: "No direct investment responsibilities",
  ambiguous: "Ambiguous mandate", expiredDeadline: "Application deadline passed",
  parsingSourceError: "Parsing / source error", duplicate: "Duplicate",
};

function RejectedJobs({ report, decisions, setDecision, query, setQuery, bucket, setBucket, page, setPage, selected, setSelected }: {
  report: Report; decisions: DecisionMap; setDecision: (id: string, value: Decision) => void;
  query: string; setQuery: (value: string) => void; bucket: string; setBucket: (value: string) => void;
  page: number; setPage: (value: number) => void; selected: Set<string>;
  setSelected: (value: Set<string> | ((current: Set<string>) => Set<string>)) => void;
}) {
  const localRejected = report.newJobs.filter((job) => decisions[job.id] === "reject");
  const buckets = [...new Set(report.rejected.map((item) => item.bucket))].sort();
  const search = query.trim().toLowerCase();
  const filtered = report.rejected.filter((item) => (bucket === "All" || item.bucket === bucket)
    && (!search || `${item.company} ${item.title} ${item.reason} ${item.location}`.toLowerCase().includes(search)));
  const pageSize = 40;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const displayed = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  return <section className="cr-section-list">
    <div className="cr-section-intro"><p className="cr-kicker">Full classifier decision trail</p><h2>Rejected jobs</h2><p>Locally rejected proposals and all role-level exclusions reconstructed from the latest dry run. Results are paginated so the browser does not render thousands of records at once.</p></div>
    <div className="cr-rejection-totals">{Object.entries(report.rejectionTotals).filter(([, count]) => count > 0).map(([key, count]) => <button type="button" className={bucket === key ? "active" : ""} key={key} onClick={() => { setBucket(key); setPage(1); }}><strong>{count}</strong><span>{rejectionLabels[key] ?? key}</span></button>)}</div>
    <div className="cr-rejected-filters"><label><span>Search company, title, reason or location</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search rejected roles…" /></label><label><span>Rejection reason</span><select value={bucket} onChange={(event) => { setBucket(event.target.value); setPage(1); }}><option>All</option>{buckets.map((value) => <option key={value} value={value}>{rejectionLabels[value] ?? value}</option>)}</select></label></div>
    {localRejected.length > 0 && <div className="cr-local-rejected"><h3>Rejected by you</h3>{localRejected.map((job) => <NewJobCard key={job.id} job={job} selected={selected} setSelected={setSelected} decisions={decisions} setDecision={setDecision} compact />)}</div>}
    <div className="cr-pagination"><span>Showing {filtered.length ? (safePage - 1) * pageSize + 1 : 0}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}</span><div><button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>Previous</button><span>Page {safePage} of {pages}</span><button disabled={safePage >= pages} onClick={() => setPage(safePage + 1)}>Next</button></div></div>
    <div className="cr-rejected-list">{displayed.map((item) => <article className="cr-panel" key={item.id}><div className="cr-panel-title"><div><p>{item.company} · {item.location}</p><h3>{item.title}</h3></div><Confidence value={item.confidence} /></div><div className="cr-tags"><span>{item.careerPath}</span><span>{rejectionLabels[item.bucket] ?? item.bucket}</span><span>{item.source}</span></div><dl className="cr-reason flagged"><dt>Why it was rejected</dt><dd>{item.reason}</dd></dl>{item.description && <details><summary>View relevant description excerpt</summary><DetailText value={item.description} /></details>}{item.url && <div className="cr-card-footer"><span></span><a href={item.url} target="_blank" rel="noreferrer">Open original posting ↗</a></div>}</article>)}</div>
    {!displayed.length && <p className="cr-no-results">No rejected jobs match this search.</p>}
  </section>;
}

function FailedSources({ sources }: { sources: SourceItem[] }) {
  return <section className="cr-section-list"><div className="cr-section-intro"><p className="cr-kicker">Retrieval and adapter failures</p><h2>Failed sources</h2><p>These employers could not be reliably scanned. This is separate from a successful scan that found zero qualifying jobs.</p></div><div className="cr-failure-grid">{sources.sort((a, b) => a.company.localeCompare(b.company)).map((source) => <article className="cr-failure-card" key={`${source.company}-${source.source}`}><div className="cr-failure-title"><div><p>{source.failureCategory}</p><h3>{source.company}</h3></div><b className="cr-status failed">Failed</b></div><dl><div><dt>Provider / source type</dt><dd>{source.source} · {source.sourceType}</dd></div><div><dt>Failure</dt><dd>{source.notes}</dd></div><div><dt>HTTP status</dt><dd>{source.httpStatus ?? "Not available"}</dd></div><div><dt>Alternative attempted</dt><dd>{source.alternativeAttempted ? "Yes" : "No"}</dd></div><div><dt>Last attempted</dt><dd>{formatDate(source.lastAttempted)}</dd></div><div><dt>Recommended next action</dt><dd>{source.recommendedAction}</dd></div></dl><div className="cr-card-footer"><span></span>{source.careersUrl && <a href={source.careersUrl} target="_blank" rel="noreferrer">Open careers page ↗</a>}</div></article>)}</div></section>;
}

function SourceHealth({ sources, sort, setSort }: { sources: SourceItem[]; sort: "failed" | "qualifying" | "scanned" | "company"; setSort: (value: "failed" | "qualifying" | "scanned" | "company") => void }) {
  const ordered = [...sources].sort((a, b) => sort === "qualifying" ? b.qualifying - a.qualifying || a.company.localeCompare(b.company) : sort === "scanned" ? b.scanned - a.scanned || a.company.localeCompare(b.company) : sort === "company" ? a.company.localeCompare(b.company) : Number(a.success) - Number(b.success) || a.company.localeCompare(b.company));
  return <section className="cr-section-list"><div className="cr-section-intro source"><div><p className="cr-kicker">All {sources.length} registered firms</p><h2>Source health</h2><p>Successful scans with zero qualifying jobs are explicitly separated from retrieval failures.</p></div><label className="cr-source-sort"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="failed">Failed first</option><option value="qualifying">Most qualifying jobs</option><option value="scanned">Most jobs scanned</option><option value="company">Company alphabetically</option></select></label></div><div className="cr-source-table wide"><div className="header"><span>Status</span><span>Company / source</span><span>Scanned</span><span>Canadian</span><span>Qualified</span><span>Rejected</span><span>Review</span><span>Last success / notes</span></div>{ordered.map((source) => <div key={`${source.company}-${source.source}`}><span><b className={`cr-status ${source.success ? "success" : "failed"}`}>{source.status === "success-zero" ? "Success — zero jobs" : source.success ? "Success" : "Failed"}</b></span><span><strong>{source.company}</strong><small>{source.source} · {source.sourceType}</small>{source.endpoint && <a href={source.endpoint} target="_blank" rel="noreferrer">View source ↗</a>}</span><span>{source.scanned}</span><span>{source.canadian}</span><span>{source.qualifying}</span><span>{source.rejected}</span><span>{source.manualReview}</span><span>{source.lastSuccessful ? formatDate(source.lastSuccessful) : "No successful run in this report"}<small>{source.notes}</small></span></div>)}</div></section>;
}

function ReviewList({ title, eyebrow, items, decisions, setDecision, reopening = false }: { title: string; eyebrow: string; items: ReviewItem[]; decisions: DecisionMap; setDecision: (id: string, value: Decision) => void; reopening?: boolean }) {
  return <section className="cr-section-list"><div className="cr-section-intro"><p className="cr-kicker">{eyebrow}</p><h2>{title}</h2><p>{reopening ? "These records are currently closed. An observed match never reopens them automatically." : "Use the employer excerpt and classifier explanation to make a local decision."}</p></div>{items.map((item) => <article className="cr-panel" key={item.id}><div className="cr-panel-title"><div><p>{item.company} · {item.location}</p><h3>{item.title}</h3></div><Confidence value={item.confidence} /></div><dl className="cr-reason flagged"><dt>{reopening ? "Why it is blocked" : "Why it was flagged"}</dt><dd>{item.reason}</dd></dl>{item.careerPath && <div className="cr-tags"><span>{item.careerPath}</span>{item.seniority && <span>{item.seniority}</span>}</div>}<h4>Description / relevant excerpt</h4><DetailText value={item.description} /><div className="cr-card-footer"><DecisionControl id={item.id} decisions={decisions} setDecision={setDecision} />{item.url && <a href={item.url} target="_blank" rel="noreferrer">Open original posting ↗</a>}</div></article>)}</section>;
}
