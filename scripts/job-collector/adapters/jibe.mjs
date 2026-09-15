import { fetchJson, plainText } from "./shared.mjs";

export async function fetchJibe(config, firm) {
  const url = new URL("/api/jobs", config.host);
  for (const [key, value] of Object.entries(config.query ?? {})) url.searchParams.set(key, value);
  // Jibe localizes/filter results from Accept-Language; this board only serves
  // its public job records for the configured en-US locale.
  const requestOptions = { headers: { "accept-language": config.locale ?? "en-US,en;q=0.9" } };
  const payload = await fetchJson(url.href, requestOptions);
  const firstRows = Array.isArray(payload.jobs) ? payload.jobs : [];
  const total = Number(payload.totalCount ?? firstRows.length);
  const pageSize = firstRows.length || 10;
  const pages = Math.ceil(total / pageSize);
  if (pages > (config.maxPages ?? 100)) throw new Error(`Jibe advertised ${pages} pages; refusing an unexpectedly large scan.`);
  const rows = [...firstRows];
  for (let page = 2; page <= pages; page += 1) {
    const pageUrl = new URL(url);
    pageUrl.searchParams.set("page", String(page));
    const next = await fetchJson(pageUrl.href, requestOptions);
    rows.push(...(Array.isArray(next.jobs) ? next.jobs : []));
  }
  const uniqueRows = [...new Map(rows.map((row) => [String((row.data ?? row).req_id ?? (row.data ?? row).slug), row])).values()];
  if (uniqueRows.length !== total) throw new Error(`Jibe returned ${uniqueRows.length} unique jobs of ${total}; refusing a partial scan.`);
  const jobs = uniqueRows.map((row) => {
    const data = row.data ?? row;
    const externalId = String(data.req_id ?? data.slug);
    const sourceUrl = new URL(`/jobs/${data.slug}?lang=${data.language ?? "en-us"}`, config.host).href;
    return {
      firm, externalId, title: plainText(data.title),
      locations: [plainText(data.location_name ?? data.location ?? "").replace(/^[A-Z0-9]+-(?=[A-Za-zÀ-ÿ])/i, "")],
      description: plainText(data.description),
      metadataText: plainText((data.categories ?? []).map((item) => item.name ?? item).join(" ")),
      applicationUrl: sourceUrl, sourceUrl,
      datePosted: data.posted_date ?? null, applicationDeadline: null,
      employmentType: data.employment_type ?? null,
    };
  });
  return { endpoint: url.href, jobs };
}
