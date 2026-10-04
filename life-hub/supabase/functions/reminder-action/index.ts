// Called by the service worker when the user taps "Done" or "Snooze" on a
// reminder notification. Auth is the signed token from the push payload.
import { adminClient, corsHeaders, json } from "../_shared/push.ts";
import { verifyReminderToken } from "../_shared/token.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let body: { token?: string; action?: string; days?: number };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  if (!body.token || (body.action !== "done" && body.action !== "snooze")) {
    return json({ error: "token and action ('done' | 'snooze') are required" }, 400);
  }

  const claims = await verifyReminderToken(body.token);
  if (!claims) return json({ error: "invalid or expired token" }, 401);

  const { data, error } = await adminClient().rpc("apply_reminder_action", {
    p_user_id: claims.u,
    p_treatment_id: claims.t,
    p_action: body.action,
    p_snooze_days: body.days ?? 1,
  });
  if (error) return json({ error: error.message }, 400);
  return json({ result: data });
});
