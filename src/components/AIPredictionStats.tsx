import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, Target, TrendingUp, Trophy, Percent } from "lucide-react";
import { Card } from "@/components/ui/card";

interface AIPredictionStatsProps {
  pouleId?: string;
}

type PredictionWithMatch = {
  id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points_earned: number | null;
  is_ai_generated: boolean;
  matches: {
    id: string;
    home_score: number | null;
    away_score: number | null;
    status: string;
  } | null;
};

export const AIPredictionStats = ({ pouleId }: AIPredictionStatsProps) => {
  const { user } = useAuth();

  // Fetch predictions with match results
  const { data: predictions } = useQuery({
    queryKey: ["ai-prediction-stats", user?.id, pouleId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("predictions")
        .select(`
          id,
          match_id,
          predicted_home_score,
          predicted_away_score,
          points_earned,
          is_ai_generated,
          matches (
            id,
            home_score,
            away_score,
            status
          )
        `)
        .eq("user_id", user.id);
      
      if (pouleId) {
        query = query.eq("poule_id", pouleId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PredictionWithMatch[];
    },
    enabled: !!user,
  });

  const stats = useMemo(() => {
    if (!predictions) return null;

    // Filter finished matches only
    const finishedPredictions = predictions.filter(
      p => p.matches?.status === "finished" && p.matches?.home_score !== null
    );

    const aiPredictions = finishedPredictions.filter(p => p.is_ai_generated);
    const manualPredictions = finishedPredictions.filter(p => !p.is_ai_generated);

    // Calculate exact score matches
    const aiExactScores = aiPredictions.filter(p => 
      p.predicted_home_score === p.matches?.home_score &&
      p.predicted_away_score === p.matches?.away_score
    );

    const manualExactScores = manualPredictions.filter(p => 
      p.predicted_home_score === p.matches?.home_score &&
      p.predicted_away_score === p.matches?.away_score
    );

    // Calculate correct result predictions (win/draw/loss)
    const getResult = (home: number, away: number) => {
      if (home > away) return "home";
      if (away > home) return "away";
      return "draw";
    };

    const aiCorrectResults = aiPredictions.filter(p => {
      const predictedResult = getResult(p.predicted_home_score, p.predicted_away_score);
      const actualResult = getResult(p.matches!.home_score!, p.matches!.away_score!);
      return predictedResult === actualResult;
    });

    const manualCorrectResults = manualPredictions.filter(p => {
      const predictedResult = getResult(p.predicted_home_score, p.predicted_away_score);
      const actualResult = getResult(p.matches!.home_score!, p.matches!.away_score!);
      return predictedResult === actualResult;
    });

    // Calculate total points
    const aiPoints = aiPredictions.reduce((sum, p) => sum + (p.points_earned || 0), 0);
    const manualPoints = manualPredictions.reduce((sum, p) => sum + (p.points_earned || 0), 0);

    return {
      totalAI: aiPredictions.length,
      totalManual: manualPredictions.length,
      aiExactScores: aiExactScores.length,
      manualExactScores: manualExactScores.length,
      aiCorrectResults: aiCorrectResults.length,
      manualCorrectResults: manualCorrectResults.length,
      aiPoints,
      manualPoints,
      aiExactPercent: aiPredictions.length > 0 ? Math.round((aiExactScores.length / aiPredictions.length) * 100) : 0,
      manualExactPercent: manualPredictions.length > 0 ? Math.round((manualExactScores.length / manualPredictions.length) * 100) : 0,
      aiResultPercent: aiPredictions.length > 0 ? Math.round((aiCorrectResults.length / aiPredictions.length) * 100) : 0,
      manualResultPercent: manualPredictions.length > 0 ? Math.round((manualCorrectResults.length / manualPredictions.length) * 100) : 0,
      aiAvgPoints: aiPredictions.length > 0 ? (aiPoints / aiPredictions.length).toFixed(1) : "0",
      manualAvgPoints: manualPredictions.length > 0 ? (manualPoints / manualPredictions.length).toFixed(1) : "0",
    };
  }, [predictions]);

  if (!stats || (stats.totalAI === 0 && stats.totalManual === 0)) {
    return null;
  }

  // Only show if there are AI predictions
  if (stats.totalAI === 0) {
    return null;
  }

  return (
    <Card className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">AI Voorspelling Statistieken</h3>
          <p className="text-sm text-muted-foreground">Vergelijking AI vs handmatige voorspellingen</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* AI Stats */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-medium">
            <Brain className="w-4 h-4" />
            <span>AI Voorspellingen</span>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Totaal</span>
                <span className="font-bold text-primary">{stats.totalAI}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-secondary/80">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Exacte score
                </span>
                <span className="font-bold">{stats.aiExactScores}</span>
              </div>
              <div className="flex items-center gap-1">
                <Percent className="w-3 h-3 text-primary" />
                <span className="text-sm text-primary font-medium">{stats.aiExactPercent}%</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-secondary/80">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Correct resultaat
                </span>
                <span className="font-bold">{stats.aiCorrectResults}</span>
              </div>
              <div className="flex items-center gap-1">
                <Percent className="w-3 h-3 text-primary" />
                <span className="text-sm text-primary font-medium">{stats.aiResultPercent}%</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-secondary/80">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  Gem. punten
                </span>
                <span className="font-bold">{stats.aiAvgPoints}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Totaal: {stats.aiPoints} pts
              </div>
            </div>
          </div>
        </div>

        {/* Manual Stats */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <Target className="w-4 h-4" />
            <span>Handmatig</span>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Totaal</span>
                <span className="font-bold">{stats.totalManual}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Exacte score
                </span>
                <span className="font-bold">{stats.manualExactScores}</span>
              </div>
              <div className="flex items-center gap-1">
                <Percent className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">{stats.manualExactPercent}%</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Correct resultaat
                </span>
                <span className="font-bold">{stats.manualCorrectResults}</span>
              </div>
              <div className="flex items-center gap-1">
                <Percent className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">{stats.manualResultPercent}%</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  Gem. punten
                </span>
                <span className="font-bold">{stats.manualAvgPoints}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Totaal: {stats.manualPoints} pts
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
