export type RankableJob = {
  id?: string;
  external_job_id: string;
  company_name: string;
  title: string;
  location_display: string;
  country?: string | null;
  category: string;
  seniority: string;
  date_posted?: string | null;
  application_deadline?: string | null;
  source_name?: string | null;
  data_quality_notes?: string | null;
  origin?: string | null;
  exclusive?: boolean;
};

export type RankingComponents = {
  firm: number;
  careerPath: number;
  rarity: number;
  seniority: number;
  freshness: number;
  exclusive: number;
  location: number;
  diversityAdjustment: number;
};

export type RankedJob<T extends RankableJob = RankableJob> = {
  job: T;
  rank: number;
  score: number;
  baseScore: number;
  band: number;
  rotation: number;
  components: RankingComponents;
  why: string;
};

export const RANKING_WEIGHTS = {
  firm: 28,
  careerPath: 24,
  rarity: 18,
  seniority: 12,
  freshness: 10,
  exclusive: 6,
  location: 2,
} as const;

const normalize = (value = "") => value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();

const FIRM_PRIORITY = new Map<string, number>();
function firms(score: number, values: string[]) {
  for (const value of values) FIRM_PRIORITY.set(normalize(value), score);
}

firms(28, ["Brookfield Asset Management", "Onex", "Altas Partners", "Goldman Sachs", "J.P. Morgan", "JPMorgan", "Evercore", "Point72", "Citadel"]);
firms(27, ["Birch Hill Equity Partners", "Clairvest", "Northleaf Capital", "Novacap", "StepStone Group", "Rothschild & Co.", "Mizuho / Greenhill", "Morgan Stanley", "Bank of America", "Balyasny Asset Management"]);
firms(26, ["CPP Investments", "Ontario Teachers' Pension Plan", "Ontario Teachers’ Pension Plan", "PSP Investments", "BCI", "La Caisse", "CDPQ", "OMERS", "AIMCo", "HOOPP", "OPTrust", "IMCO", "Macquarie", "Jefferies", "UBS", "Barclays", "Citi"]);
firms(25, ["RBC Capital Markets", "TD Securities", "BMO Capital Markets", "CIBC Capital Markets", "Scotiabank Global Banking and Markets", "Scotiabank Global Banking & Markets", "National Bank Capital Markets", "National Bank Financial Markets", "Polar Asset Management", "Waratah Advisors", "Turtle Creek Asset Management", "Maple Rock Capital Partners", "Sprott", "Picton Mahoney Asset Management", "Catalyst Capital Group"]);
firms(24, ["TorQuest Partners", "Imperial Capital", "Peloton Capital Management", "Kensington Capital Partners", "TriWest Capital Partners", "Ironbridge Equity Partners", "ONCAP", "BNP Paribas", "Société Générale"]);
firms(24, ["Anson Funds"]);
firms(22, ["EdgePoint Investment Group"]);
firms(18, ["Peakhill Capital"]);
firms(21, ["Agentis Capital", "Agentis Capital Advisors", "Canaccord Genuity", "Stifel Canada", "Raymond James Ltd.", "ATB Cormark Capital Markets", "ATB Capital Markets", "INFOR Financial", "Origin Merchant Partners", "Peters & Co.", "Bloom Burton"]);
firms(13, ["Deloitte Corporate Finance", "KPMG Corporate Finance", "PwC Corporate Finance / Deals", "EY-Parthenon Corporate Finance", "EY Corporate Finance", "BDO Canada", "MNP Corporate Finance", "RSM Canada", "Doane Grant Thornton"]);

const PATH_SCORES: Record<string, number> = {
  "Private Equity": 24,
  "Hedge Fund": 23,
  "Private Credit": 21,
  "Institutional Investing": 20,
  "Investment Banking": 20,
  "Asset Management": 17,
  "Real Estate Investing": 16,
  "Corporate Finance": 10,
  "Deal Advisory": 10,
};

const RARITY_BASE: Record<string, number> = {
  "Private Equity": 16,
  "Hedge Fund": 16,
  "Private Credit": 14,
  "Institutional Investing": 13,
  "Asset Management": 11,
  "Real Estate Investing": 10,
  "Investment Banking": 9,
  "Corporate Finance": 5,
  "Deal Advisory": 5,
};

const SENIORITY_SCORES: Record<string, number> = {
  Student: 12,
  Intern: 12,
  "Intern / Co-op": 12,
  Analyst: 12,
  Associate: 11,
  "Vice President": 7,
  Director: 4,
  "Managing Director": 2,
  "Executive / Group Head": 1,
  Unspecified: 5,
};

function normalizedSeniority(value: string) {
  if (/student|co-?op|intern/i.test(value)) return "Intern / Co-op";
  if (/analyst/i.test(value)) return "Analyst";
  if (/associate/i.test(value)) return "Associate";
  if (/vice president|\bvp\b/i.test(value)) return "Vice President";
  if (/managing director/i.test(value)) return "Managing Director";
  if (/group head|executive/i.test(value)) return "Executive / Group Head";
  if (/director/i.test(value)) return "Director";
  return "Unspecified";
}

