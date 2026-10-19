import crypto from "node:crypto";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export function requiredBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const from = process.env.BREVO_FROM_EMAIL?.trim();
  if (!apiKey) throw new Error("BREVO_API_KEY is required.");
  if (!from) throw new Error("BREVO_FROM_EMAIL is required.");
  return { apiKey, from };
}

export function requiredEmailProviderConfig() {
  const brevoKey = process.env.BREVO_API_KEY?.trim();
  const brevoFrom = process.env.BREVO_FROM_EMAIL?.trim();
  if (brevoKey && brevoFrom) return { provider: "brevo", apiKey: brevoKey, from: brevoFrom };
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (resendKey && resendFrom) return { provider: "resend", apiKey: resendKey, from: resendFrom };
  throw new Error("BREVO_API_KEY and BREVO_FROM_EMAIL are required. RESEND_* is accepted only as a temporary migration fallback.");
}

export function parseEmailAddress(value, fallbackName = "Bay Street Oracle") {
  const match = String(value ?? "").trim().match(/^(.*?)\s*<([^<>]+)>$/);
  if (match) return { name: match[1].trim() || fallbackName, email: match[2].trim() };
  return { name: fallbackName, email: String(value ?? "").trim() };
}

export function brevoBatchIdForScheduledAt(value) {
  const bytes = Buffer.from(crypto.createHash("sha256").update(`bso-job-alerts:${new Date(value).toISOString()}`).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function sendBrevoEmail({ apiKey, from, to, subject, html, text, replyTo, scheduledAt, batchId, tags = [], headers = {} }) {
  const body = {
    sender: parseEmailAddress(from),
    to: to.map((recipient) => typeof recipient === "string" ? { email: recipient } : recipient),
    subject,
    htmlContent: html,
    textContent: text,
    ...(replyTo ? { replyTo: parseEmailAddress(replyTo, "Reply") } : {}),
    ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
    ...(batchId ? { batchId } : {}),
    ...(tags.length ? { tags } : {}),
    ...(Object.keys(headers).length ? { headers } : {}),
  };
  let response;
  let result;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: { accept: "application/json", "api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    result = await response.json().catch(() => ({}));
    if (response.status !== 429 && response.status < 500) break;
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  if (!response.ok) throw new Error(`Brevo returned HTTP ${response.status}: ${JSON.stringify(result)}`);
  return result;
}

export async function sendTransactionalEmail({ provider, apiKey, from, to, subject, html, text, replyTo, scheduledAt, batchId, tags = [], headers = {} }) {
  if (provider === "brevo") return sendBrevoEmail({ apiKey, from, to, subject, html, text, replyTo, scheduledAt, batchId, tags, headers });
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", ...(headers["Idempotency-Key"] ? { "Idempotency-Key": headers["Idempotency-Key"] } : {}) },
    body: JSON.stringify({
      from,
      to: to.map((recipient) => typeof recipient === "string" ? recipient : recipient.email),
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: typeof replyTo === "string" ? replyTo : replyTo.email } : {}),
      ...(scheduledAt ? { scheduled_at: new Date(scheduledAt).toISOString() } : {}),
      ...(tags.length ? { tags: tags.map((tag) => ({ name: "campaign", value: tag.slice(0, 256) })) } : {}),
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Resend fallback returned HTTP ${response.status}: ${JSON.stringify(result)}`);
  return { messageId: result.id };
}

export async function cancelBrevoScheduledEmail({ apiKey, identifier }) {
  const response = await fetch(`${BREVO_ENDPOINT}/${encodeURIComponent(identifier)}`, {
    method: "DELETE",
    headers: { accept: "application/json", "api-key": apiKey },
  });
  if (response.status !== 204) throw new Error(`Brevo cancellation returned HTTP ${response.status}: ${await response.text()}`);
}

export async function getBrevoScheduledEmailStatus({ apiKey, identifier }) {
  const response = await fetch(`${BREVO_ENDPOINT}Status/${encodeURIComponent(identifier)}`, {
    headers: { accept: "application/json", "api-key": apiKey },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Brevo status returned HTTP ${response.status}: ${JSON.stringify(result)}`);
  return result;
}
