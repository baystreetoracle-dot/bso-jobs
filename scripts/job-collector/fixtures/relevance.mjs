// Relevance fixtures from the owner's review of the Nov 16, 2026 dry-run report.
// Titles, locations and team metadata follow the employers' ATS records; hiring-manager names that the ATS
// embeds in team metadata are removed, and descriptions are short abridgements, not full postings.
// IMCO's posting was unreachable while these were written (Workday HTTP 429), so its description is a
// representative abridgement of an IMCO public-credit portfolio role.

import { FIRMS_BY_KEY } from "../sources/firms.mjs";

const firm = (key) => {
  const value = FIRMS_BY_KEY.get(key);
  if (!value) throw new Error(`Fixture firm '${key}' is not in the source registry.`);
  return value;
};

const IB_DESCRIPTION = "Join the investment banking team to execute M&A, equity and debt financings: build financial models and valuations, prepare client materials and support transaction execution.";

export const REJECTED = [
  {
    why: "T&O M&A integration / strategic initiatives, not investment banking",
    firmKey: "bmo",
    title: "Senior Manager, T&O M&A, Strategic Initiatives",
    locations: ["Toronto, Ontario, Canada"],
    metadataText: "Technology 12645 - Senior Manager-PM Business IT Integration",
    description: "Job Family Group: Technology. Senior Manager, M&A Technology Integration. Lead technology and operations integration workstreams for acquisitions, coordinating PMO, change management and transformation planning.",
    expectBucket: "operationsSupport",
  },
  {
    why: "M&A integration at an accounting-firm corporate-finance arm",
    firmKey: "kpmg-cf",
    title: "Manager, M&A Integration",
    locations: ["Toronto, ON, Canada"],
    metadataText: "Advisory",
    description: "Support post-merger integration, operating-model design and day-one readiness for clients completing acquisitions.",
    expectBucket: "operationsSupport",
  },
  {
    why: "Corporate-development support with M&A in the title",
    firmKey: "bmo",
    title: "Director, Corporate Development M&A",
    locations: ["Toronto, Ontario, Canada"],
    metadataText: "Corporate Strategy",
    description: "Support the bank's corporate development and strategy team on acquisitions, divestitures and partnerships.",
    expectBucket: "operationsSupport",
  },
  {
    why: "M&A only in team metadata, and the team is technology",
    firmKey: "bmo",
    title: "Senior Manager, Strategic Initiatives",
    locations: ["Toronto, Ontario, Canada"],
    metadataText: "Technology M&A Integration Office",
    description: "Coordinate integration programs across technology and operations.",
    expectBucket: "operationsSupport",
  },
  {
    why: "Distribution / internal sales",
    firmKey: "bmo",
    title: "Associate, Internal Sales, Intermediary Distribution",
    locations: ["Toronto, Ontario, Canada"],
    metadataText: "Asset Management Sales & Service 102202 - Specialist I-IC Intermediary Sales",
    description: "Job Family Group: Asset Mgmt Sales & Service. Support advisors and wholesalers in the intermediary channel.",
    expectBucket: "clientCommercial",
  },
  {
    why: "Fundraising at a sell-side firm, title only",
    firmKey: "bmo",
    title: "Vice President, Fundraising - Private Funds Group",
    locations: ["Toronto, Ontario, Canada"],
    metadataText: "Capital Market Sales & Service",
    description: IB_DESCRIPTION,
    expectBucket: "clientCommercial",
  },
  {
    why: "Capital formation at a buy-side firm with strong investing language in the description",
    firmKey: "ci-financial",
    title: "Associate, Capital Formation",
    locations: ["Toronto, ON, Canada"],
    metadataText: "Investments",
    description: "Partner with portfolio managers on private equity and private credit products; prepare due diligence materials, investment committee summaries and valuation support for limited partners.",
    expectBucket: "clientCommercial",
  },
  {
    why: "Investor relations at a pension fund",
    firmKey: "imco",
    title: "Analyst, Investor Relations",
    locations: ["Toronto, ON, Canada"],
    metadataText: "Client Relations",
    description: "Support client reporting and portfolio management communications; prepare materials on asset allocation and investment performance.",
    expectBucket: "clientCommercial",
  },
  {
    why: "Fundraising only in team metadata",
    firmKey: "ci-financial",
    title: "Associate, Private Markets",
    locations: ["Toronto, ON, Canada"],
    metadataText: "Fundraising & Investor Partnerships",
    description: "Support private equity due diligence materials and investment committee preparation for limited partners.",
    expectBucket: "clientCommercial",
  },
  {
    why: "Capital raising for a fund, with no investment-banking title evidence",
    firmKey: "ci-financial",
    title: "Director, Capital Raising - Alternatives",
    locations: ["Toronto, ON, Canada"],
    metadataText: "",
    description: "Lead capital raising for private credit and private equity funds; investment thesis and portfolio construction knowledge required.",
    expectBucket: "clientCommercial",
  },
];

