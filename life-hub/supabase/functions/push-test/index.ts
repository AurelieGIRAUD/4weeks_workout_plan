// Sends a test notification to every device of the signed-in user.
import { adminClient, corsHeaders, json, sendPush, type PushSubscriptionRow } from "../_shared/push.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const jwt = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "unauthorized" }, 401);

  const supabase = adminClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser(jwt);
  if (authErr || !auth.user) return json({ error: "unauthorized" }, 401);

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .eq("user_id", auth.user.id);
  if (error) return json({ error: error.message }, 500);

  const results = await Promise.all(
    ((subs ?? []) as PushSubscriptionRow[]).map((s) =>
      sendPush(supabase, s, {
        title: "🎉 Life Hub notifications work",
        body: "You'll get beauty care reminders here.",
        tag: "life-hub-test",
        url: "/settings",
      })
    ),
  );
  return json({ devices: results.length, sent: results.filter(Boolean).length });
});
