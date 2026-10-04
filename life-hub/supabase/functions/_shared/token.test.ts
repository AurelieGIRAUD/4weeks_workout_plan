// deno test --allow-env supabase/functions/_shared/token.test.ts
import { assert, assertEquals } from "jsr:@std/assert@1";
import { signReminderToken, verifyReminderToken } from "./token.ts";

Deno.env.set("REMINDER_TOKEN_SECRET", "test-secret");

Deno.test("round-trips a token", async () => {
  const token = await signReminderToken("user-1", "treatment-1");
  const claims = await verifyReminderToken(token);
  assertEquals(claims?.u, "user-1");
  assertEquals(claims?.t, "treatment-1");
});

Deno.test("rejects tampered, expired and garbage tokens", async () => {
  const token = await signReminderToken("user-1", "treatment-1");
  const [body, sig] = token.split(".");
  const forged = btoa(JSON.stringify({ u: "user-2", t: "treatment-1", exp: 9999999999 }))
    .replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  assertEquals(await verifyReminderToken(`${forged}.${sig}`), null);
  assertEquals(await verifyReminderToken(`${body}.AAAA`), null);
  assertEquals(await verifyReminderToken("not-a-token"), null);
  assertEquals(await verifyReminderToken("!!!.???"), null);
  assertEquals(await verifyReminderToken(await signReminderToken("u", "t", -1)), null);
});

Deno.test("a different secret does not verify", async () => {
  const token = await signReminderToken("user-1", "treatment-1");
  Deno.env.set("REMINDER_TOKEN_SECRET", "other-secret");
  assert((await verifyReminderToken(token)) === null);
  Deno.env.set("REMINDER_TOKEN_SECRET", "test-secret");
});