export const KEPT = [
  {
    firmKey: "bmo",
    title: "BMO Capital Markets New Grad 2027 Investment Banking Analyst, Montreal",
    locations: ["Montreal, Quebec, Canada"],
    metadataText: "Capital Market Sales & Service 130005 - CM Analyst-IC Investment Banking I",
    description: `Application Deadline: 11/22/2026. Job Family Group: Capital Mrkts Sales & Service. ${IB_DESCRIPTION}`,
    employmentType: "Full time",
    expectCategory: "Investment Banking",
  },
  {
    firmKey: "bmo",
    title: "Vice President, Investment Banking - Metals and Mining",
    locations: ["Toronto, Ontario, Canada"],
    metadataText: "Capital Market Sales & Service IB Metals & Mining Toronto 130003 - CM VP-IC Investment Banking I",
    description: `Application Deadline: 01/30/2027. Job Family Group: Capital Mrkts Sales & Service. ${IB_DESCRIPTION}`,
    employmentType: "Full time",
    expectCategory: "Investment Banking",
  },
  {
    firmKey: "kpmg-cf",
    title: "Senior Manager, Turnaround & Restructuring",
    locations: ["Toronto, ON, Canada"],
    metadataText: "Advisory",
    description: "Lead restructuring and turnaround engagements for lenders and companies in financial distress, including refinancing, M&A and insolvency advisory.",
    expectCategory: "Investment Banking",
  },
  {
    firmKey: "ey-parthenon-cf",
    title: "Analyst or Associate, M&A (Calgary or Edmonton)",
    locations: ["Calgary, AB, Canada", "Edmonton, AB, Canada"],
    metadataText: "",
    description: "Support sell-side and buy-side M&A mandates, financial modelling, valuation and transaction execution for EY-Parthenon Corporate Finance.",
    expectCategory: "Investment Banking",
  },
  {
    why: "EY's practice name contains 'Strategy and Transactions'; that is not operational context",
    firmKey: "ey-parthenon-cf",
    title: "Analyst or Associate, M&A (Calgary or Edmonton)",
    locations: ["Calgary, AB, Canada"],
    metadataText: "Strategy and Transactions",
    description: "Support sell-side and buy-side M&A mandates for EY-Parthenon Corporate Finance.",
    expectCategory: "Investment Banking",
  },
  {
    firmKey: "fort-capital",
    title: "Investment Banking Analyst",
    locations: ["Vancouver, BC, Canada"],
    metadataText: "",
    description: "Fort Capital describes these openings as investment banking analyst roles. Investment Banking Analyst, Vancouver.",
    expectCategory: "Investment Banking",
  },
  {
    firmKey: "imco",
    title: "Associate Portfolio Manager, Public Credit",
    locations: ["Toronto, ON, Canada"],
    metadataText: "Investments",
    description: "Support the public credit portfolio: credit research, security selection, relative value analysis and portfolio construction, and make investment recommendations to the portfolio management team.",
    employmentType: "Full time",
  },
  {
    firmKey: "ci-financial",
    title: "Investment Analyst",
    locations: ["Toronto, ON, Canada"],
    metadataText: "",
    description: "Conduct fundamental research on companies, build financial models and valuations, and present investment recommendations to the portfolio managers of CI Global Asset Management.",
    employmentType: "Full time",
  },
];

export function toCandidate(fixture, index = 0) {
  return {
    firm: firm(fixture.firmKey),
    externalId: `fixture-${index}`,
    title: fixture.title,
    locations: fixture.locations,
    description: fixture.description,
    metadataText: fixture.metadataText,
    applicationUrl: `https://example.invalid/${fixture.firmKey}/${index}`,
    sourceUrl: `https://example.invalid/${fixture.firmKey}/${index}`,
    datePosted: null,
    applicationDeadline: null,
    employmentType: fixture.employmentType ?? null,
  };
}
