import { brevoBatchIdForScheduledAt, cancelBrevoScheduledEmail, getBrevoScheduledEmailStatus, requiredEmailProviderConfig } from "../lib/email/brevo.mjs";

const args = new Set(process.argv.slice(2));
const cancelMode = args.has("--cancel");
if (cancelMode === args.has("--dry-run")) throw new Error("Pass exactly one of --dry-run or --cancel.");

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const { provider, apiKey } = requiredEmailProviderConfig();
const target = new Date(required("JOB_ALERT_SCHEDULED_AT"));
if (!Number.isFinite(target.getTime())) throw new Error("JOB_ALERT_SCHEDULED_AT must be a valid timestamp.");
const targetIso = target.toISOString();

if (provider === "resend") {
  const headers = { authorization: `Bearer ${apiKey}`, "content-type": "application/json" };
  const emails = [];
  let after = "";
  for (;;) {
    const query = new URLSearchParams({ limit: "100", ...(after ? { after } : {}) });
    const response = await fetch(`https://api.resend.com/emails?${query}`, { headers });
    const result = await response.json();
    if (!response.ok) throw new Error(`Resend fallback list failed with HTTP ${response.status}: ${JSON.stringify(result)}`);
    emails.push(...(result.data ?? []));
    if (!result.has_more || !result.data?.length) break;
    after = result.data.at(-1).id;
  }
  const candidates = emails.filter((email) => email.last_event === "scheduled" && email.scheduled_at && new Date(email.scheduled_at).toISOString() === targetIso);
  console.log(`Resend fallback emails matching ${targetIso}: ${candidates.length}`);
  if (!cancelMode) {
    console.log("Dry run complete. Nothing was cancelled.");
    process.exit(0);
  }
  for (const email of candidates) {
    const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(email.id)}/cancel`, { method: "POST", headers });
    if (!response.ok) throw new Error(`Resend fallback cancellation failed for ${email.id}: HTTP ${response.status}`);
  }
  console.log(`Cancelled through Resend fallback: ${candidates.length}`);
  process.exit(0);
}

const batchId = brevoBatchIdForScheduledAt(targetIso);

const status = await getBrevoScheduledEmailStatus({ apiKey, identifier: batchId });
const queued = (status.batches ?? []).filter((batch) => ["queued", "inProgress"].includes(batch.status));
console.log(`Brevo batch id for ${targetIso}: ${batchId}`);
console.log(`Queued batch entries: ${queued.length}`);
if (!cancelMode) {
  console.log("Dry run complete. Nothing was cancelled.");
  process.exit(0);
}

if (!queued.length) {
  console.log("No queued messages remain for this batch.");
  process.exit(0);
}

await cancelBrevoScheduledEmail({ apiKey, identifier: batchId });
console.log(`Cancelled Brevo batch: ${batchId}`);
