import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart3, 
  Target, 
  Trophy, 
  TrendingUp, 
  Users, 
  Percent,
  Award,
  Goal
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface PouleAnalyticsProps {
  pouleId: string;
}

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
}

interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points_earned: number | null;
}

interface Member {
  user_id: string;
  points: number;
  profiles: {
    display_name: string | null;
  } | null;
}

export const PouleAnalytics = ({ pouleId }: PouleAnalyticsProps) => {
  // Fetch all predictions in poule
  const { data: predictions } = useQuery({
    queryKey: ["poule-analytics-predictions", pouleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("poule_id", pouleId);
      if (error) throw error;
      return data as Prediction[];
    },
  });

  // Fetch all matches
  const { data: matches } = useQuery({
    queryKey: ["poule-analytics-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("kickoff_time", { ascending: true });
      if (error) throw error;
      return data as Match[];
    },
  });

  // Fetch members
  const { data: members } = useQuery({
    queryKey: ["poule-analytics-members", pouleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poule_members")
        .select(`
          user_id,
          points,
          profiles (
            display_name
          )
        `)
        .eq("poule_id", pouleId);
      if (error) throw error;
      return data as Member[];
    },
  });

  // Calculate most predicted outcomes per match
  const matchPredictionStats = useMemo(() => {
    if (!predictions || !matches) return [];

    const finishedMatches = matches.filter(m => m.status === "finished");
    
    return finishedMatches.map(match => {
      const matchPredictions = predictions.filter(p => p.match_id === match.id);
      
      // Group predictions by outcome
      const outcomes: Record<string, number> = {};
      matchPredictions.forEach(p => {
        const key = `${p.predicted_home_score}-${p.predicted_away_score}`;
        outcomes[key] = (outcomes[key] || 0) + 1;
      });

      // Find most common prediction
      const sorted = Object.entries(outcomes).sort((a, b) => b[1] - a[1]);
      const mostCommon = sorted[0];
      
      // Check if most common was correct
      const actualScore = `${match.home_score}-${match.away_score}`;
      const wasCorrect = mostCommon?.[0] === actualScore;

      // Count correct predictions
      const correctCount = matchPredictions.filter(
        p => p.predicted_home_score === match.home_score && 
             p.predicted_away_score === match.away_score
      ).length;

      return {
        matchId: match.id,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        actualScore,
        mostPredicted: mostCommon?.[0] || "-",
        mostPredictedCount: mostCommon?.[1] || 0,
        totalPredictions: matchPredictions.length,
        correctCount,
        wasCorrect,
        correctPercent: matchPredictions.length > 0 
          ? Math.round((correctCount / matchPredictions.length) * 100) 
          : 0,
      };
    }).slice(-10); // Last 10 matches
  }, [predictions, matches]);

  // Calculate user accuracy stats
  const userAccuracyStats = useMemo(() => {
    if (!predictions || !matches || !members) return [];

    const finishedMatches = matches.filter(m => m.status === "finished");
    const finishedMatchIds = new Set(finishedMatches.map(m => m.id));
    const matchesMap = Object.fromEntries(finishedMatches.map(m => [m.id, m]));

    return members.map(member => {
      const userPredictions = predictions.filter(
        p => p.user_id === member.user_id && finishedMatchIds.has(p.match_id)
      );

      const exactScores = userPredictions.filter(p => {
        const match = matchesMap[p.match_id];
        return match && p.predicted_home_score === match.home_score && 
               p.predicted_away_score === match.away_score;
      }).length;

      const correctResults = userPredictions.filter(p => {
        const match = matchesMap[p.match_id];
        if (!match) return false;
        
        const predictedResult = p.predicted_home_score > p.predicted_away_score ? "home" :
                               p.predicted_home_score < p.predicted_away_score ? "away" : "draw";
        const actualResult = match.home_score! > match.away_score! ? "home" :
                            match.home_score! < match.away_score! ? "away" : "draw";
        return predictedResult === actualResult;
      }).length;

      const totalPoints = userPredictions.reduce((sum, p) => sum + (p.points_earned || 0), 0);
      const avgPoints = userPredictions.length > 0 ? totalPoints / userPredictions.length : 0;

      return {
        userId: member.user_id,
        name: member.profiles?.display_name || "Onbekend",
        totalPredictions: userPredictions.length,
        exactScores,
        correctResults,
        exactPercent: userPredictions.length > 0 ? Math.round((exactScores / userPredictions.length) * 100) : 0,
        resultPercent: userPredictions.length > 0 ? Math.round((correctResults / userPredictions.length) * 100) : 0,
        totalPoints: member.points,
        avgPoints: avgPoints.toFixed(2),
      };
    }).sort((a, b) => b.exactPercent - a.exactPercent);
  }, [predictions, matches, members]);

  // Overall poule stats
  const overallStats = useMemo(() => {
    if (!predictions || !matches) return null;

    const finishedMatches = matches.filter(m => m.status === "finished");
    const finishedMatchIds = new Set(finishedMatches.map(m => m.id));
    const matchesMap = Object.fromEntries(finishedMatches.map(m => [m.id, m]));

    const finishedPredictions = predictions.filter(p => finishedMatchIds.has(p.match_id));

    const exactScores = finishedPredictions.filter(p => {
      const match = matchesMap[p.match_id];
      return match && p.predicted_home_score === match.home_score && 
             p.predicted_away_score === match.away_score;
    }).length;

    const correctResults = finishedPredictions.filter(p => {
      const match = matchesMap[p.match_id];
      if (!match) return false;
      
      const predictedResult = p.predicted_home_score > p.predicted_away_score ? "home" :
                             p.predicted_home_score < p.predicted_away_score ? "away" : "draw";
      const actualResult = match.home_score! > match.away_score! ? "home" :
                          match.home_score! < match.away_score! ? "away" : "draw";
      return predictedResult === actualResult;
    }).length;

    const totalPoints = finishedPredictions.reduce((sum, p) => sum + (p.points_earned || 0), 0);

    return {
      totalPredictions: predictions.length,
      finishedPredictions: finishedPredictions.length,
      exactScores,
      correctResults,
      exactPercent: finishedPredictions.length > 0 ? Math.round((exactScores / finishedPredictions.length) * 100) : 0,
      resultPercent: finishedPredictions.length > 0 ? Math.round((correctResults / finishedPredictions.length) * 100) : 0,
      totalPoints,
      avgPointsPerMatch: finishedPredictions.length > 0 ? (totalPoints / finishedPredictions.length).toFixed(2) : "0",
    };
  }, [predictions, matches]);

  // Chart data for accuracy comparison
  const accuracyChartData = useMemo(() => {
    return userAccuracyStats.slice(0, 8).map(user => ({
      name: user.name.length > 10 ? user.name.slice(0, 10) + "..." : user.name,
      exact: user.exactPercent,
      result: user.resultPercent,
    }));
  }, [userAccuracyStats]);

  if (!overallStats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Target className="w-4 h-4" />
              Voorspellingen
            </div>
            <p className="text-2xl font-bold">{overallStats.totalPredictions}</p>
            <p className="text-xs text-muted-foreground">{overallStats.finishedPredictions} afgerond</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Award className="w-4 h-4" />
              Exacte Scores
            </div>
            <p className="text-2xl font-bold text-primary">{overallStats.exactScores}</p>
            <p className="text-xs text-muted-foreground">{overallStats.exactPercent}% nauwkeurig</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Correct Resultaat
            </div>
            <p className="text-2xl font-bold">{overallStats.correctResults}</p>
            <p className="text-xs text-muted-foreground">{overallStats.resultPercent}% correct</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Trophy className="w-4 h-4" />
              Gem. Punten
            </div>
            <p className="text-2xl font-bold">{overallStats.avgPointsPerMatch}</p>
            <p className="text-xs text-muted-foreground">per voorspelling</p>
          </CardContent>
        </Card>
      </div>

      {/* User Accuracy Chart */}
      {accuracyChartData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Nauwkeurigheid per Deelnemer</CardTitle>
                <p className="text-sm text-muted-foreground">Exacte score vs correct resultaat percentage</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accuracyChartData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      `${value}%`,
                      name === 'exact' ? 'Exacte score' : 'Correct resultaat'
                    ]}
                  />
                  <Bar dataKey="exact" fill="hsl(var(--primary))" name="exact" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="result" fill="hsl(var(--accent))" name="result" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary" />
                <span className="text-sm">Exacte score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-accent" />
                <span className="text-sm">Correct resultaat</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Most Predicted Outcomes */}
      {matchPredictionStats.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-lg">Meest Voorspelde Uitslagen</CardTitle>
                <p className="text-sm text-muted-foreground">Laatste 10 afgeronde wedstrijden</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {matchPredictionStats.map((stat) => (
                  <div 
                    key={stat.matchId} 
                    className={`p-3 rounded-lg border ${
                      stat.wasCorrect 
                        ? "bg-primary/5 border-primary/30" 
                        : "bg-secondary/30 border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium truncate">
                        {stat.homeTeam} vs {stat.awayTeam}
                      </span>
                      <Badge variant={stat.wasCorrect ? "default" : "secondary"}>
                        {stat.actualScore}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Meest voorspeld:</span>
                        <span className="font-mono font-medium">{stat.mostPredicted}</span>
                        <span className="text-xs text-muted-foreground">
                          ({stat.mostPredictedCount}x)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-primary" />
                        <span className="text-xs">
                          {stat.correctCount}/{stat.totalPredictions} exact ({stat.correctPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* User Accuracy Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Percent className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Accuracy Ranglijst</CardTitle>
              <p className="text-sm text-muted-foreground">Gerangschikt op exacte score percentage</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {userAccuracyStats.map((user, index) => (
                <div 
                  key={user.userId} 
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                    index === 1 ? "bg-gray-400/20 text-gray-400" :
                    index === 2 ? "bg-orange-500/20 text-orange-500" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{user.totalPredictions} voorspellingen</span>
                      <span>{user.exactScores} exact</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">{user.exactPercent}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{user.resultPercent}% correct</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
