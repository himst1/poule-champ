import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Default scoring rules (can be overridden per poule)
const DEFAULT_EXACT_SCORE_POINTS = 5
const DEFAULT_CORRECT_RESULT_POINTS = 2

type MatchResult = 'home' | 'away' | 'draw'

interface ScoringRules {
  correct_score: number
  correct_result: number
}

function getMatchResult(homeScore: number, awayScore: number): MatchResult {
  if (homeScore > awayScore) return 'home'
  if (awayScore > homeScore) return 'away'
  return 'draw'
}

function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  scoringRules: ScoringRules
): number {
  // Exact score match
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return scoringRules.correct_score
  }
  
  // Correct result (winner or draw)
  const predictedResult = getMatchResult(predictedHome, predictedAway)
  const actualResult = getMatchResult(actualHome, actualAway)
  
  if (predictedResult === actualResult) {
    return scoringRules.correct_result
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
      .select('id, home_score, away_score, kickoff_time')
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

    // Get all poules with their scoring rules
    const { data: poules, error: poulesError } = await supabase
      .from('poules')
      .select('id, scoring_rules')

    if (poulesError) {
      console.error('Error fetching poules:', poulesError)
      throw poulesError
    }

    // Create map of poule scoring rules
    const pouleScoringRules: Record<string, ScoringRules> = {}
    poules?.forEach(poule => {
      const rules = poule.scoring_rules as ScoringRules | null
      pouleScoringRules[poule.id] = {
        correct_score: rules?.correct_score ?? DEFAULT_EXACT_SCORE_POINTS,
        correct_result: rules?.correct_result ?? DEFAULT_CORRECT_RESULT_POINTS,
      }
    })

    // Get all predictions for finished matches
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
    const matchScores: Record<string, { home: number; away: number; kickoff_time: string }> = {}
    finishedMatches.forEach(match => {
      matchScores[match.id] = {
        home: match.home_score!,
        away: match.away_score!,
        kickoff_time: match.kickoff_time,
      }
    })

    // Calculate points for each prediction
    let updatedCount = 0
    const pointsUpdates: Array<{ 
      predictionId: string; 
      points: number; 
      userId: string; 
      pouleId: string;
      matchId: string;
    }> = []

    for (const prediction of predictions) {
      const matchScore = matchScores[prediction.match_id]
      if (!matchScore) continue

      const scoringRules = pouleScoringRules[prediction.poule_id] || {
        correct_score: DEFAULT_EXACT_SCORE_POINTS,
        correct_result: DEFAULT_CORRECT_RESULT_POINTS,
      }

      const points = calculatePoints(
        prediction.predicted_home_score,
        prediction.predicted_away_score,
        matchScore.home,
        matchScore.away,
        scoringRules
      )

      // Only update if points haven't been calculated yet or changed
      if (prediction.points_earned !== points) {
        pointsUpdates.push({
          predictionId: prediction.id,
          points,
          userId: prediction.user_id,
          pouleId: prediction.poule_id,
          matchId: prediction.match_id,
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

    // Recalculate total points and rankings for all poule members
    const pouleIds = [...new Set(pointsUpdates.map(u => u.pouleId))]
    
    for (const pouleId of pouleIds) {
      // Get all predictions for this poule with match kickoff times for tie-breaking
      const { data: poulePredictions, error: pouleError } = await supabase
        .from('predictions')
        .select(`
          user_id, 
          points_earned,
          match_id,
          matches!inner (
            kickoff_time,
            home_score,
            away_score
          )
        `)
        .eq('poule_id', pouleId)
        .not('points_earned', 'is', null)

      if (pouleError) {
        console.error(`Error fetching predictions for poule ${pouleId}:`, pouleError)
        continue
      }

      // Calculate total points and tie-breaking stats per user
      const userStats: Record<string, { 
        totalPoints: number;
        exactScores: number;
        correctResults: number;
        earliestPrediction: string;
      }> = {}

      poulePredictions?.forEach(p => {
        if (!userStats[p.user_id]) {
          userStats[p.user_id] = { 
            totalPoints: 0, 
            exactScores: 0, 
            correctResults: 0,
            earliestPrediction: '9999-12-31',
          }
        }
        
        const points = p.points_earned || 0
        userStats[p.user_id].totalPoints += points

        const match = p.matches as any
        const scoringRules = pouleScoringRules[pouleId] || {
          correct_score: DEFAULT_EXACT_SCORE_POINTS,
          correct_result: DEFAULT_CORRECT_RESULT_POINTS,
        }
        
        // Track exact scores and correct results for tie-breaking
        if (points === scoringRules.correct_score) {
          userStats[p.user_id].exactScores += 1
        } else if (points === scoringRules.correct_result) {
          userStats[p.user_id].correctResults += 1
        }

        // Track earliest prediction for final tie-break
        if (match?.kickoff_time && match.kickoff_time < userStats[p.user_id].earliestPrediction) {
          userStats[p.user_id].earliestPrediction = match.kickoff_time
        }
      })

      // Update poule members with new points
      for (const [userId, stats] of Object.entries(userStats)) {
        const { error: memberError } = await supabase
          .from('poule_members')
          .update({ points: stats.totalPoints })
          .eq('poule_id', pouleId)
          .eq('user_id', userId)

        if (memberError) {
          console.error(`Error updating member ${userId} in poule ${pouleId}:`, memberError)
        }
      }

      // Calculate and update ranks with tie-breaking
      // Tie-breaking rules:
      // 1. Total points (descending)
      // 2. Number of exact scores (descending)
      // 3. Number of correct results (descending)
      // 4. Alphabetical by display name (ascending)
      
      const { data: members, error: rankError } = await supabase
        .from('poule_members')
        .select('id, user_id, points, profiles(display_name)')
        .eq('poule_id', pouleId)

      if (!rankError && members) {
        // Enrich members with tie-breaking data
        const enrichedMembers = members.map(m => ({
          ...m,
          exactScores: userStats[m.user_id]?.exactScores || 0,
          correctResults: userStats[m.user_id]?.correctResults || 0,
          displayName: (m.profiles as any)?.display_name || 'zzz',
        }))

        // Sort by tie-breaking rules
        enrichedMembers.sort((a, b) => {
          // 1. Total points (descending)
          if (b.points !== a.points) return b.points - a.points
          
          // 2. Exact scores (descending)
          if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores
          
          // 3. Correct results (descending)
          if (b.correctResults !== a.correctResults) return b.correctResults - a.correctResults
          
          // 4. Alphabetical (ascending)
          return a.displayName.localeCompare(b.displayName)
        })

        // Assign ranks (same points+tiebreakers = same rank)
        let currentRank = 1
        for (let i = 0; i < enrichedMembers.length; i++) {
          const member = enrichedMembers[i]
          const prevMember = i > 0 ? enrichedMembers[i - 1] : null
          
          // Only assign same rank if all tie-breakers are equal
          if (prevMember && 
              member.points === prevMember.points &&
              member.exactScores === prevMember.exactScores &&
              member.correctResults === prevMember.correctResults) {
            // Same rank as previous
          } else {
            currentRank = i + 1
          }

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
        poulesProcessed: pouleIds.length,
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
