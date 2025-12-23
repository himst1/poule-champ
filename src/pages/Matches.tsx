import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Filter, Trophy, Clock, Check, X, LogIn, Loader2 } from "lucide-react";
import { format, parseISO, isBefore } from "date-fns";
import { nl } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type Match = {
  id: string;
  home_team: string;
  away_team: string;
  home_flag: string | null;
  away_flag: string | null;
  home_score: number | null;
  away_score: number | null;
  kickoff_time: string;
  phase: string | null;
  status: "pending" | "live" | "finished";
};

type Prediction = {
  id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points_earned: number | null;
};

const PHASES = [
  "Alle fases",
  "Groep A", "Groep B", "Groep C", "Groep D", "Groep E", "Groep F",
  "Groep G", "Groep H", "Groep I", "Groep J", "Groep K", "Groep L",
  "Achtste finale", "Kwartfinale", "Halve finale", "Troostfinale", "Finale"
];

const Matches = () => {
  const [selectedPhase, setSelectedPhase] = useState("Alle fases");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("kickoff_time", { ascending: true });
      
      if (error) throw error;
      return data as Match[];
    },
  });

  // Fetch user predictions (without poule filter for now - personal predictions)
  const { data: predictions } = useQuery({
    queryKey: ["predictions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data as Prediction[];
    },
    enabled: !!user,
  });

  const predictionMap = useMemo(() => {
    const map: Record<string, Prediction> = {};
    predictions?.forEach(p => {
      map[p.match_id] = p;
    });
    return map;
  }, [predictions]);

  const availableDates = useMemo(() => {
    if (!matches) return [];
    const dates = new Set(matches.map(m => format(parseISO(m.kickoff_time), "yyyy-MM-dd")));
    return Array.from(dates).sort();
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    
    return matches.filter(match => {
      const matchDate = format(parseISO(match.kickoff_time), "yyyy-MM-dd");
      const phaseMatch = selectedPhase === "Alle fases" || match.phase === selectedPhase;
      const dateMatch = !selectedDate || matchDate === selectedDate;
      return phaseMatch && dateMatch;
    });
  }, [matches, selectedPhase, selectedDate]);

  const groupedMatches = useMemo(() => {
    const groups: Record<string, Match[]> = {};
    filteredMatches.forEach(match => {
      const date = format(parseISO(match.kickoff_time), "EEEE d MMMM yyyy", { locale: nl });
      if (!groups[date]) groups[date] = [];
      groups[date].push(match);
    });
    return groups;
  }, [filteredMatches]);

  const predictedCount = predictions?.length || 0;
  const totalMatches = matches?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">FIFA World Cup 2026</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              WK 2026 <span className="gradient-text">Wedstrijden</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Bekijk alle 106 wedstrijden van het WK 2026 in de VS, Canada en Mexico
            </p>
          </div>

          {/* Prediction Stats for logged in users */}
          {user && (
            <div className="glass-card rounded-2xl p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">Jouw voorspellingen</h3>
                  <p className="text-muted-foreground text-sm">
                    {predictedCount} van {totalMatches} wedstrijden voorspeld
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                      style={{ width: `${totalMatches > 0 ? (predictedCount / totalMatches) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {totalMatches > 0 ? Math.round((predictedCount / totalMatches) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Login CTA for non-logged in users */}
          {!user && (
            <div className="glass-card rounded-2xl p-6 mb-8 border-primary/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Doe mee met voorspellen!</h3>
                    <p className="text-muted-foreground text-sm">
                      Log in of registreer om je voorspellingen te plaatsen
                    </p>
                  </div>
                </div>
                <Button variant="hero" onClick={() => navigate("/auth")}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Inloggen / Registreren
                </Button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="glass-card rounded-2xl p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Phase Filter */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Filter op fase</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PHASES.map(phase => (
                    <Button
                      key={phase}
                      variant={selectedPhase === phase ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPhase(phase)}
                      className={selectedPhase === phase ? "glow-primary" : ""}
                    >
                      {phase}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Date Filter */}
              <div className="lg:w-64">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Filter op datum</span>
                </div>
                <select
                  value={selectedDate || ""}
                  onChange={(e) => setSelectedDate(e.target.value || null)}
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Alle datums</option>
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {format(parseISO(date), "d MMMM yyyy", { locale: nl })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              <span className="text-foreground font-semibold">{filteredMatches.length}</span> wedstrijden gevonden
            </p>
            {(selectedPhase !== "Alle fases" || selectedDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPhase("Alle fases");
                  setSelectedDate(null);
                }}
              >
                Filters wissen
              </Button>
            )}
          </div>

          {/* Matches List */}
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse bg-card">
                  <div className="h-16 bg-muted rounded" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedMatches).map(([date, dayMatches]) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      {date}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  
                  <div className="space-y-2">
                    {dayMatches.map(match => (
                      <MatchRow 
                        key={match.id} 
                        match={match} 
                        prediction={predictionMap[match.id]}
                        isLoggedIn={!!user}
                        userId={user?.id}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {filteredMatches.length === 0 && (
                <div className="text-center py-16">
                  <Trophy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Geen wedstrijden gevonden</h3>
                  <p className="text-muted-foreground">Pas je filters aan om wedstrijden te bekijken</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

interface MatchRowProps {
  match: Match;
  prediction?: Prediction;
  isLoggedIn: boolean;
  userId?: string;
}

const MatchRow = ({ match, prediction, isLoggedIn, userId }: MatchRowProps) => {
  const kickoffDate = parseISO(match.kickoff_time);
  const isFinished = match.status === "finished";
  const isLive = match.status === "live";
  const canPredict = !isFinished && !isLive && isBefore(new Date(), kickoffDate);
  
  const [homeScore, setHomeScore] = useState(prediction?.predicted_home_score?.toString() || "");
  const [awayScore, setAwayScore] = useState(prediction?.predicted_away_score?.toString() || "");
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const savePrediction = async () => {
    if (!userId || homeScore === "" || awayScore === "") return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("predictions")
        .upsert({
          id: prediction?.id,
          user_id: userId,
          match_id: match.id,
          poule_id: "00000000-0000-0000-0000-000000000000",
          predicted_home_score: parseInt(homeScore),
          predicted_away_score: parseInt(awayScore),
        }, {
          onConflict: "id"
        });
      
      if (error) throw error;
      
      toast({
        title: "Opgeslagen!",
        description: `${match.home_team} ${homeScore} - ${awayScore} ${match.away_team}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Probeer het opnieuw",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanged = prediction 
    ? homeScore !== prediction.predicted_home_score?.toString() || awayScore !== prediction.predicted_away_score?.toString()
    : homeScore !== "" || awayScore !== "";

  return (
    <div className={`flex items-center gap-2 md:gap-4 p-3 rounded-lg transition-all ${
      prediction ? "bg-primary/5 border border-primary/20" : "bg-card border border-border/50 hover:border-border"
    }`}>
      {/* Time */}
      <div className="w-12 shrink-0 text-center">
        <span className="text-xs text-muted-foreground font-medium">
          {format(kickoffDate, "HH:mm")}
        </span>
      </div>

      {/* Phase Badge */}
      <div className="hidden sm:block w-20 shrink-0">
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium truncate ${
          match.phase?.startsWith("Groep") 
            ? "bg-primary/10 text-primary"
            : "bg-accent/10 text-accent"
        }`}>
          {match.phase}
        </span>
      </div>

      {/* Home Team */}
      <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
        <span className="text-sm font-medium truncate text-right">{match.home_team}</span>
        <span className="text-base shrink-0">{match.home_flag}</span>
      </div>

      {/* Score / Prediction Input */}
      <div className="shrink-0 flex items-center gap-1">
        {isFinished || isLive ? (
          <div className={`flex items-center gap-1 px-2 py-1 rounded ${isLive ? "bg-destructive/20" : "bg-secondary"}`}>
            <span className="w-6 text-center font-bold text-sm">{match.home_score}</span>
            <span className="text-muted-foreground text-xs">-</span>
            <span className="w-6 text-center font-bold text-sm">{match.away_score}</span>
            {isLive && <span className="text-[10px] text-destructive font-bold ml-1">LIVE</span>}
          </div>
        ) : isLoggedIn && canPredict ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              max="99"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              className="w-10 h-8 text-center text-sm font-bold p-0"
              placeholder="-"
            />
            <span className="text-muted-foreground text-xs">-</span>
            <Input
              type="number"
              min="0"
              max="99"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              className="w-10 h-8 text-center text-sm font-bold p-0"
              placeholder="-"
            />
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-secondary">
            <span className="w-6 text-center text-muted-foreground text-sm">-</span>
            <span className="text-muted-foreground text-xs">-</span>
            <span className="w-6 text-center text-muted-foreground text-sm">-</span>
          </div>
        )}
      </div>

      {/* Away Team */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-base shrink-0">{match.away_flag}</span>
        <span className="text-sm font-medium truncate">{match.away_team}</span>
      </div>

      {/* Save Button / Points */}
      <div className="w-16 shrink-0 flex justify-end">
        {isLoggedIn && canPredict && hasChanged ? (
          <Button
            size="sm"
            variant="default"
            className="h-7 px-2 text-xs"
            onClick={savePrediction}
            disabled={isSaving || homeScore === "" || awayScore === ""}
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          </Button>
        ) : prediction && (isFinished || isLive) && prediction.points_earned !== null ? (
          <span className={`text-sm font-bold ${prediction.points_earned > 0 ? "text-primary" : "text-muted-foreground"}`}>
            +{prediction.points_earned}
          </span>
        ) : prediction ? (
          <Check className="w-4 h-4 text-primary" />
        ) : null}
      </div>
    </div>
  );
};

export default Matches;
