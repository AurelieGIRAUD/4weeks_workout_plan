// Short-lived signed tokens that let the service worker act on a reminder
// ("done" / "snooze") without a user session.

const encoder = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function key(): Promise<CryptoKey> {
  const secret = Deno.env.get("REMINDER_TOKEN_SECRET");
  if (!secret) throw new Error("REMINDER_TOKEN_SECRET is not set");
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export interface ReminderClaims {
  u: string; // user id
  t: string; // treatment id
  exp: number; // unix seconds
}

export async function signReminderToken(userId: string, treatmentId: string, ttlDays = 7): Promise<string> {
  const claims: ReminderClaims = { u: userId, t: treatmentId, exp: Math.floor(Date.now() / 1000) + ttlDays * 86400 };
  const body = b64url(encoder.encode(JSON.stringify(claims)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key(), encoder.encode(body)));
  return `${body}.${b64url(sig)}`;
}

export async function verifyReminderToken(token: string): Promise<ReminderClaims | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const ok = await crypto.subtle.verify("HMAC", await key(), fromB64url(sig), encoder.encode(body));
  if (!ok) return null;
  const claims = JSON.parse(new TextDecoder().decode(fromB64url(body))) as ReminderClaims;
  if (typeof claims.exp !== "number" || claims.exp < Date.now() / 1000) return null;
  return claims;
}
