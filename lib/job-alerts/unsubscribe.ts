import { createHmac, timingSafeEqual } from "node:crypto";

function normalizedEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createUnsubscribeToken(email: string, secret: string) {
  return createHmac("sha256", secret).update(`bso-job-alerts:${normalizedEmail(email)}`).digest("hex");
}

export function isValidUnsubscribeToken(email: string, token: string, secret: string) {
  const expected = createUnsubscribeToken(email, secret);
  if (!/^[a-f0-9]{64}$/i.test(token)) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(token, "hex"));
}

export function createUnsubscribeUrl(email: string, secret: string, siteUrl: string) {
  const url = new URL("/api/job-alerts/unsubscribe", siteUrl);
  url.searchParams.set("email", normalizedEmail(email));
  url.searchParams.set("token", createUnsubscribeToken(email, secret));
  return url.toString();
}
