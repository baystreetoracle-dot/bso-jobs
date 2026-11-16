import assert from "node:assert/strict";
import { test } from "node:test";
import { KEPT, REJECTED, toCandidate } from "./fixtures/relevance.mjs";
import { classifyAndNormalize } from "./normalize.mjs";

const VERIFIED_AT = "2026-11-16T11:00:00.000Z";

for (const [index, fixture] of REJECTED.entries()) {
  test(`rejects: ${fixture.title} (${fixture.why})`, () => {
    const result = classifyAndNormalize(toCandidate(fixture, index), VERIFIED_AT);
    assert.equal(result.accepted, false, `qualified with reason: ${result.reason}`);
    assert.equal(result.bucket, fixture.expectBucket);
    assert.equal(result.plausible, false, "owner-rejected roles must not land in manual review");
  });
}

for (const [index, fixture] of KEPT.entries()) {
  test(`keeps: ${fixture.title}${fixture.why ? ` (${fixture.why})` : ""}`, () => {
    const result = classifyAndNormalize(toCandidate(fixture, index), VERIFIED_AT);
    assert.equal(result.accepted, true, `rejected as ${result.bucket}: ${result.reason}`);
    if (fixture.expectCategory) assert.equal(result.job.category, fixture.expectCategory);
  });
}
