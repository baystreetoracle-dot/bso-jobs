// Employer offer for the private employer page: audience figures and recruiting packages, edited
// in one place. Prices are CAD per role. When checkout is added, each paid package gets its Stripe
// Price ID here and the server — never the browser — picks the price from the package id.

export const EMPLOYER_EMAIL = "info@baystreetoracle.ca";

/**
 * Raw BSO Jobs analytics since launch. The site went live on 2026-09-15, so a "last 30 days"
 * window covers less than 30 days of traffic; the page shows a 30-day run rate instead.
 * Update the totals and `measuredThrough` together.
 */
export const AUDIENCE = {
  launchDate: "2026-09-15",
  measuredThrough: "2026-10-09",
  visitors: 2935,
  pageViews: 8290,
  canadianShare: 90,
} as const;

const DAY_MS = 86_400_000;
/** Days live, counting both the launch day and the last measured day. */
export const DAYS_LIVE = Math.round((Date.parse(AUDIENCE.measuredThrough) - Date.parse(AUDIENCE.launchDate)) / DAY_MS) + 1;
/** Scaled to 30 days and rounded down to the hundred, so the figure never overstates. */
const monthlyRunRate = (total: number) => Math.floor((total * 30) / DAYS_LIVE / 100) * 100;

export const AUDIENCE_METRICS = [
  { value: monthlyRunRate(AUDIENCE.visitors), suffix: "+", label: "Monthly visitors" },
  { value: monthlyRunRate(AUDIENCE.pageViews), suffix: "+", label: "Monthly page views" },
  { value: AUDIENCE.canadianShare, suffix: "%", label: "Canadian audience" },
] as const;

const shortDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-CA", { month: "short", day: "numeric", timeZone: "UTC" });
/** One line under the figures; the raw totals stay in AUDIENCE above. */
export const AUDIENCE_NOTE = `30-day run rate · ${DAYS_LIVE} days since launch (${shortDate(AUDIENCE.launchDate)} – ${shortDate(AUDIENCE.measuredThrough)})`;

export type PackageId = "standard" | "featured" | "hiring-boost" | "recruiting-campaign";

export type EmployerPackage = {
  id: PackageId;
  name: string;
  price: number | null;
  summary: string;
  inherits?: string;
  features: string[];
  cta: string;
  emphasized?: boolean;
};

export const PACKAGES: EmployerPackage[] = [
  {
    id: "standard",
    name: "Standard listing",
    price: null,
    summary: "Your role on the board, linked straight to your application page.",
    features: ["Standard listing on BSO Jobs", "Firm page inclusion where applicable", "Direct link to your application page"],
    cta: "Submit a role",
  },
  {
    id: "featured",
    name: "Featured listing",
    price: 149,
    summary: "Priority visibility for one role for 30 days.",
    features: ["30-day featured placement", "Priority position in job search", "Highlighted employer branding"],
    cta: "Feature this role",
  },
  {
    id: "hiring-boost",
    name: "Hiring boost",
    price: 249,
    summary: "Featured placement plus a BSO Instagram Story.",
    inherits: "Everything in Featured listing",
    features: ["Placement in BSO selects at the top of the job board", "1 BSO Instagram Story promotion", "Basic performance summary"],
    cta: "Launch hiring boost",
    emphasized: true,
  },
  {
    id: "recruiting-campaign",
    name: "Featured recruiting campaign",
    price: 399,
    summary: "A dedicated recruiting push across BSO Instagram and the board.",
    inherits: "Everything in Hiring boost",
    features: ["Dedicated 2–3 frame Instagram Story sequence", "Repeat promotion during the campaign", "Extended featured placement", "Campaign performance summary"],
    cta: "Launch campaign",
  },
];

/** What the server records for each request; the browser never sets the amount. */
export const PACKAGE_AMOUNTS: Record<PackageId | "custom", number | null> = {
  standard: 0,
  featured: 149,
  "hiring-boost": 249,
  "recruiting-campaign": 399,
  custom: null,
};
