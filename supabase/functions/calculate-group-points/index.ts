import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScoringRules {
  group_position_correct?: number;
  group_all_correct?: number;
}

const DEFAULT_POSITION_CORRECT = 3;
const DEFAULT_ALL_CORRECT = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting group standings points calculation...");

    // Get all actual group standings
    const { data: actualStandings, error: actualError } = await supabase
      .from("actual_group_standings")
      .select("group_name, standings");

    if (actualError) {
      console.error("Error fetching actual standings:", actualError);
      throw actualError;
    }

    if (!actualStandings || actualStandings.length === 0) {
      console.log("No actual group standings set yet");
      return new Response(
        JSON.stringify({ message: "No actual group standings set yet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a map of actual standings
    const actualStandingsMap: Record<string, string[]> = {};
    for (const standing of actualStandings) {
      actualStandingsMap[standing.group_name] = standing.standings as string[];
    }

    console.log(`Found actual standings for groups: ${Object.keys(actualStandingsMap).join(", ")}`);

    // Fetch all group predictions for groups that have actual standings
    const groupNames = Object.keys(actualStandingsMap);
    const { data: predictions, error: predictionsError } = await supabase
      .from("group_standings_predictions")
      .select("id, user_id, poule_id, group_name, predicted_standings")
      .in("group_name", groupNames);

    if (predictionsError) {
      console.error("Error fetching predictions:", predictionsError);
      throw predictionsError;
    }

    if (!predictions || predictions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No group predictions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${predictions.length} group predictions to process`);

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
        group_position_correct: rules?.group_position_correct ?? DEFAULT_POSITION_CORRECT,
        group_all_correct: rules?.group_all_correct ?? DEFAULT_ALL_CORRECT,
      };
    }

    // Calculate points for each prediction
    const updates: { id: string; points_earned: number }[] = [];

    for (const prediction of predictions) {
      const actualStanding = actualStandingsMap[prediction.group_name];
      if (!actualStanding) continue;

      const predictedStanding = prediction.predicted_standings as string[];
      const rules = pouleScoringRules[prediction.poule_id] || {};

      let points = 0;
      let correctPositions = 0;

      // Check each position
      for (let i = 0; i < Math.min(predictedStanding.length, actualStanding.length); i++) {
        if (predictedStanding[i]?.toLowerCase() === actualStanding[i]?.toLowerCase()) {
          correctPositions++;
          points += rules.group_position_correct ?? DEFAULT_POSITION_CORRECT;
        }
      }

      // Bonus for all positions correct
      if (correctPositions === actualStanding.length && correctPositions >= 4) {
        points += rules.group_all_correct ?? DEFAULT_ALL_CORRECT;
        console.log(`Prediction ${prediction.id}: All ${correctPositions} positions correct! Bonus +${rules.group_all_correct ?? DEFAULT_ALL_CORRECT}`);
      }

      console.log(`Prediction ${prediction.id}: ${correctPositions} positions correct, total ${points} points`);
      updates.push({ id: prediction.id, points_earned: points });
    }

    // Batch update predictions
    let updatedCount = 0;
    for (const update of updates) {
      const { error } = await supabase
        .from("group_standings_predictions")
        .update({ points_earned: update.points_earned })
        .eq("id", update.id);

      if (error) {
        console.error(`Error updating prediction ${update.id}:`, error);
      } else {
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount}/${updates.length} group predictions`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updatedCount} group predictions`,
        groupsProcessed: groupNames.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in calculate-group-points:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
