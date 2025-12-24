import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScoringRules {
  wk_winner_correct?: number;
  wk_winner_finalist?: number;
}

const DEFAULT_WINNER_CORRECT = 25;
const DEFAULT_WINNER_FINALIST = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting WK winner points calculation...");

    // Get the actual WK winner and finalist from global settings
    const { data: settings, error: settingsError } = await supabase
      .from("global_settings")
      .select("setting_value")
      .eq("setting_key", "wk_results")
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching WK results:", settingsError);
      throw settingsError;
    }

    if (!settings?.setting_value) {
      console.log("No WK results set yet");
      return new Response(
        JSON.stringify({ message: "No WK results set yet. Set the winner and finalist first." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wkResults = settings.setting_value as { winner?: string; finalist?: string };
    const { winner, finalist } = wkResults;

    if (!winner) {
      return new Response(
        JSON.stringify({ message: "No WK winner set yet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`WK Winner: ${winner}, Finalist: ${finalist || "not set"}`);

    // Fetch all winner predictions
    const { data: predictions, error: predictionsError } = await supabase
      .from("winner_predictions")
      .select("id, user_id, poule_id, country");

    if (predictionsError) {
      console.error("Error fetching winner predictions:", predictionsError);
      throw predictionsError;
    }

    if (!predictions || predictions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No winner predictions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${predictions.length} winner predictions`);

    // Fetch all poules for scoring rules
    const { data: poules, error: poulesError } = await supabase
      .from("poules")
      .select("id, scoring_rules");

    if (poulesError) {
      console.error("Error fetching poules:", poulesError);
      throw poulesError;
    }

    const pouleScoringRules: Record<string, ScoringRules> = {};
    for (const poule of poules || []) {
      const rules = poule.scoring_rules as ScoringRules | null;
      pouleScoringRules[poule.id] = {
        wk_winner_correct: rules?.wk_winner_correct ?? DEFAULT_WINNER_CORRECT,
        wk_winner_finalist: rules?.wk_winner_finalist ?? DEFAULT_WINNER_FINALIST,
      };
    }

    // Calculate points for each prediction
    const updates: { id: string; points_earned: number }[] = [];

    for (const prediction of predictions) {
      const rules = pouleScoringRules[prediction.poule_id] || {};
      let points = 0;

      const predictedCountry = prediction.country.toLowerCase();
      const actualWinner = winner.toLowerCase();
      const actualFinalist = finalist?.toLowerCase();

      if (predictedCountry === actualWinner) {
        // Correct winner prediction
        points = rules.wk_winner_correct ?? DEFAULT_WINNER_CORRECT;
        console.log(`Prediction ${prediction.id}: Correct winner! +${points} points`);
      } else if (actualFinalist && predictedCountry === actualFinalist) {
        // Predicted the finalist
        points = rules.wk_winner_finalist ?? DEFAULT_WINNER_FINALIST;
        console.log(`Prediction ${prediction.id}: Predicted finalist! +${points} points`);
      }

      updates.push({ id: prediction.id, points_earned: points });
    }

    // Batch update predictions
    let updatedCount = 0;
    for (const update of updates) {
      const { error } = await supabase
        .from("winner_predictions")
        .update({ points_earned: update.points_earned })
        .eq("id", update.id);

      if (error) {
        console.error(`Error updating prediction ${update.id}:`, error);
      } else {
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount}/${updates.length} winner predictions`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updatedCount} winner predictions`,
        winner,
        finalist: finalist || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in calculate-winner-points:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
