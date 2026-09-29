import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { classifyAndNormalize } from "./normalize.mjs";

const input = resolve(process.argv[2] ?? "scripts/job-collector/reports/dry-run-2026-09-29T02-31-18-723Z.json");
const output = resolve(process.argv[3] ?? "scripts/job-collector/reports/review-data-2026-09-29T02-31-18-723Z.json");
const report = JSON.parse(readFileSync(input, "utf8"));
const rejected = [];

const shortId = (value) => createHash("sha256").update(value).digest("hex").slice(0, 18);
const excerpt = (value, limit = 900) => {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, limit).trim()}…` : normalized;
};

for (const source of report.sourceReports) {
  if (source.error) continue;
  for (const candidate of source.rawJobs ?? []) {
    try {
      const result = classifyAndNormalize(candidate, source.startedAt);
      if (result.accepted) continue;
      const title = result.review?.title ?? candidate.title ?? "Unknown role";
      const location = result.review?.location ?? (candidate.locations ?? []).join(" / ") ?? "Unknown";
      const url = candidate.applicationUrl ?? candidate.sourceUrl ?? source.endpoint ?? source.firm.careersUrl ?? "";
      rejected.push({
        id: `rejected-${shortId(`${source.firm.key}|${title}|${location}|${url}`)}`,
        company: source.firm.name,
        title,
        location: location || "Location unavailable",
        source: source.firm.provider,
        url,
        careerPath: source.firm.universe === "buy-side" ? (source.firm.careerPath ?? "Buy-side investing") : "Investment Banking",
        reason: result.reason,
        bucket: result.bucket ?? "other",
        confidence: result.confidence ?? null,
        description: excerpt(candidate.description),
      });
    } catch (error) {
      const title = candidate.title ?? "Unknown role";
      rejected.push({
        id: `rejected-${shortId(`${source.firm.key}|${title}|parse`)}`,
        company: source.firm.name,
        title,
        location: (candidate.locations ?? []).join(" / ") || "Location unavailable",
        source: source.firm.provider,
        url: candidate.applicationUrl ?? candidate.sourceUrl ?? "",
        careerPath: source.firm.universe === "buy-side" ? (source.firm.careerPath ?? "Buy-side investing") : "Investment Banking",
        reason: error instanceof Error ? error.message : String(error),
        bucket: "parsingSourceError",
        confidence: null,
        description: excerpt(candidate.description),
      });
    }
  }
}

writeFileSync(output, JSON.stringify({ generatedAt: report.generatedAt, rejected }, null, 2), "utf8");
console.log(`Review rejection data: ${rejected.length} records written to ${output}`);
