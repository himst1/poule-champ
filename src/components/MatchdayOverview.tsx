import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, ChevronDown, ChevronUp, Calendar, Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type Match = {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  kickoff_time: string;
  phase: string | null;
  status: "pending" | "live" | "finished";
};

type Prediction = {
  id: string;
  user_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points_earned: number | null;
};

type Member = {
  id: string;
  user_id: string;
  points: number;
  rank: number | null;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  };
};

type ScoringRules = {
  correct_score: number;
  correct_result: number;
};

interface MatchdayOverviewProps {
  matches: Match[];
  predictions: Prediction[];
  members: Member[];
  scoringRules: ScoringRules;
}

type MatchdayStanding = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  matchdayPoints: number;
  cumulativePoints: number;
  rank: number;
  previousRank: number | null;
  exactScores: number;
  correctResults: number;
};

type Matchday = {
  date: string;
  label: string;
  matches: Match[];
  standings: MatchdayStanding[];
};

const calculatePoints = (
  prediction: Prediction,
  match: Match,
  rules: ScoringRules
): { points: number; isExactScore: boolean; isCorrectResult: boolean } => {
  if (match.home_score === null || match.away_score === null) {
    return { points: 0, isExactScore: false, isCorrectResult: false };
  }

  const isExactScore =
    prediction.predicted_home_score === match.home_score &&
    prediction.predicted_away_score === match.away_score;

  if (isExactScore) {
    return { points: rules.correct_score, isExactScore: true, isCorrectResult: true };
  }

  const actualResult =
    match.home_score > match.away_score ? "home" :
    match.home_score < match.away_score ? "away" : "draw";
  const predictedResult =
    prediction.predicted_home_score > prediction.predicted_away_score ? "home" :
    prediction.predicted_home_score < prediction.predicted_away_score ? "away" : "draw";

  const isCorrectResult = actualResult === predictedResult;

  return {
    points: isCorrectResult ? rules.correct_result : 0,
    isExactScore: false,
    isCorrectResult,
  };
};

const RankChange = ({ current, previous }: { current: number; previous: number | null }) => {
  if (previous === null) return null;
  
  const diff = previous - current;
  
  if (diff > 0) {
    return (
      <span className="flex items-center text-emerald-500 text-xs font-medium">
        <TrendingUp className="w-3 h-3 mr-0.5" />
        {diff}
      </span>
    );
  }
  
  if (diff < 0) {
    return (
      <span className="flex items-center text-destructive text-xs font-medium">
        <TrendingDown className="w-3 h-3 mr-0.5" />
        {Math.abs(diff)}
      </span>
    );
  }
  
  return (
    <span className="flex items-center text-muted-foreground text-xs">
      <Minus className="w-3 h-3" />
    </span>
  );
};

