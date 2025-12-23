import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

// Send web push notification using simple fetch
async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object
): Promise<{ success: boolean; statusCode?: number }> {
  try {
    // For a basic push, we can send without encryption for now
    // Full encryption would require web-push library or complex crypto
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "TTL": "86400",
      },
      body: JSON.stringify(payload),
    });

    return { success: response.ok, statusCode: response.status };
  } catch (error) {
    console.error("Push notification error:", error);
    return { success: false };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get matches that are starting within 24 hours
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: upcomingMatches, error: matchError } = await supabase
      .from("matches")
      .select("id, home_team, away_team, kickoff_time")
      .eq("status", "pending")
      .gte("kickoff_time", now.toISOString())
      .lte("kickoff_time", in24Hours.toISOString());

    if (matchError) throw matchError;

    if (!upcomingMatches || upcomingMatches.length === 0) {
      return new Response(
        JSON.stringify({ message: "No upcoming matches within 24 hours" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const matchIds = upcomingMatches.map((m: { id: string }) => m.id);

    // Get all push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No push subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For each user with a subscription, check if they have predictions for these matches
    let notificationsSent = 0;
    const failedSubscriptions: string[] = [];

    for (const subscription of subscriptions) {
      // Get predictions for this user (if they have a user_id)
      let unpredictedMatches = upcomingMatches;

      if (subscription.user_id) {
        const { data: predictions } = await supabase
          .from("predictions")
          .select("match_id")
          .eq("user_id", subscription.user_id)
          .in("match_id", matchIds);

        const predictedIds = new Set(predictions?.map((p: { match_id: string }) => p.match_id) || []);
        unpredictedMatches = upcomingMatches.filter((m: { id: string }) => !predictedIds.has(m.id));
      }

      if (unpredictedMatches.length === 0) continue;

      const firstMatch = unpredictedMatches[0] as { home_team: string; away_team: string };
      const payload: NotificationPayload = {
        title: "Deadline nadert! ⚽",
        body: unpredictedMatches.length === 1
          ? `${firstMatch.home_team} - ${firstMatch.away_team} begint bijna!`
          : `${unpredictedMatches.length} wedstrijden wachten op je voorspelling!`,
        url: "/dashboard",
        tag: "deadline-reminder",
      };

      const result = await sendPushNotification(
        {
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
        payload
      );

      if (result.success) {
        notificationsSent++;
      } else if (result.statusCode === 410 || result.statusCode === 404) {
        failedSubscriptions.push(subscription.id);
      }
    }

    // Clean up invalid subscriptions
    if (failedSubscriptions.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("id", failedSubscriptions);
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent,
        cleanedUp: failedSubscriptions.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-deadline-notifications:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
