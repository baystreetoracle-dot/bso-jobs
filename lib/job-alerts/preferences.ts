export const CAREER_PATHS = [
  "Investment Banking",
  "Corporate Finance",
  "Private Equity",
  "Private Credit",
  "Asset Management",
  "Hedge Funds",
  "Other",
] as const;

export const ALERT_SENIORITIES = [
  "Intern / Co-op",
  "Analyst",
  "Associate",
  "Vice President",
  "Director",
  "Managing Director",
  "Other",
] as const;

export const ALERT_LOCATIONS = ["Toronto", "Calgary", "Montreal", "Vancouver", "Other"] as const;

export type AlertPreferences = {
  careerPaths: string[];
  seniorities: string[];
  locations: string[];
};

export type AlertJobFields = {
  category: string | null;
  seniority: string | null;
  city: string | null;
  location_display?: string | null;
};

const careerPathValues: Record<string, readonly string[]> = {
  "Investment Banking": ["Investment Banking"],
  "Corporate Finance": ["Corporate Finance", "Deal Advisory"],
  "Private Equity": ["Private Equity"],
  "Private Credit": ["Private Credit"],
  "Asset Management": ["Asset Management", "Institutional Investing", "Real Estate Investing"],
  "Hedge Funds": ["Hedge Fund", "Hedge Funds"],
};

const seniorityValues: Record<string, readonly string[]> = {
  "Intern / Co-op": ["Student", "Intern", "Intern / Co-op"],
  Analyst: ["Analyst"],
  Associate: ["Associate"],
  "Vice President": ["Vice President"],
  Director: ["Director"],
  "Managing Director": ["Managing Director"],
};

const knownCategories = new Set(Object.values(careerPathValues).flat());
const knownSeniorities = new Set(Object.values(seniorityValues).flat());
const primaryCities = ALERT_LOCATIONS.filter((location) => location !== "Other");

function matchesMappedValue(value: string | null, selected: string[], mapping: Record<string, readonly string[]>, known: Set<string>) {
  if (!selected.length) return true;
  if (selected.some((choice) => mapping[choice]?.includes(value ?? ""))) return true;
  return selected.includes("Other") && (!value || !known.has(value));
}

export function jobAlertLocations(job: Pick<AlertJobFields, "city" | "location_display">) {
  const searchable = `${job.city ?? ""} ${job.location_display ?? ""}`;
  const matches = primaryCities.filter((city) => {
    const pattern = city === "Montreal" ? /\bmontr[eé]al\b/i : new RegExp(`\\b${city}\\b`, "i");
    return pattern.test(searchable);
  });
  if (matches.length) return matches;
  return ["Other"];
}

export function matchesJobAlertPreferences(job: AlertJobFields, preferences: AlertPreferences) {
  const careerPathMatches = matchesMappedValue(job.category, preferences.careerPaths, careerPathValues, knownCategories);
  const seniorityMatches = matchesMappedValue(job.seniority, preferences.seniorities, seniorityValues, knownSeniorities);
  const jobLocations = jobAlertLocations(job);
  const locationMatches = !preferences.locations.length || preferences.locations.some((location) => jobLocations.includes(location));
  return careerPathMatches && seniorityMatches && locationMatches;
}

export function alertCareerPathForStoredCategory(category: string) {
  return Object.entries(careerPathValues).find(([, values]) => values.includes(category))?.[0] ?? "Other";
}

export function alertSeniorityForStoredValue(seniority: string) {
  return Object.entries(seniorityValues).find(([, values]) => values.includes(seniority))?.[0] ?? "Other";
}