export const MatchdayOverview = ({
  matches,
  predictions,
  members,
  scoringRules,
}: MatchdayOverviewProps) => {
  const [expandedMatchday, setExpandedMatchday] = useState<string | null>(null);

  // Group finished matches by date and calculate standings
  const matchdays = useMemo(() => {
    const finishedMatches = matches.filter(m => m.status === "finished");
    
    if (finishedMatches.length === 0) return [];

    // Group by date
    const matchesByDate = finishedMatches.reduce((acc, match) => {
      const date = format(parseISO(match.kickoff_time), "yyyy-MM-dd");
      if (!acc[date]) acc[date] = [];
      acc[date].push(match);
      return acc;
    }, {} as Record<string, Match[]>);

    // Sort dates
    const sortedDates = Object.keys(matchesByDate).sort();

    // Track cumulative points per user
    const cumulativePoints: Record<string, number> = {};
    const previousRanks: Record<string, number> = {};

    // Initialize cumulative points
    members.forEach(m => {
      cumulativePoints[m.user_id] = 0;
    });

    // Build matchdays with standings
    const result: Matchday[] = [];

    sortedDates.forEach((date, dateIndex) => {
      const dayMatches = matchesByDate[date];
      
      // Calculate points for this matchday per user
      const matchdayStats: Record<string, { points: number; exactScores: number; correctResults: number }> = {};
      
      members.forEach(m => {
        matchdayStats[m.user_id] = { points: 0, exactScores: 0, correctResults: 0 };
      });

      dayMatches.forEach(match => {
        const matchPredictions = predictions.filter(p => p.match_id === match.id);
        
        matchPredictions.forEach(prediction => {
          if (!matchdayStats[prediction.user_id]) {
            matchdayStats[prediction.user_id] = { points: 0, exactScores: 0, correctResults: 0 };
          }
          
          const result = calculatePoints(prediction, match, scoringRules);
          matchdayStats[prediction.user_id].points += result.points;
          if (result.isExactScore) matchdayStats[prediction.user_id].exactScores++;
          if (result.isCorrectResult) matchdayStats[prediction.user_id].correctResults++;
        });
      });

      // Update cumulative points
      Object.entries(matchdayStats).forEach(([userId, stats]) => {
        cumulativePoints[userId] = (cumulativePoints[userId] || 0) + stats.points;
      });

      // Build standings for this matchday
      const standings: MatchdayStanding[] = members.map(member => ({
        userId: member.user_id,
        displayName: member.profiles.display_name || "Anoniem",
        avatarUrl: member.profiles.avatar_url,
        matchdayPoints: matchdayStats[member.user_id]?.points || 0,
        cumulativePoints: cumulativePoints[member.user_id] || 0,
        rank: 0,
        previousRank: dateIndex > 0 ? (previousRanks[member.user_id] || null) : null,
        exactScores: matchdayStats[member.user_id]?.exactScores || 0,
        correctResults: matchdayStats[member.user_id]?.correctResults || 0,
      }));

      // Sort and assign ranks (tie-breaking: cumulative points, exact scores, correct results, name)
      standings.sort((a, b) => {
        if (b.cumulativePoints !== a.cumulativePoints) return b.cumulativePoints - a.cumulativePoints;
        if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
        if (b.correctResults !== a.correctResults) return b.correctResults - a.correctResults;
        return a.displayName.localeCompare(b.displayName);
      });

      standings.forEach((standing, index) => {
        standing.rank = index + 1;
      });

      // Store ranks for next iteration
      standings.forEach(s => {
        previousRanks[s.userId] = s.rank;
      });

      result.push({
        date,
        label: format(parseISO(date), "EEEE d MMMM", { locale: nl }),
        matches: dayMatches,
        standings,
      });
    });

    // Return in reverse order (most recent first)
    return result.reverse();
  }, [matches, predictions, members, scoringRules]);

  if (matchdays.length === 0) {
    return (
      <Card className="p-6 bg-card/50 border-border/50">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Calendar className="w-5 h-5" />
          <span>Nog geen afgeronde speeldagen om te tonen.</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Stand per Speeldag</h3>
      </div>

      {matchdays.map((matchday) => (
        <Card
          key={matchday.date}
          className="overflow-hidden bg-card/50 border-border/50"
        >
          <Button
            variant="ghost"
            className="w-full justify-between px-4 py-3 h-auto hover:bg-secondary/50"
            onClick={() => setExpandedMatchday(
              expandedMatchday === matchday.date ? null : matchday.date
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium capitalize">{matchday.label}</p>
                <p className="text-sm text-muted-foreground">
                  {matchday.matches.length} wedstrijd{matchday.matches.length !== 1 ? "en" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {matchday.standings.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Medal className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">
                    {matchday.standings[0]?.displayName}
                  </span>
                </div>
              )}
              {expandedMatchday === matchday.date ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </Button>

          {expandedMatchday === matchday.date && (
            <div className="border-t border-border/50">
              {/* Matches summary */}
              <div className="px-4 py-3 bg-secondary/30 border-b border-border/30">
                <p className="text-sm font-medium text-muted-foreground mb-2">Wedstrijden</p>
                <div className="space-y-1">
                  {matchday.matches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between text-sm">
                      <span>{match.home_team}</span>
                      <span className="font-bold px-2">
                        {match.home_score} - {match.away_score}
                      </span>
                      <span>{match.away_team}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Standings */}
              <ScrollArea className="max-h-[300px]">
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Stand na deze speeldag</p>
                  <div className="space-y-2">
                    {matchday.standings.map((standing, index) => (
                      <div
                        key={standing.userId}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg",
                          index === 0 && "bg-amber-500/10 border border-amber-500/20",
                          index === 1 && "bg-slate-400/10 border border-slate-400/20",
                          index === 2 && "bg-orange-600/10 border border-orange-600/20",
                          index > 2 && "bg-secondary/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                            index === 0 && "bg-amber-500 text-amber-950",
                            index === 1 && "bg-slate-400 text-slate-950",
                            index === 2 && "bg-orange-600 text-orange-950",
                            index > 2 && "bg-muted text-muted-foreground"
                          )}>
                            {standing.rank}
                          </div>
                          <div className="flex items-center gap-2">
                            {standing.avatarUrl ? (
                              <img
                                src={standing.avatarUrl}
                                alt=""
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                                {standing.displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-medium text-sm">{standing.displayName}</span>
                            <RankChange current={standing.rank} previous={standing.previousRank} />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-right">
                            <span className="text-muted-foreground">+</span>
                            <span className="font-medium text-primary">{standing.matchdayPoints}</span>
                          </div>
                          <div className="text-right min-w-[50px]">
                            <span className="font-bold">{standing.cumulativePoints}</span>
                            <span className="text-muted-foreground text-xs ml-1">pts</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
