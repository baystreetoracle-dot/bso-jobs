const args = new Set(process.argv.slice(2));
const cancelMode = args.has("--cancel");
if (cancelMode === args.has("--dry-run")) throw new Error("Pass exactly one of --dry-run or --cancel.");

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const apiKey = required("RESEND_API_KEY");
const target = new Date(required("JOB_ALERT_SCHEDULED_AT"));
if (!Number.isFinite(target.getTime())) throw new Error("JOB_ALERT_SCHEDULED_AT must be a valid timestamp.");
const targetIso = target.toISOString();
const headers = { authorization: `Bearer ${apiKey}`, "content-type": "application/json" };

async function listEmails() {
  const emails = [];
  let after = "";
  for (;;) {
    const query = new URLSearchParams({ limit: "100", ...(after ? { after } : {}) });
    const response = await fetch(`https://api.resend.com/emails?${query}`, { headers });
    const result = await response.json();
    if (!response.ok) throw new Error(`Resend list failed with HTTP ${response.status}: ${JSON.stringify(result)}`);
    emails.push(...(result.data ?? []));
    if (!result.has_more || !result.data?.length) return emails;
    after = result.data.at(-1).id;
  }
}

function matchingScheduled(emails) {
  return emails.filter((email) => email.last_event === "scheduled"
    && email.scheduled_at && new Date(email.scheduled_at).toISOString() === targetIso);
}

const candidates = matchingScheduled(await listEmails());
console.log(`Scheduled emails matching ${targetIso}: ${candidates.length}`);
if (!cancelMode) {
  console.log("Dry run complete. Nothing was cancelled.");
  process.exit(0);
}

let cancelled = 0;
const failures = [];
for (const email of candidates) {
  let response;
  let result;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(email.id)}/cancel`, { method: "POST", headers });
    result = await response.json();
    if (response.status !== 429) break;
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  if (response.ok) cancelled += 1;
  else failures.push({ id: email.id, status: response.status, error: result });
  await new Promise((resolve) => setTimeout(resolve, 150));
}

console.log(`Cancelled: ${cancelled}`);
if (failures.length) {
  console.error(`Cancellation failures: ${failures.length}`);
  for (const failure of failures) console.error(JSON.stringify(failure));
}
const remaining = matchingScheduled(await listEmails());
console.log(`Still scheduled for ${targetIso}: ${remaining.length}`);
if (failures.length || remaining.length) process.exitCode = 1;
