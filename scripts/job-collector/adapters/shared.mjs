import { createHash } from "node:crypto";

export const HEADERS = {
  "accept-language": "en-CA,en;q=0.9",
  "user-agent": "BSO-Jobs-Collector/1.0 (+https://baystreetoracle.ca)",
};

export async function fetchResponse(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...HEADERS, ...options.headers },
    signal: AbortSignal.timeout(options.timeoutMs ?? 30000),
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}.`);
  return response;
}

export async function fetchJson(url, options = {}) {
  return (await fetchResponse(url, options)).json();
}

export async function fetchText(url, options = {}) {
  return (await fetchResponse(url, options)).text();
}

export async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

export function decodeHtml(value = "") {
  return String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

export function plainText(value = "") {
  return decodeHtml(String(value))
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stableUrlId(url) {
  return `url-${createHash("sha256").update(url).digest("hex").slice(0, 20)}`;
}

export function isCanadianText(value = "") {
  return /\bCanada\b|\b(?:Toronto|Calgary|Vancouver|Montr[eé]al|Ottawa|Halifax|Edmonton|Winnipeg|Qu[eé]bec|Waterloo|Mississauga|Markham|Victoria|Regina|Saskatoon)\b|\b(?:ON|QC|BC|AB|NS|NB|NL|PE|MB|SK)\b/i.test(String(value));
}

export function splitLocation(value = "") {
  const source = plainText(value);
  const city = source.match(/\b(Toronto|Calgary|Vancouver|Montr[eé]al|Ottawa|Halifax|Edmonton|Winnipeg|Qu[eé]bec|Waterloo|Mississauga|Markham|Victoria|Regina|Saskatoon)\b/i)?.[1] ?? null;
  const province = source.match(/\b(Ontario|Quebec|Qu[eé]bec|British Columbia|Alberta|Nova Scotia|New Brunswick|Newfoundland(?: and Labrador)?|Prince Edward Island|Manitoba|Saskatchewan|ON|QC|BC|AB|NS|NB|NL|PE|MB|SK)\b/i)?.[1] ?? null;
  return { display: source || "Canada", city, province, country: isCanadianText(source) ? "Canada" : null };
}

export function candidateFromJsonLd(value, sourceUrl, firm) {
  const locationValues = Array.isArray(value.jobLocation) ? value.jobLocation : [value.jobLocation].filter(Boolean);
  const locations = locationValues.map((item) => {
    const address = item?.address ?? item;
    return [address?.addressLocality, address?.addressRegion, address?.addressCountry]
      .filter(Boolean).join(", ");
  }).filter(Boolean);
  const identifier = typeof value.identifier === "object" ? value.identifier?.value : value.identifier;
  return {
    firm,
    externalId: String(identifier ?? stableUrlId(sourceUrl)),
    title: plainText(value.title),
    locations,
    description: plainText(value.description),
    metadataText: plainText([value.industry, value.occupationalCategory, value.hiringOrganization?.name].filter(Boolean).join(" ")),
    applicationUrl: value.url ?? sourceUrl,
    sourceUrl,
    datePosted: value.datePosted ?? null,
    applicationDeadline: value.validThrough ?? null,
    employmentType: Array.isArray(value.employmentType) ? value.employmentType.join(", ") : value.employmentType ?? null,
  };
}

export function extractJsonLdJobs(html, sourceUrl, firm) {
  const jobs = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1]).trim());
      const queue = Array.isArray(parsed) ? parsed : [parsed];
      while (queue.length) {
        const value = queue.shift();
        if (!value || typeof value !== "object") continue;
        if (value["@graph"]) queue.push(...value["@graph"]);
        if (value["@type"] === "JobPosting" && value.title) jobs.push(candidateFromJsonLd(value, sourceUrl, firm));
      }
    } catch {
      // Some career sites emit non-JSON analytics in ld+json blocks; ignore those blocks.
    }
  }
  return jobs;
}
