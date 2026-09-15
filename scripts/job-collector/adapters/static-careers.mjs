import { extractJsonLdJobs, fetchText, plainText, stableUrlId } from "./shared.mjs";

const ROLE_HEADING = /\b(?:investment banking|corporate finance|M\s*&\s*A|mergers?\s+(?:&|and)\s+acquisitions?|capital markets|deal advisory|transaction advisory|analyst|associate|vice president|director|managing director|intern|co-?op|student)\b/i;
const GENERIC_HEADING = /^(?:careers?|current (?:openings|opportunities|positions)|opportunities|join (?:us|our team)|apply(?: now)?|students?(?: and graduates)?|experienced professionals?)$/i;

function locationsFrom(text, fallback) {
  const matches = [...String(text).matchAll(/\b(Toronto|Calgary|Vancouver|Montr[eé]al|Ottawa|Winnipeg|Halifax|Edmonton|Qu[eé]bec City|Kitchener|Waterloo|Victoria|Regina|Saskatoon)(?:\s*,\s*(ON|AB|BC|QC|MB|NS|Ontario|Alberta|British Columbia|Qu[eé]bec|Manitoba|Nova Scotia))?(?:\s*,\s*(?:CA|Canada))?\b/gi)];
  const locations = [...new Set(matches.map((match) => [match[1], match[2], "Canada"].filter(Boolean).join(", ")))];
  return locations.length ? locations : [fallback ?? ""];
}

function candidatesFromHeadings(html, sourceUrl, firm, config) {
  const candidates = [];
  const sourcePath = new URL(sourceUrl).pathname;
  if (!/(?:career|opportunit|position|join|job)/i.test(sourcePath) && !config.allowHomeRoleParsing) return candidates;
  const headings = [...html.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)];
  for (const [index, match] of headings.entries()) {
    const title = plainText(match[1]);
    if (!title || title.length > 180 || GENERIC_HEADING.test(title) || config.skipHeadingPattern?.test(title) || !(config.roleHeadingPattern ?? ROLE_HEADING).test(title)) continue;
    // Bound the extraction to this heading's block. A large proximity window can
    // accidentally borrow a Canadian city from the next role or country section.
    const blockEnd = headings[index + 1]?.index ?? html.length;
    const block = html.slice(match.index, blockEnd);
    const context = plainText(block);
    if (/\b(?:position|role|opening)\s+(?:is\s+)?(?:now\s+)?closed\b|\bnow closed\b/i.test(context)) continue;
    const href = block.match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
    let applicationUrl = sourceUrl;
    try { if (href) applicationUrl = new URL(href.replace(/&amp;/g, "&"), sourceUrl).href; } catch { /* Keep the official page URL. */ }
    const identityUrl = href ? applicationUrl : `${sourceUrl}#role-${encodeURIComponent(title.toLowerCase().replace(/\s+/g, "-").slice(0, 100))}`;
    candidates.push({
      firm,
      externalId: stableUrlId(identityUrl),
      title,
      locations: locationsFrom(context, config.defaultLocation),
      description: `${config.contextText ?? ""} ${context}`.trim(),
      metadataText: config.metadataText ?? "",
      applicationUrl,
      sourceUrl: identityUrl,
      employmentType: null,
    });
  }
  return candidates;
}

function candidatesFromRoleLinks(html, sourceUrl, firm, config) {
  const candidates = [];
  for (const match of html.matchAll(/<a\b([^>]*)href\s*=\s*["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi)) {
    let title = plainText(match[4]);
    if (!title || title.length > 180 || GENERIC_HEADING.test(title) || !(config.roleLinkPattern ?? ROLE_HEADING).test(title)) continue;
    let applicationUrl;
    try { applicationUrl = new URL(match[2].replace(/&amp;/g, "&"), sourceUrl).href; } catch { continue; }
    if (!/^https?:/i.test(applicationUrl) || /linkedin\.com/i.test(applicationUrl)) continue;
    const context = plainText(html.slice(Math.max(0, match.index - 1800), Math.min(html.length, match.index + match[0].length + 1800)));
    if (/\b(?:position|role|opening)\s+(?:is\s+)?(?:now\s+)?closed\b|\bnow closed\b/i.test(context)) continue;
    const documentRole = title.match(/\b(Toronto|Calgary|Vancouver|Montr[eé]al)\s+(Summer|Winter|Fall)\s+Analyst\b/i);
    let roleLocations = locationsFrom(`${title} ${context}`, config.defaultLocation);
    if (documentRole) {
      const year = context.match(new RegExp(`${documentRole[2]}\\s+(20\\d{2})`, "i"))?.[1];
      title = `Investment Banking ${documentRole[2]} Analyst${year ? ` - ${documentRole[2]} ${year}` : ""}`;
      roleLocations = [`${documentRole[1]}, Canada`];
    }
    candidates.push({
      firm,
      externalId: stableUrlId(applicationUrl),
      title,
      locations: roleLocations,
      description: `${config.contextText ?? ""} ${context}`.trim(),
      metadataText: config.metadataText ?? "",
      applicationUrl,
      sourceUrl: applicationUrl,
      employmentType: null,
    });
  }
  return candidates;
}

export async function fetchStaticCareers(config, firm) {
  const jobs = [];
  for (const sourceUrl of config.pageUrls) {
    const html = await fetchText(sourceUrl);
    jobs.push(...extractJsonLdJobs(html, sourceUrl, firm));
    jobs.push(...candidatesFromHeadings(html, sourceUrl, firm, config));
    jobs.push(...candidatesFromRoleLinks(html, sourceUrl, firm, config));
  }
  const unique = new Map(jobs.map((job) => [`${job.externalId}:${job.sourceUrl}`, job]));
  return { endpoint: config.pageUrls.join(", "), jobs: [...unique.values()] };
}
