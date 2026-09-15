import { fetchJson, fetchResponse, mapWithConcurrency, plainText } from "./shared.mjs";

function cookieHeader(response) {
  return (response.headers.getSetCookie?.() ?? []).map((value) => value.split(";", 1)[0]).join("; ");
}

function slug(title) {
  return title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function fetchPhenom(config, firm) {
  const warmup = await fetchResponse(config.searchUrl);
  const html = await warmup.text();
  const csrfToken = html.match(/csrfToken["':\s]+([a-f0-9]{32})/i)?.[1];
  const refNum = config.refNum ?? html.match(/"refNum":"([^"]+)"/)?.[1];
  const pageId = config.pageId ?? html.match(/"pageId":"([^"]+)"/)?.[1];
  if (!refNum || !pageId) throw new Error(`${firm.name} Phenom configuration was not found.`);
  const headers = {
    "content-type": "application/json",
    origin: config.baseUrl,
    referer: config.searchUrl,
    ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
    ...(cookieHeader(warmup) ? { cookie: cookieHeader(warmup) } : {}),
  };
  const listings = new Map();
  let expectedTotal = null;
  for (let offset = 0; offset < 1000; offset += 20) {
    const response = await fetchJson(`${config.baseUrl}/widgets`, {
      method: "POST", headers,
      body: JSON.stringify({
        lang: config.locale ?? "en_ca", deviceType: "desktop", country: "ca", sortBy: "", subsearch: "", keywords: "",
        jobs: true, counts: true, global: true,
        all_fields: ["category", "subCategory", "platform", "careerLevel", "type", "jobType", "country", "state", "city"],
        pageName: "search-results", pageType: "default", pageId, siteType: "external", clearAll: false,
        jdsource: "facets", isSliderEnable: false, selected_fields: { country: ["Canada"], ...(config.selectedFields ?? {}) },
        refNum, ddoKey: "refineSearch", from: offset, size: 20,
      }),
    });
    const block = response.refineSearch;
    const page = block?.data?.jobs;
    const total = Number(block?.totalHits);
    if (!Array.isArray(page) || !Number.isFinite(total)) throw new Error(`${firm.name} Phenom search response was incomplete at offset ${offset}.`);
    expectedTotal ??= total;
    if (total !== expectedTotal) throw new Error(`${firm.name} result count changed during pagination.`);
    for (const job of page) {
      const id = job.jobId ?? job.reqId;
      if (!id) throw new Error(`${firm.name} returned a listing without a stable ID.`);
      listings.set(id, job);
    }
    if (listings.size >= total) break;
  }
  if (listings.size !== expectedTotal) throw new Error(`${firm.name} scan was partial: ${listings.size}/${expectedTotal}.`);
  const jobs = await mapWithConcurrency([...listings.values()], 5, async (listing) => {
    const sourceUrl = `${config.baseUrl}/ca/en/job/${encodeURIComponent(listing.jobSeqNo)}/${slug(listing.title)}`;
    const detailHtml = await (await fetchResponse(sourceUrl)).text();
    const raw = detailHtml.match(/phApp\.ddo\s*=\s*(\{[\s\S]*?\});\s*phApp\.experimentData/)?.[1];
    if (!raw) throw new Error(`${firm.name} detail JSON was missing at ${sourceUrl}.`);
    const detail = JSON.parse(raw)?.jobDetail?.data?.job;
    if (!detail?.title) throw new Error(`${firm.name} detail was incomplete at ${sourceUrl}.`);
    const multi = Array.isArray(detail.multi_location) ? detail.multi_location : [];
    const locations = multi.map((value) => [value.city, value.state, value.country].filter(Boolean).join(", "));
    return {
      firm,
      externalId: String(detail.jobId ?? detail.reqId ?? listing.jobId ?? listing.reqId),
      title: plainText(detail.title), locations: locations.length ? locations : [detail.locationName ?? listing.location],
      description: plainText(detail.description ?? detail.structureData?.description),
      metadataText: plainText([detail.platform, detail.category, detail.costCenter, detail.supervisoryOrganization, detail.jobProfile].filter(Boolean).join(" ")),
      applicationUrl: detail.applyUrl ?? listing.applyUrl ?? sourceUrl, sourceUrl,
      datePosted: detail.structureData?.datePosted ?? listing.postedDate ?? null,
      applicationDeadline: detail.postingEndDate ?? null, employmentType: detail.type ?? detail.workerSubType ?? null,
    };
  });
  return { endpoint: `${config.baseUrl}/widgets`, jobs };
}
