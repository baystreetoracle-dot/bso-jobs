export type RecruitingUpdate = { label: string; note: string };

export const recruitingUpdates: Record<string, RecruitingUpdate> = {
  "24194": {
    label: "First rounds underway",
    note: "Confirmed by a verified anonymous source: Applications are no longer being accepted and first-round interviews are underway.",
  },
};

export function getRecruitingUpdate(externalJobId: string | null | undefined) {
  return externalJobId ? recruitingUpdates[externalJobId] ?? null : null;
}
