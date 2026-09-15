import { fetchJson } from "./shared.mjs";

const ENDPOINT = "https://api-higher.gs.com/gateway/api/v1/graphql";
const QUERY = `
  query GetRoles($searchQueryInput: RoleSearchQueryInput!) {
    roleSearch(searchQueryInput: $searchQueryInput) {
      totalCount
      items {
        roleId
        corporateTitle
        jobTitle
        jobFunction
        locations { primary state country city }
        status
        division
        skills
        jobType { code description }
        externalSource { sourceId }
      }
    }
  }
`;

export async function fetchGoldman(_config, firm) {
  const jobs = [];
  let pageNumber = 0;
  let totalCount = Infinity;
  const pageSize = 100;
  while (pageNumber * pageSize < totalCount) {
    const payload = await fetchJson(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", "x-higher-request-id": crypto.randomUUID() },
      body: JSON.stringify({
        operationName: "GetRoles",
        query: QUERY,
        variables: {
          searchQueryInput: {
            page: { pageSize, pageNumber },
            filters: [],
            experiences: ["CAMPUS", "EARLY_CAREER", "PROFESSIONAL"],
            searchTerm: "",
          },
        },
      }),
    });
    if (payload.errors?.length) throw new Error(payload.errors.map((error) => error.message).join("; "));
    const result = payload.data?.roleSearch;
    if (!result || !Array.isArray(result.items)) throw new Error("Goldman roleSearch response did not contain an items array.");
    totalCount = result.totalCount;
    for (const item of result.items) {
      if (!(item.locations ?? []).some((location) => /canada/i.test(location.country ?? ""))) continue;
      const externalId = String(item.externalSource?.sourceId ?? item.roleId);
      const sourceUrl = `https://higher.gs.com/roles/${externalId}`;
      jobs.push({
        firm,
        externalId,
        title: item.jobTitle,
        locations: (item.locations ?? []).map((location) => [location.city, location.state, location.country].filter(Boolean).join(", ")),
        description: "",
        metadataText: [item.corporateTitle, item.jobFunction, item.division, ...(item.skills ?? [])].filter(Boolean).join(" "),
        applicationUrl: sourceUrl,
        sourceUrl,
        employmentType: item.jobType?.description ?? null,
      });
    }
    pageNumber += 1;
  }
  return { endpoint: ENDPOINT, jobs, rawCount: totalCount };
}
