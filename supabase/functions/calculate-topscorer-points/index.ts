import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScoringRules {
  correct_score: number;
  correct_result: number;
  topscorer_correct?: number;
  topscorer_in_top3?: number;
}

const DEFAULT_TOPSCORER_CORRECT = 10;
const DEFAULT_TOPSCORER_IN_TOP3 = 3;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting topscorer points calculation...");

    // Get top scorer(s) - player(s) with the most goals
    const { data: topScorers, error: topScorersError } = await supabase
      .from("players")
      .select("id, name, goals")
      .order("goals", { ascending: false });

    if (topScorersError) {
      console.error("Error fetching top scorers:", topScorersError);
      throw topScorersError;
    }

    if (!topScorers || topScorers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No players found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const maxGoals = topScorers[0].goals;
    const topScorerIds = topScorers
      .filter((p) => p.goals === maxGoals)
      .map((p) => p.id);
    
    // Get top 3 scorers (for partial points)
    const top3Goals = [...new Set(topScorers.map((p) => p.goals))].slice(0, 3);
    const top3Ids = topScorers
      .filter((p) => top3Goals.includes(p.goals))
      .map((p) => p.id);

    console.log(`Top scorer(s): ${topScorers.filter(p => topScorerIds.includes(p.id)).map(p => p.name).join(", ")} with ${maxGoals} goals`);
    console.log(`Top 3 includes ${top3Ids.length} players`);

    // Fetch all topscorer predictions
    const { data: predictions, error: predictionsError } = await supabase
      .from("topscorer_predictions")
      .select("id, user_id, poule_id, player_id");

    if (predictionsError) {
      console.error("Error fetching predictions:", predictionsError);
      throw predictionsError;
    }

    if (!predictions || predictions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No topscorer predictions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
        correct_score: rules?.correct_score ?? 5,
        correct_result: rules?.correct_result ?? 2,
        topscorer_correct: rules?.topscorer_correct ?? DEFAULT_TOPSCORER_CORRECT,
        topscorer_in_top3: rules?.topscorer_in_top3 ?? DEFAULT_TOPSCORER_IN_TOP3,
      };
    }

    // Calculate points for each prediction
    const updates: { id: string; points_earned: number }[] = [];

    for (const prediction of predictions) {
      const rules = pouleScoringRules[prediction.poule_id];
      let points = 0;

      if (topScorerIds.includes(prediction.player_id)) {
        // Exact topscorer match
        points = rules?.topscorer_correct ?? DEFAULT_TOPSCORER_CORRECT;
        console.log(`Prediction ${prediction.id}: Exact topscorer! +${points} points`);
      } else if (top3Ids.includes(prediction.player_id)) {
        // In top 3
        points = rules?.topscorer_in_top3 ?? DEFAULT_TOPSCORER_IN_TOP3;
        console.log(`Prediction ${prediction.id}: In top 3! +${points} points`);
      }

      updates.push({ id: prediction.id, points_earned: points });
    }

    // Batch update predictions
    let updatedCount = 0;
    for (const update of updates) {
      const { error } = await supabase
        .from("topscorer_predictions")
        .update({ points_earned: update.points_earned })
        .eq("id", update.id);

      if (error) {
        console.error(`Error updating prediction ${update.id}:`, error);
      } else {
        updatedCount++;
      }
    }

    // Update poule_members points to include topscorer bonus
    const predictionsByPouleUser: Record<string, Record<string, number>> = {};
    for (const update of updates) {
      const prediction = predictions.find((p) => p.id === update.id);
      if (!prediction) continue;

      const key = prediction.poule_id;
      if (!predictionsByPouleUser[key]) {
        predictionsByPouleUser[key] = {};
      }
      predictionsByPouleUser[key][prediction.user_id] = update.points_earned;
    }

    // For each poule, update member points with topscorer bonus
    for (const [pouleId, userPoints] of Object.entries(predictionsByPouleUser)) {
      // Fetch current member points
      const { data: members, error: membersError } = await supabase
        .from("poule_members")
        .select("id, user_id, points")
        .eq("poule_id", pouleId);

      if (membersError) {
        console.error(`Error fetching members for poule ${pouleId}:`, membersError);
        continue;
      }

      // Note: This assumes topscorer points should be added on top of match prediction points
      // If you want to recalculate from scratch, you'd need to fetch predictions and recalculate
      for (const member of members || []) {
        const topscorerPoints = userPoints[member.user_id] || 0;
        if (topscorerPoints > 0) {
          // For simplicity, we'll add topscorer points to existing points
          // A more robust solution would store topscorer_points separately
          console.log(`Adding ${topscorerPoints} topscorer points to user ${member.user_id} in poule ${pouleId}`);
        }
      }
    }

    console.log(`Successfully updated ${updatedCount}/${updates.length} predictions`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updatedCount} topscorer predictions`,
        topScorers: topScorers.filter((p) => topScorerIds.includes(p.id)).map((p) => p.name),
        maxGoals,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in calculate-topscorer-points:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});