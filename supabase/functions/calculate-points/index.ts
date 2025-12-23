import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Scoring rules
const EXACT_SCORE_POINTS = 5
const CORRECT_RESULT_POINTS = 2

type MatchResult = 'home' | 'away' | 'draw'

function getMatchResult(homeScore: number, awayScore: number): MatchResult {
  if (homeScore > awayScore) return 'home'
  if (awayScore > homeScore) return 'away'
  return 'draw'
}

function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): number {
  // Exact score match
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return EXACT_SCORE_POINTS
  }
  
  // Correct result (winner or draw)
  const predictedResult = getMatchResult(predictedHome, predictedAway)
  const actualResult = getMatchResult(actualHome, actualAway)
  
  if (predictedResult === actualResult) {
    return CORRECT_RESULT_POINTS
  }
  
  return 0
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting points calculation...')
    
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all finished matches that have scores
    const { data: finishedMatches, error: matchError } = await supabase
      .from('matches')
      .select('id, home_score, away_score')
      .eq('status', 'finished')
      .not('home_score', 'is', null)
      .not('away_score', 'is', null)

    if (matchError) {
      console.error('Error fetching matches:', matchError)
      throw matchError
    }

    console.log(`Found ${finishedMatches?.length || 0} finished matches`)

    if (!finishedMatches || finishedMatches.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No finished matches to process', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const matchIds = finishedMatches.map(m => m.id)

    // Get all predictions for finished matches that haven't been scored yet
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('id, match_id, predicted_home_score, predicted_away_score, poule_id, user_id, points_earned')
      .in('match_id', matchIds)

    if (predError) {
      console.error('Error fetching predictions:', predError)
      throw predError
    }

    console.log(`Found ${predictions?.length || 0} predictions to process`)

    if (!predictions || predictions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No predictions to score', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a map of match scores
    const matchScores: Record<string, { home: number; away: number }> = {}
    finishedMatches.forEach(match => {
      matchScores[match.id] = {
        home: match.home_score!,
        away: match.away_score!,
      }
    })

    // Calculate points for each prediction
    let updatedCount = 0
    const pointsUpdates: Array<{ predictionId: string; points: number; userId: string; pouleId: string }> = []

    for (const prediction of predictions) {
      const matchScore = matchScores[prediction.match_id]
      if (!matchScore) continue

      const points = calculatePoints(
        prediction.predicted_home_score,
        prediction.predicted_away_score,
        matchScore.home,
        matchScore.away
      )

      // Only update if points haven't been calculated yet or changed
      if (prediction.points_earned !== points) {
        pointsUpdates.push({
          predictionId: prediction.id,
          points,
          userId: prediction.user_id,
          pouleId: prediction.poule_id,
        })
      }
    }

    console.log(`Updating ${pointsUpdates.length} predictions with new points`)

    // Update predictions with calculated points
    for (const update of pointsUpdates) {
      const { error: updateError } = await supabase
        .from('predictions')
        .update({ points_earned: update.points })
        .eq('id', update.predictionId)

      if (updateError) {
        console.error(`Error updating prediction ${update.predictionId}:`, updateError)
      } else {
        updatedCount++
      }
    }

    // Recalculate total points for all poule members
    // Group updates by poule and user
    const memberUpdates: Record<string, Record<string, number>> = {}
    
    // Get all poule members
    const pouleIds = [...new Set(pointsUpdates.map(u => u.pouleId))]
    
    for (const pouleId of pouleIds) {
      // Get all predictions for this poule
      const { data: poulePredictions, error: pouleError } = await supabase
        .from('predictions')
        .select('user_id, points_earned')
        .eq('poule_id', pouleId)
        .not('points_earned', 'is', null)

      if (pouleError) {
        console.error(`Error fetching predictions for poule ${pouleId}:`, pouleError)
        continue
      }

      // Calculate total points per user
      const userPoints: Record<string, number> = {}
      poulePredictions?.forEach(p => {
        if (!userPoints[p.user_id]) userPoints[p.user_id] = 0
        userPoints[p.user_id] += p.points_earned || 0
      })

      // Update poule members
      for (const [userId, totalPoints] of Object.entries(userPoints)) {
        const { error: memberError } = await supabase
          .from('poule_members')
          .update({ points: totalPoints })
          .eq('poule_id', pouleId)
          .eq('user_id', userId)

        if (memberError) {
          console.error(`Error updating member ${userId} in poule ${pouleId}:`, memberError)
        }
      }

      // Calculate and update ranks
      const { data: members, error: rankError } = await supabase
        .from('poule_members')
        .select('id, user_id, points')
        .eq('poule_id', pouleId)
        .order('points', { ascending: false })

      if (!rankError && members) {
        let currentRank = 1
        let previousPoints = -1
        let sameRankCount = 0

        for (let i = 0; i < members.length; i++) {
          const member = members[i]
          
          if (member.points === previousPoints) {
            sameRankCount++
          } else {
            currentRank = i + 1
            sameRankCount = 0
          }
          
          previousPoints = member.points

          await supabase
            .from('poule_members')
            .update({ rank: currentRank })
            .eq('id', member.id)
        }
      }
    }

    console.log(`Points calculation complete. Updated ${updatedCount} predictions.`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Points calculated successfully`,
        updated: updatedCount,
        matchesProcessed: finishedMatches.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in calculate-points function:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
