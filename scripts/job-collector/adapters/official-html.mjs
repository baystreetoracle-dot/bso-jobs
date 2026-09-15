import { extractJsonLdJobs, fetchText, mapWithConcurrency, plainText, stableUrlId } from "./shared.mjs";

function linksFromHtml(html, pageUrl, linkPattern) {
  const links = new Set();
  for (const match of html.matchAll(/href\s*=\s*["']([^"'#]+)["']/gi)) {
    let url;
    try {
      url = new URL(match[1].replace(/&amp;/g, "&"), pageUrl).href;
    } catch {
      continue;
    }
    if (linkPattern.test(url)) links.add(url);
    linkPattern.lastIndex = 0;
  }
  return [...links];
}

function fallbackCandidate(html, sourceUrl, firm) {
  const title = plainText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
  const body = plainText(html);
  if (!title || body.length < 100 || !/job|career|vacanc|opportunit/i.test(body) || /^(?:search (?:jobs|vacancies)|careers?|job search|vacancies)$/i.test(title)) return null;
  const externalId = body.match(/(?:requisition|job(?: number| id)?|reference)\s*(?:id|number|#|:)?\s*([A-Z]*[-_]?[0-9]{4,})/i)?.[1] ?? stableUrlId(sourceUrl);
  const location = body.match(/\b(?:Toronto|Calgary|Vancouver|Montr[eé]al|Ottawa|Winnipeg|Halifax|Edmonton|Qu[eé]bec City)(?:\s*,\s*(?:ON|AB|BC|QC|MB|NS|Ontario|Alberta|British Columbia|Qu[eé]bec|Manitoba|Nova Scotia))?(?:\s*,\s*Canada)?\b/i)?.[0]
    ?? body.match(/(?:location|city)\s*:?\s*([^|\n]{0,100}\bCanada\b)/i)?.[1]
    ?? "";
  return {
    firm, externalId, title, locations: [location],
    description: body, metadataText: "", applicationUrl: sourceUrl, sourceUrl,
    datePosted: null, applicationDeadline: null, employmentType: null,
  };
}

export async function fetchOfficialHtml(config, firm) {
  const searchUrls = config.searchUrls ?? [config.searchUrl];
  const detailLinks = new Set();
  const inlineJobs = [];
  for (const searchUrl of searchUrls) {
    const html = await fetchText(searchUrl);
    inlineJobs.push(...extractJsonLdJobs(html, searchUrl, firm));
    for (const link of linksFromHtml(html, searchUrl, config.linkPattern)) detailLinks.add(link);
  }
  const details = await mapWithConcurrency([...detailLinks].slice(0, config.maxDetails ?? 300), 5, async (sourceUrl) => {
    const html = await fetchText(sourceUrl);
    return extractJsonLdJobs(html, sourceUrl, firm)[0] ?? fallbackCandidate(html, sourceUrl, firm);
  });
  const jobs = [...inlineJobs, ...details.filter(Boolean)];
  const unique = new Map(jobs.map((job) => [`${job.externalId}:${job.sourceUrl}`, job]));
  if (unique.size === 0 && config.allowZero !== true) {
    throw new Error("No public job records could be extracted; refusing to report a complete scan.");
  }
  return { endpoint: searchUrls.join(", "), jobs: [...unique.values()] };
}