function daysSince(value: string | null | undefined, today: string) {
  if (!value) return null;
  const difference = new Date(`${today}T12:00:00Z`).getTime() - new Date(`${value.slice(0, 10)}T12:00:00Z`).getTime();
  return Math.max(0, Math.floor(difference / 86_400_000));
}

function freshnessScore(value: string | null | undefined, today: string) {
  const days = daysSince(value, today);
  if (days === null) return 2;
  if (days <= 2) return 10;
  if (days <= 7) return 7;
  if (days <= 14) return 4;
  if (days <= 30) return 2;
  return 0;
}

function exclusiveScore(job: RankableJob) {
  const source = `${job.source_name ?? ""} ${job.data_quality_notes ?? ""} ${job.origin ?? ""}`;
  if (job.exclusive || /BSO Exclusive/i.test(source)) return 6;
  if (/employer|greenhouse|workday|public careers|official/i.test(source) && !/linkedin/i.test(source)) return 2;
  if (/curated workbook.*company careers/i.test(source)) return 1;
  return 0;
}

function locationScore(job: RankableJob) {
  const location = `${job.location_display} ${job.country ?? ""}`;
  if (!/Canada|\b(?:ON|QC|BC|AB|NS|NB|MB|SK|NL|PE)\b/i.test(location)) return 0;
  return /Toronto|Calgary|Vancouver|Montr[eé]al/i.test(location) ? 2 : 1;
}

function stableRotation(job: RankableJob, today: string) {
  const seed = `${today}|${job.company_name}|${job.external_job_id}|${job.title}`;
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4_294_967_295;
}

function explanation(components: RankingComponents) {
  const labels: Array<[string, number]> = [
    ["firm/platform strength", components.firm],
    ["career-path relevance", components.careerPath],
    ["role scarcity", components.rarity],
    ["BSO audience fit", components.seniority],
    ["freshness", components.freshness],
    ["exclusive/direct employer signal", components.exclusive],
  ];
  return labels.sort((left, right) => right[1] - left[1]).slice(0, 3).map(([label]) => label).join(", ");
}

function initialScore<T extends RankableJob>(job: T, today: string, companyCounts: Map<string, number>): RankedJob<T> {
  const company = normalize(job.company_name);
  const companyCount = companyCounts.get(company) ?? 1;
  const rarityInventoryAdjustment = companyCount === 1 ? 2 : companyCount <= 3 ? 1 : companyCount >= 8 ? -2 : companyCount >= 5 ? -1 : 0;
  const components: RankingComponents = {
    firm: FIRM_PRIORITY.get(company) ?? 16,
    careerPath: PATH_SCORES[job.category] ?? 12,
    rarity: Math.max(0, Math.min(18, (RARITY_BASE[job.category] ?? 8) + rarityInventoryAdjustment)),
    seniority: SENIORITY_SCORES[normalizedSeniority(job.seniority)] ?? 5,
    freshness: freshnessScore(job.date_posted, today),
    exclusive: exclusiveScore(job),
    location: locationScore(job),
    diversityAdjustment: 0,
  };
  const baseScore = Object.values(components).reduce((sum, value) => sum + value, 0);
  return {
    job,
    rank: 0,
    score: baseScore,
    baseScore,
    band: Math.floor(baseScore / 5) * 5,
    rotation: stableRotation(job, today),
    components,
    why: explanation(components),
  };
}

export function rankJobs<T extends RankableJob>(jobs: T[], options: { today: string; diversity?: boolean } ): RankedJob<T>[] {
  const companyCounts = new Map<string, number>();
  for (const job of jobs) {
    const company = normalize(job.company_name);
    companyCounts.set(company, (companyCounts.get(company) ?? 0) + 1);
  }
  const candidates = jobs.map((job) => initialScore(job, options.today, companyCounts));
  const bands = new Map<number, RankedJob<T>[]>();
  for (const candidate of candidates) {
    const band = bands.get(candidate.band) ?? [];
    band.push(candidate);
    bands.set(candidate.band, band);
  }
  const ordered: RankedJob<T>[] = [];
  for (const bandNumber of [...bands.keys()].sort((left, right) => right - left)) {
    const remaining = [...(bands.get(bandNumber) ?? [])];
    while (remaining.length) {
      const recentCategories = ordered.slice(-8).map((item) => item.job.category);
      for (const candidate of remaining) {
        const repeats = recentCategories.filter((category) => category === candidate.job.category).length;
        candidate.components.diversityAdjustment = options.diversity === false ? 0 : -Math.min(4, Math.max(0, repeats - 1) * 1.5);
        candidate.score = Math.round((candidate.baseScore + candidate.components.diversityAdjustment) * 10) / 10;
      }
      remaining.sort((left, right) => right.score - left.score || right.rotation - left.rotation || left.job.company_name.localeCompare(right.job.company_name) || left.job.title.localeCompare(right.job.title));
      ordered.push(remaining.shift()!);
    }
  }
  return ordered.map((item, index) => ({ ...item, rank: index + 1 }));
}
