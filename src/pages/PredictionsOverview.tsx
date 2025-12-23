import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Trophy, 
  Goal, 
  Target, 
  ArrowLeft, 
  Search, 
  User,
  ChevronDown,
  ChevronUp,
  Flag,
  Check,
  X
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Types
interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  kickoff_time: string;
  status: "pending" | "live" | "finished";
}

interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points_earned: number | null;
  is_ai_generated: boolean;
}

interface TopscorerPrediction {
  id: string;
  user_id: string;
  player_id: string;
  points_earned: number;
  player?: {
    id: string;
    name: string;
    country: string;
    country_flag: string | null;
    goals: number;
  };
}

interface WinnerPrediction {
  id: string;
  user_id: string;
  country: string;
  country_flag: string | null;
  points_earned: number;
}

interface Member {
  id: string;
  user_id: string;
  points: number;
  rank: number | null;
  profiles: Profile;
}

const PredictionsOverview = () => {
  const { id: pouleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // Fetch poule details
  const { data: poule } = useQuery({
    queryKey: ["poule", pouleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poules")
        .select("*")
        .eq("id", pouleId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!pouleId,
  });

  // Fetch members with profiles
  const { data: members } = useQuery({
    queryKey: ["poule-members-overview", pouleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poule_members")
        .select(`
          id,
          user_id,
          points,
          rank,
          profiles (
            id,
            display_name,
            email,
            avatar_url
          )
        `)
        .eq("poule_id", pouleId)
        .order("points", { ascending: false });
      if (error) throw error;
      return data as Member[];
    },
    enabled: !!pouleId,
  });

  // Fetch all matches
  const { data: matches } = useQuery({
    queryKey: ["all-matches-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("kickoff_time", { ascending: true });
      if (error) throw error;
      return data as Match[];
    },
  });

  // Fetch all predictions in poule
  const { data: predictions } = useQuery({
    queryKey: ["all-predictions-overview", pouleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("poule_id", pouleId);
      if (error) throw error;
      return data as Prediction[];
    },
    enabled: !!pouleId,
  });

  // Fetch topscorer predictions
  const { data: topscorerPredictions } = useQuery({
    queryKey: ["topscorer-predictions-overview", pouleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topscorer_predictions")
        .select("*, player:wk_players(*)")
        .eq("poule_id", pouleId);
      if (error) throw error;
      return data as TopscorerPrediction[];
    },
    enabled: !!pouleId,
  });

  // Fetch winner predictions
  const { data: winnerPredictions } = useQuery({
    queryKey: ["winner-predictions-overview", pouleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("winner_predictions")
        .select("*")
        .eq("poule_id", pouleId);
      if (error) throw error;
      return data as WinnerPrediction[];
    },
    enabled: !!pouleId,
  });

  // Create lookup maps
  const matchesMap = matches?.reduce((acc, m) => {
    acc[m.id] = m;
    return acc;
  }, {} as Record<string, Match>) || {};

  const predictionsByUser = predictions?.reduce((acc, p) => {
    if (!acc[p.user_id]) acc[p.user_id] = [];
    acc[p.user_id].push(p);
    return acc;
  }, {} as Record<string, Prediction[]>) || {};

  const topscorerByUser = topscorerPredictions?.reduce((acc, p) => {
    acc[p.user_id] = p;
    return acc;
  }, {} as Record<string, TopscorerPrediction>) || {};

  const winnerByUser = winnerPredictions?.reduce((acc, p) => {
    acc[p.user_id] = p;
    return acc;
  }, {} as Record<string, WinnerPrediction>) || {};

  // Filter members by search
  const filteredMembers = members?.filter(member => {
    const name = member.profiles?.display_name || member.profiles?.email || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Toggle expanded state
  const toggleExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // Calculate user stats
  const getUserStats = (userId: string) => {
    const userPredictions = predictionsByUser[userId] || [];
    const finishedPredictions = userPredictions.filter(p => {
      const match = matchesMap[p.match_id];
      return match?.status === "finished";
    });
    
    const correctScores = finishedPredictions.filter(p => p.points_earned && p.points_earned >= 5).length;
    const correctResults = finishedPredictions.filter(p => p.points_earned && p.points_earned > 0 && p.points_earned < 5).length;
    const totalPoints = finishedPredictions.reduce((sum, p) => sum + (p.points_earned || 0), 0);
    
    return {
      totalPredictions: userPredictions.length,
      finishedMatches: finishedPredictions.length,
      correctScores,
      correctResults,
      totalPoints,
    };
  };

  if (!poule) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/poule/${pouleId}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug naar poule
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">
            Voorspellingen Overzicht
          </h1>
          <p className="text-muted-foreground">{poule.name}</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Zoek deelnemer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <User className="w-4 h-4" />
                Deelnemers
              </div>
              <p className="text-2xl font-bold">{members?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Target className="w-4 h-4" />
                Voorspellingen
              </div>
              <p className="text-2xl font-bold">{predictions?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Goal className="w-4 h-4" />
                Topscorer
              </div>
              <p className="text-2xl font-bold">{topscorerPredictions?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Trophy className="w-4 h-4" />
                WK Winnaar
              </div>
              <p className="text-2xl font-bold">{winnerPredictions?.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Members List */}
        <div className="space-y-4">
          {filteredMembers?.map((member, index) => {
            const isExpanded = expandedUsers.has(member.user_id);
            const isCurrentUser = member.user_id === user?.id;
            const stats = getUserStats(member.user_id);
            const topscorerPred = topscorerByUser[member.user_id];
            const winnerPred = winnerByUser[member.user_id];
            const userPredictions = predictionsByUser[member.user_id] || [];
            
            return (
              <Collapsible key={member.id} open={isExpanded} onOpenChange={() => toggleExpanded(member.user_id)}>
                <Card className={isCurrentUser ? "border-primary/50" : ""}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? "bg-accent text-accent-foreground" :
                          index === 1 ? "bg-muted-foreground/30 text-foreground" :
                          index === 2 ? "bg-orange-600/30 text-orange-400" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          {index + 1}
                        </div>
                        
                        {/* Name & Points */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${isCurrentUser ? "text-primary" : ""}`}>
                            {member.profiles?.display_name || member.profiles?.email?.split("@")[0] || "Onbekend"}
                            {isCurrentUser && <span className="ml-2 text-xs text-primary">(jij)</span>}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{stats.totalPredictions} wedstrijden</span>
                            <span>•</span>
                            <span>{stats.correctScores} exact</span>
                          </div>
                        </div>
                        
                        {/* Points */}
                        <div className="text-right">
                          <p className="font-display font-bold text-lg">{member.points} pts</p>
                        </div>
                        
                        {/* Expand Icon */}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-6">
                      {/* Topscorer & Winner */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Topscorer Prediction */}
                        <div className="p-4 rounded-lg bg-secondary/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Goal className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">Topscorer</span>
                          </div>
                          {topscorerPred?.player ? (
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{topscorerPred.player.country_flag}</span>
                              <div>
                                <p className="font-medium">{topscorerPred.player.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {topscorerPred.player.goals} goals
                                </p>
                              </div>
                              {topscorerPred.points_earned > 0 && (
                                <Badge className="ml-auto">+{topscorerPred.points_earned}</Badge>
                              )}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">Geen voorspelling</p>
                          )}
                        </div>
                        
                        {/* Winner Prediction */}
                        <div className="p-4 rounded-lg bg-secondary/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Trophy className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">WK Winnaar</span>
                          </div>
                          {winnerPred ? (
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{winnerPred.country_flag}</span>
                              <div>
                                <p className="font-medium">{winnerPred.country}</p>
                              </div>
                              {winnerPred.points_earned > 0 && (
                                <Badge className="ml-auto">+{winnerPred.points_earned}</Badge>
                              )}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">Geen voorspelling</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Match Predictions */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">Wedstrijdvoorspellingen</span>
                          <Badge variant="secondary" className="ml-auto">
                            {stats.correctScores} exact • {stats.correctResults} goed
                          </Badge>
                        </div>
                        
                        {userPredictions.length === 0 ? (
                          <p className="text-muted-foreground text-sm">Geen voorspellingen</p>
                        ) : (
                          <ScrollArea className="h-[200px]">
                            <div className="space-y-2 pr-4">
                              {userPredictions
                                .sort((a, b) => {
                                  const matchA = matchesMap[a.match_id];
                                  const matchB = matchesMap[b.match_id];
                                  if (!matchA || !matchB) return 0;
                                  return new Date(matchA.kickoff_time).getTime() - new Date(matchB.kickoff_time).getTime();
                                })
                                .map(pred => {
                                  const match = matchesMap[pred.match_id];
                                  if (!match) return null;
                                  
                                  const isFinished = match.status === "finished";
                                  const isCorrectScore = pred.points_earned && pred.points_earned >= 5;
                                  const isCorrectResult = pred.points_earned && pred.points_earned > 0 && pred.points_earned < 5;
                                  
                                  return (
                                    <div 
                                      key={pred.id} 
                                      className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
                                        isFinished 
                                          ? isCorrectScore 
                                            ? "bg-primary/10 border border-primary/30" 
                                            : isCorrectResult 
                                              ? "bg-accent/10 border border-accent/30"
                                              : "bg-destructive/5 border border-destructive/20"
                                          : "bg-secondary/20"
                                      }`}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 truncate">
                                          <span className="truncate">{match.home_team}</span>
                                          <span className="text-muted-foreground">vs</span>
                                          <span className="truncate">{match.away_team}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          {format(parseISO(match.kickoff_time), "d MMM HH:mm", { locale: nl })}
                                        </p>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        {/* Prediction */}
                                        <div className="font-mono font-medium">
                                          {pred.predicted_home_score} - {pred.predicted_away_score}
                                        </div>
                                        
                                        {/* Actual Score */}
                                        {isFinished && (
                                          <>
                                            <span className="text-muted-foreground">/</span>
                                            <div className="font-mono text-muted-foreground">
                                              {match.home_score} - {match.away_score}
                                            </div>
                                          </>
                                        )}
                                        
                                        {/* Points */}
                                        {isFinished && (
                                          <Badge 
                                            variant={pred.points_earned && pred.points_earned > 0 ? "default" : "outline"}
                                            className={isCorrectScore ? "bg-primary" : isCorrectResult ? "bg-accent" : ""}
                                          >
                                            +{pred.points_earned || 0}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>

        {filteredMembers?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Geen deelnemers gevonden
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PredictionsOverview;