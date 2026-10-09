// Employer offer for /employers: audience metrics and recruiting packages, edited in one place.
// Prices are CAD per role. When checkout is added, each paid package gets its Stripe Price ID here
// and the server — never the browser — picks the price from the package id.

export const EMPLOYER_EMAIL = "info@baystreetoracle.ca";

/** Audience figures from BSO Jobs analytics. Only publish numbers we can substantiate. */
export const AUDIENCE_METRICS = [
  { value: 2900, suffix: "+", label: "Monthly visitors" },
  { value: 8000, suffix: "+", label: "Monthly page views" },
  { value: 90, suffix: "%", label: "Canadian audience" },
] as const;
export const AUDIENCE_NOTE = "BSO Jobs analytics, trailing 30 days as of October 2026.";

export type EmployerPackage = {
  id: "standard" | "featured" | "hiring-boost" | "recruiting-campaign";
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
    inherits: "Everything in Standard",
    features: ["Featured for 30 days", "Priority placement in relevant searches", "Highlighted listing with a Featured designation", "Enhanced visibility on your firm page"],
    cta: "Feature this role",
  },
  {
    id: "hiring-boost",
    name: "Hiring boost",
    price: 349,
    summary: "Board placement plus distribution to the BSO audience.",
    inherits: "Everything in Featured",
    features: ["Placement in BSO selects on the job board", "BSO social story promotion", "30-day campaign", "Basic campaign analytics"],
    cta: "Launch hiring boost",
    emphasized: true,
  },
  {
    id: "recruiting-campaign",
    name: "Recruiting campaign",
    price: 649,
    summary: "A full campaign across BSO channels, with a results summary.",
    inherits: "Everything in Hiring boost",
    features: ["Dedicated BSO social story sequence", "LinkedIn distribution", "Prominent BSO Jobs placement", "Extended employer visibility", "Post-campaign analytics summary"],
    cta: "Launch campaign",
  },
];

/** Until checkout is live, each package CTA opens a pre-filled email to the BSO team. */
export function packageMailto(pkg: EmployerPackage) {
  const subject = `BSO Jobs: ${pkg.name}`;
  const body = [
    `Package: ${pkg.name}${pkg.price ? ` (C$${pkg.price})` : " (free)"}`,
    "Company:",
    "Contact name:",
    "Role title:",
    "Job posting URL:",
    "Notes:",
  ].join("\n");
  return `mailto:${EMPLOYER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function customCampaignMailto() {
  const body = ["Company:", "Name:", "Roles hiring for:", "Approximate number of positions:", "Target candidate level:", "Recruiting timeline:", "Message:"].join("\n");
  return `mailto:${EMPLOYER_EMAIL}?subject=${encodeURIComponent("BSO Jobs: custom recruiting campaign")}&body=${encodeURIComponent(body)}`;
}
