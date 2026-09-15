import { isCanadianText, plainText, splitLocation, stableUrlId } from "./adapters/shared.mjs";

const IB_TITLE = /\b(?:global\s+)?investment bank(?:ing|er)?\b|\bmergers?\s*(?:&|and)\s*acquisitions?\b|\bm\s*&\s*a\b|\bfinancial sponsors?\b|\bleveraged finance\b|\bsyndicated\s*(?:&|and)\s*leveraged finance\b|\bequity capital markets?\b|\bdebt capital markets?\b|\brestructuring\b|\bproject finance advisory\b|\binfrastructure advisory\b|\breal estate investment banking\b/i;
const IB_METADATA = /\b(?:global\s+investment\s+banking|investment\s+banking|IBD|GIB|M&A|mergers?\s+(?:and|&)\s+acquisitions?|financial\s+sponsors?|leveraged\s+finance|equity\s+capital\s+markets?|debt\s+capital\s+markets?|restructuring|project\s+finance\s+advisory|infrastructure\s+advisory|global advisory)\b/i;
const IB_DESCRIPTION = /\b(?:role|position|opportunity|candidate|you)\b[^.]{0,120}\b(?:within|join|part of|member of|support(?:ing)?)\b[^.]{0,100}\b(?:global\s+)?investment banking\s+(?:division|team|group|program|department|coverage|product)|\b(?:global\s+)?investment banking\s+(?:division|team|group|program|department|coverage group|product group)\b[^.]{0,180}\b(?:seeking|hiring|role|position|opportunity)|\bas part of\b[^.]{0,80}\b(?:global\s+)?investment banking\b/i;
const PLAUSIBLE_IB = /\b(?:M&A|mergers?|acquisitions?|capital raising|financial advisory|strategic advisory|underwriting|sponsor coverage|project finance|infrastructure finance|syndicat(?:ed|ion)|leveraged finance|equity capital markets?|debt capital markets?)\b/i;

const REJECTION_RULES = [
  ["corporateBanking", /\b(?:corporate banking|commercial banking|corporate lending|relationship manager)\b/i, "Corporate or commercial banking role."],
  ["markets", /\b(?:sales\s*(?:&|and)\s*trading|global markets|trader|trading|market making|fixed income sales|equity sales)\b/i, "Markets, sales or trading role."],
  ["research", /\b(?:equity research|credit research|investment research|global research|research analyst)\b/i, "Research role."],
  ["riskCompliance", /\b(?:risk|compliance|audit|control(?:s)?|KYC|financial crime|surveillance)\b/i, "Risk, compliance, audit or controls role."],
  ["technologyData", /\b(?:technology|developer|engineer|engineering|data|software|programmer|architect|quantitative analytics?|AI|machine learning|cyber)\b/i, "Technology, engineering or data role."],
  ["operationsSupport", /\b(?:operations?|ops|administrative|executive assistant|administrative assistant|law clerk|business management|program manager|project manager|support|CRM|client success|settlement|payment|middle office|back office|quality assurance|COO group)\b/i, "Operations, administration or support role."],
  ["notInvestmentBanking", /\b(?:wealth management|asset management|principal investments?|private banking|fund accounting|accountant|payroll|tax(?: law)?|treasury|legal counsel)\b/i, "Excluded non-Investment-Banking function."],
];

const PROVINCE_CODES = new Map([
  ["ontario", "ON"], ["quebec", "QC"], ["québec", "QC"], ["british columbia", "BC"],
  ["alberta", "AB"], ["nova scotia", "NS"], ["new brunswick", "NB"], ["manitoba", "MB"],
  ["saskatchewan", "SK"], ["newfoundland and labrador", "NL"], ["prince edward island", "PE"],
]);

function canonical(candidate) {
  if (!candidate.detail) return candidate;
  const { listing, detail, sourceUrl } = candidate;
  const multi = Array.isArray(detail.multi_location) ? detail.multi_location : [];
  return {
    firm: candidate.firm,
    externalId: String(detail.jobId ?? detail.reqId ?? listing.jobId ?? listing.reqId ?? stableUrlId(sourceUrl)),
    title: plainText(detail.title ?? listing.title),
    locations: multi.length ? multi.map((value) => [value.city, value.state, value.country].filter(Boolean).join(", ")) : [detail.locationName ?? listing.location],
    description: plainText(detail.description ?? detail.structureData?.description),
    metadataText: plainText([detail.platform, detail.category, detail.costCenter, detail.supervisoryOrganization, detail.jobProfile].filter(Boolean).join(" ")),
    applicationUrl: detail.applyUrl ?? listing.applyUrl ?? sourceUrl,
    sourceUrl,
    datePosted: detail.structureData?.datePosted ?? listing.postedDate ?? null,
    applicationDeadline: detail.postingEndDate ?? null,
    employmentType: detail.type ?? detail.workerSubType ?? null,
  };
}

