// Hourly (pg_cron): send a push for every beauty treatment that is due.
import { adminClient, json, sendPush, type PushSubscriptionRow } from "../_shared/push.ts";
import { signReminderToken } from "../_shared/token.ts";

interface DueRow {
  user_id: string;
  treatment_id: string;
  name: string;
  emoji: string;
  effective_due: string;
  local_today: string;
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("Authorization") !== `Bearer ${secret}`) {
    return json({ error: "unauthorized" }, 401);
  }

  const supabase = adminClient();
  const { data: due, error } = await supabase.rpc("due_reminders");
  if (error) return json({ error: error.message }, 500);
  const rows = (due ?? []) as DueRow[];
  if (rows.length === 0) return json({ due: 0, sent: 0 });

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: subs, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);
  if (subErr) return json({ error: subErr.message }, 500);

  const actionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/reminder-action`;
  const reminded: string[] = [];
  let sent = 0;

  for (const row of rows) {
    const targets = (subs ?? []).filter((s) => s.user_id === row.user_id) as PushSubscriptionRow[];
    const overdue = daysBetween(row.effective_due, row.local_today);
    const token = await signReminderToken(row.user_id, row.treatment_id);
    const payload = {
      title: `${row.emoji} ${row.name} is due`,
      body: overdue <= 0 ? "Today's the day — tap Done when finished." : `Overdue by ${overdue} day${overdue > 1 ? "s" : ""}.`,
      tag: `treatment-${row.treatment_id}`,
      url: `/beauty?treatment=${row.treatment_id}`,
      treatmentId: row.treatment_id,
      token,
      actionUrl,
    };
    const results = await Promise.all(targets.map((s) => sendPush(supabase, s, payload)));
    const ok = results.filter(Boolean).length;
    sent += ok;
    if (ok > 0) reminded.push(row.treatment_id);
  }

  if (reminded.length > 0) {
    const { error: markErr } = await supabase.rpc("mark_reminded", { p_treatment_ids: reminded });
    if (markErr) console.error("mark_reminded failed", markErr.message);
  }

  return json({ due: rows.length, sent, reminded: reminded.length });
});
