import { fetchJson, isCanadianText, mapWithConcurrency, plainText } from "./shared.mjs";

async function fetchBoard(config, firm) {
  const base = `${config.host}/wday/cxs/${config.tenant}/${config.site}`;
  const summaries = new Map();
  for (const searchText of ["Canada", "Toronto", "Calgary", "Vancouver", "Montreal"]) {
    let offset = 0;
    let total = 0;
    do {
      const data = await fetchJson(`${base}/jobs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ appliedFacets: {}, limit: 20, offset, searchText }),
      });
      const page = data.jobPostings;
      total = Number(data.total);
      if (!Array.isArray(page) || !Number.isFinite(total)) throw new Error(`${firm.name} Workday search returned an incomplete page.`);
      for (const job of page) {
        if (job.externalPath && isCanadianText(`${job.locationsText} ${job.bulletFields?.join(" ") ?? ""}`)) summaries.set(job.externalPath, job);
      }
      offset += page.length;
      if (!page.length) break;
    } while (offset < total && offset < 1000);
  }

  return mapWithConcurrency([...summaries.entries()], 5, async ([externalPath, summary]) => {
    const data = await fetchJson(`${base}${externalPath}`);
    const detail = data.jobPostingInfo;
    if (!detail?.title) throw new Error(`${firm.name} Workday detail was incomplete: ${externalPath}`);
    const locations = [detail.location, ...(detail.additionalLocations ?? [])].filter(Boolean);
    return {
      firm,
      externalId: String(detail.jobReqId ?? summary.bulletFields?.[0] ?? externalPath),
      title: plainText(detail.title),
      locations,
      description: plainText(detail.jobDescription),
      metadataText: plainText([detail.jobFamily, detail.jobType, detail.timeType].filter(Boolean).join(" ")),
      applicationUrl: detail.externalUrl ?? `${config.host}/${config.site}${externalPath}`,
      sourceUrl: `${config.host}/${config.site}${externalPath}`,
      datePosted: detail.startDate ?? null,
      applicationDeadline: detail.endDate ?? null,
      employmentType: detail.timeType ?? detail.jobType ?? null,
    };
  });
}

export async function fetchWorkday(config, firm) {
  const boards = config.boards ?? [config];
  const settled = await Promise.allSettled(boards.map((board) => fetchBoard(board, firm)));
  const jobs = settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  if (!jobs.length && settled.every((result) => result.status === "rejected")) throw settled[0].reason;
  return { endpoint: boards.map((board) => `${board.host}/wday/cxs/${board.tenant}/${board.site}/jobs`).join(", "), jobs };
}