function requiredYears(description) {
  const values = [...description.matchAll(/(?:minimum(?: of)?|at least|requires?|required)[^.]{0,50}?(\d{1,2})\+?\s+years?|\b(\d{1,2})\+?\s+years?[^.]{0,35}\brequired\b/gi)].map((match) => Number(match[1] ?? match[2]));
  return values.length ? Math.max(...values) : null;
}

function inferSeniority(title, description, metadataText) {
  const titleLevels = [
    ["Executive / Group Head", /\b(?:global |group |co-)?head\b|\bchief\b/i],
    ["Managing Director", /\bmanaging director\b/i], ["Director", /\b(?:executive|associate)?\s*director\b/i],
    ["Vice President", /\bvice[- ]president\b|\bVP\b/i], ["Associate", /\b(?:senior\s+)?associate\b/i],
    ["Analyst", /\banalyst\b|\bnew grad(?:uate)?\b|\brecent grad(?:uate)?\b/i],
    ["Intern", /\bintern(?:ship)?\b/i], ["Student", /\bstudent\b|\bco-?op\b/i],
  ];
  const titleMatch = titleLevels.find(([, pattern]) => pattern.test(title));
  if (titleMatch) return { value: titleMatch[0], note: null };
  const roleText = `${description} ${metadataText}`;
  for (const [value, pattern] of titleLevels) {
    if (new RegExp(`\\b(?:seeking|hiring|role|position)\\b[^.]{0,50}${pattern.source}`, "i").test(roleText)) return { value, note: "Seniority inferred from explicit role-description language." };
  }
  const years = requiredYears(description);
  if (years !== null) {
    if (years >= 10) return { value: "Director", note: `Seniority inferred from a ${years}-year experience requirement.` };
    if (years >= 6) return { value: "Vice President", note: `Seniority inferred from a ${years}-year experience requirement.` };
    if (years >= 3) return { value: "Associate", note: `Seniority inferred from a ${years}-year experience requirement.` };
    return { value: "Analyst", note: `Seniority inferred from a ${years}-year experience requirement.` };
  }
  return { value: "Unspecified", note: "Seniority could not be determined; manual review required." };
}

function inferProgramType(title, employmentType, description) {
  const source = `${title} ${employmentType ?? ""}`;
  if (/\bco-?op\b/i.test(source)) return "Co-op";
  if (/\b(?:new|recent) grad(?:uate)?\b|\bgraduate program\b/i.test(source)) return "New Graduate Program";
  if (/\b(?:intern|internship|summer|winter|fall)\b/i.test(source)) return "Internship";
  if (/\bcontract|fixed term|temporary\b/i.test(source)) return "Contract";
  if (/\bfull[ -]?time|regular|permanent\b/i.test(`${source} ${description.slice(0, 1000)}`)) return "Full-time";
  return "Unspecified";
}

function inferSpecialization(source) {
  const values = [
    ["Mergers & Acquisitions", /\bM&A\b|mergers?\s*(?:&|and)\s*acquisitions?/i],
    ["Leveraged Finance", /leveraged finance|syndicated\s*(?:&|and)\s*leveraged/i],
    ["Equity Capital Markets", /equity capital markets?|\bECM\b/i], ["Debt Capital Markets", /debt capital markets?|\bDCM\b/i],
    ["Financial Sponsors", /financial sponsors?/i], ["Restructuring", /restructuring/i],
    ["Infrastructure / Project Finance", /infrastructure|project finance/i],
    ["Real Estate", /real estate|property brokerage/i], ["Mining & Metals", /mining|metals/i],
  ];
  return values.find(([, pattern]) => pattern.test(source))?.[0] ?? null;
}

function normalizeLocation(locations) {
  const canadian = locations.map(splitLocation).filter((location) => location.country === "Canada");
  const displays = [...new Set(canadian.map((location) => location.display))];
  const first = canadian[0];
  return {
    location_display: displays.join(" / ") || "Canada",
    city: canadian.length === 1 ? first.city : null,
    province: canadian.length === 1 ? (PROVINCE_CODES.get(first.province?.toLowerCase()) ?? first.province) : null,
    country: "Canada",
  };
}

