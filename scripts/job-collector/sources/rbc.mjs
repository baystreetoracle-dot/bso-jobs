const RBC_BASE_URL = "https://jobs.rbc.com";
const RBC_SEARCH_URL = `${RBC_BASE_URL}/ca/en/search-results`;
const RBC_WIDGETS_URL = `${RBC_BASE_URL}/widgets`;
const PAGE_SIZE = 20;
const MAX_RESULTS = 500;

const HEADERS = {
  "accept-language": "en-CA,en;q=0.9",
  "user-agent": "BSO-Jobs-Collector/1.0 (+https://baystreetoracle.ca)",
};

function cookieHeader(response) {
  const values = response.headers.getSetCookie?.() ?? [];
  return values.map((value) => value.split(";", 1)[0]).join("; ");
}

function extractCsrfToken(html) {
  return html.match(/csrfToken["':\s]+([a-f0-9]{32})/i)?.[1] ?? null;
}

function searchPayload(offset) {
  return {
    lang: "en_ca",
    deviceType: "desktop",
    country: "ca",
    sortBy: "",
    subsearch: "",
    keywords: "",
    jobs: true,
    counts: true,
    global: true,
    all_fields: [
      "category",
      "subCategory",
      "platform",
      "careerLevel",
      "type",
      "jobType",
      "country",
      "state",
      "city",
    ],
    pageName: "search-results",
    pageType: "default",
    pageId: "page35-ds",
    siteType: "external",
    clearAll: false,
    jdsource: "facets",
    isSliderEnable: false,
    selected_fields: {
      country: ["Canada"],
      platform: ["CAPITAL MARKETS"],
    },
    refNum: "RBCAA0088",
    ddoKey: "refineSearch",
    from: offset,
    size: PAGE_SIZE,
  };
}

function jobSlug(title) {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function detailUrl(job) {
  if (!job.jobSeqNo || !job.title) {
    throw new Error(`RBC result is missing jobSeqNo or title (${job.jobId ?? "unknown ID"}).`);
  }
  return `${RBC_BASE_URL}/ca/en/job/${encodeURIComponent(job.jobSeqNo)}/${jobSlug(job.title)}`;
}

function extractJobDetail(html, url) {
  const match = html.match(/phApp\.ddo\s*=\s*(\{[\s\S]*?\});\s*phApp\.experimentData/);
  if (!match) throw new Error(`RBC job detail JSON was not found at ${url}.`);

  let ddo;
  try {
    ddo = JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`RBC job detail JSON could not be parsed at ${url}.`, { cause: error });
  }

  const job = ddo?.jobDetail?.data?.job;
  if (!job?.jobId || !job?.title) {
    throw new Error(`RBC job detail was incomplete at ${url}.`);
  }
  return job;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}.`);
  return response.json();
}

async function mapWithConcurrency(items, concurrency, mapper) {
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

export async function fetchRbcCapitalMarketsCanada() {
  const warmupResponse = await fetch(RBC_SEARCH_URL, { headers: HEADERS });
  if (!warmupResponse.ok) {
    throw new Error(`RBC careers warmup returned HTTP ${warmupResponse.status}.`);
  }
  const warmupHtml = await warmupResponse.text();
  const csrfToken = extractCsrfToken(warmupHtml);
  const cookies = cookieHeader(warmupResponse);
  const requestHeaders = {
    ...HEADERS,
    "content-type": "application/json",
    origin: RBC_BASE_URL,
    referer: RBC_SEARCH_URL,
    ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
    ...(cookies ? { cookie: cookies } : {}),
  };

  const listings = new Map();
  let expectedTotal = null;

  for (let offset = 0; offset < MAX_RESULTS; offset += PAGE_SIZE) {
    const response = await fetchJson(RBC_WIDGETS_URL, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(searchPayload(offset)),
    });
    const block = response?.refineSearch;
    const page = block?.data?.jobs;
    const total = Number(block?.totalHits);

    if (!Array.isArray(page) || !Number.isFinite(total)) {
      throw new Error(`RBC search response was incomplete at offset ${offset}.`);
    }
    expectedTotal ??= total;
    if (total !== expectedTotal) {
      throw new Error(`RBC result count changed during pagination (${expectedTotal} to ${total}).`);
    }
    if (page.length === 0 && listings.size < expectedTotal) {
      throw new Error(`RBC pagination ended early at ${listings.size} of ${expectedTotal} jobs.`);
    }

    for (const job of page) {
      const id = job.jobId ?? job.reqId;
      if (!id) throw new Error("RBC returned a listing without a stable job ID.");
      listings.set(id, job);
    }

    if (listings.size >= expectedTotal) break;
  }

  if (expectedTotal === null || listings.size !== expectedTotal) {
    throw new Error(`RBC scan was partial: received ${listings.size} of ${expectedTotal ?? "unknown"} jobs.`);
  }

  const listingValues = [...listings.values()];
  const details = await mapWithConcurrency(listingValues, 4, async (listing) => {
    const url = detailUrl(listing);
    const response = await fetch(url, { headers: HEADERS });
    if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}.`);
    const detail = extractJobDetail(await response.text(), url);
    if (detail.jobId !== (listing.jobId ?? listing.reqId)) {
      throw new Error(`RBC detail ID mismatch at ${url}.`);
    }
    return { listing, detail, sourceUrl: url };
  });

  return {
    searchUrl: RBC_SEARCH_URL,
    endpoint: RBC_WIDGETS_URL,
    jobs: details,
  };
}