export function classifyAndNormalize(candidateInput, verifiedAt) {
  const candidate = canonical(candidateInput);
  const title = plainText(candidate.title);
  const description = plainText(candidate.description);
  const metadataText = plainText(candidate.metadataText);
  const locationText = (candidate.locations ?? []).join(" / ");
  const review = { firm: candidate.firm.name, title, location: locationText || "Unknown" };
  if (!isCanadianText(locationText)) return { accepted: false, bucket: "nonCanadian", reason: "No physical Canadian location in structured source data.", review };

  const titleSignal = IB_TITLE.test(title);
  const corporateFinanceSignal = candidate.firm.includeCorporateFinance
    && /\b(?:corporate finance|M\s*&\s*A|mergers?\s+(?:&|and)\s+acquisitions?|deal advisory)\b/i.test(title)
    && /\b(?:M\s*&\s*A|mergers?|acquisitions?|divestitures?|capital raising|transaction advisory|investment banking)\b/i.test(`${title} ${description} ${metadataText}`);
  const purePlaySignal = candidate.firm.purePlayInvestmentBank
    && /\b(?:analyst|associate|vice president|director|managing director|intern|co-?op|student)\b/i.test(title);
  const metadataSignal = IB_METADATA.test(metadataText);
  const descriptionSignal = IB_DESCRIPTION.test(description);
  const directSignal = titleSignal || corporateFinanceSignal || purePlaySignal || metadataSignal || descriptionSignal;
  for (const [bucket, pattern, reason] of REJECTION_RULES) {
    let titleConflict = pattern.test(title);
    if (titleSignal && bucket === "technologyData" && !/\b(?:developer|engineer|engineering|data scientist|software|programmer|architect|quantitative analytics?|AI|machine learning|cyber)\b/i.test(title)) {
      titleConflict = false;
    }
    if (titleSignal && bucket === "operationsSupport" && !/\b(?:operations?|ops|administrative|executive assistant|administrative assistant|business management|program manager|project manager|client support|CRM|settlement|payment|middle office|back office|quality assurance|COO group)\b/i.test(title)) {
      titleConflict = false;
    }
    if (titleConflict) {
      return { accepted: false, bucket, reason, review, plausible: PLAUSIBLE_IB.test(`${title} ${metadataText}`) };
    }
  }
  if (!titleSignal) {
    for (const [bucket, pattern, reason] of REJECTION_RULES) {
      if (pattern.test(metadataText)) {
        return { accepted: false, bucket, reason, review, plausible: PLAUSIBLE_IB.test(`${title} ${metadataText}`) };
      }
    }
  }
  if (!directSignal) return { accepted: false, bucket: "notInvestmentBanking", reason: "No role-specific Investment Banking evidence.", review, plausible: PLAUSIBLE_IB.test(`${title} ${metadataText}`) };

  const seniority = inferSeniority(title, description, metadataText);
  const evidence = titleSignal
    ? "title"
    : corporateFinanceSignal
      ? "Corporate Finance title plus M&A/advisory context"
      : purePlaySignal
        ? "role title plus the firm's dedicated Investment Banking mandate"
        : metadataSignal
          ? "team/platform metadata"
          : "description text";
  const reason = `Role-specific Investment Banking evidence found in ${evidence}.`;
  const sourceId = String(candidate.externalId ?? stableUrlId(candidate.sourceUrl));
  const reviewFlags = [
    ...(evidence === "description text" ? ["Investment Banking classification depends primarily on description text."] : []),
    ...(seniority.value === "Unspecified" ? [seniority.note] : []),
  ];
  return {
    accepted: true, reason, reviewFlags,
    job: {
      external_job_id: sourceId, company_id: candidate.firm.key, company_name: candidate.firm.name, title,
      ...normalizeLocation(candidate.locations ?? []), category: "Investment Banking",
      specialization: inferSpecialization(`${title} ${metadataText}`), seniority: seniority.value,
      employment_type: candidate.employmentType ?? null,
      program_type: inferProgramType(title, candidate.employmentType, description),
      date_posted: candidate.datePosted ?? null, application_deadline: candidate.applicationDeadline ?? null,
      application_url: candidate.applicationUrl ?? candidate.sourceUrl, source_url: candidate.sourceUrl,
      source_name: `${candidate.firm.name} public careers site`, source_record_id: `${candidate.firm.key}:${sourceId}`,
      summary: description.slice(0, 500) || null, data_quality_notes: [reason, seniority.note].filter(Boolean).join(" "),
      status: "active", last_verified_at: verifiedAt, updated_at: verifiedAt,
    },
  };
}
