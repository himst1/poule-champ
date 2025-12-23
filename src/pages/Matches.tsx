import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, Trophy, Clock, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

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

const PHASES = [
  "Alle fases",
  "Groep A", "Groep B", "Groep C", "Groep D", "Groep E", "Groep F",
  "Groep G", "Groep H", "Groep I", "Groep J", "Groep K", "Groep L",
  "Achtste finale", "Kwartfinale", "Halve finale", "Troostfinale", "Finale"
];

const Matches = () => {
  const [selectedPhase, setSelectedPhase] = useState("Alle fases");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
                  
                  <div className="grid gap-3">
                    {dayMatches.map(match => (
                      <MatchCard key={match.id} match={match} />
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

const MatchCard = ({ match }: { match: Match }) => {
  const kickoffDate = parseISO(match.kickoff_time);
  const isFinished = match.status === "finished";
  const isLive = match.status === "live";

  return (
    <Card className="group p-4 md:p-6 bg-card hover:bg-card/80 border-border/50 transition-all hover:border-primary/30">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Phase Badge */}
        <div className="md:w-32 shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            match.phase?.startsWith("Groep") 
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-accent/10 text-accent border border-accent/20"
          }`}>
            {match.phase}
          </span>
        </div>

        {/* Teams */}
        <div className="flex-1 flex items-center justify-center gap-4 md:gap-8">
          {/* Home Team */}
          <div className="flex-1 flex items-center justify-end gap-3">
            <span className="font-semibold text-right truncate">{match.home_team}</span>
            <span className="text-2xl shrink-0">{match.home_flag}</span>
          </div>

          {/* Score / Time */}
          <div className="shrink-0 w-24 text-center">
            {isFinished || isLive ? (
              <div className={`px-4 py-2 rounded-lg ${isLive ? "bg-destructive/20 animate-pulse" : "bg-secondary"}`}>
                <span className="text-xl font-bold">
                  {match.home_score} - {match.away_score}
                </span>
                {isLive && <span className="block text-xs text-destructive font-medium">LIVE</span>}
              </div>
            ) : (
              <div className="px-4 py-2 rounded-lg bg-secondary">
                <span className="text-lg font-bold">VS</span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 flex items-center gap-3">
            <span className="text-2xl shrink-0">{match.away_flag}</span>
            <span className="font-semibold truncate">{match.away_team}</span>
          </div>
        </div>

        {/* Time */}
        <div className="md:w-32 shrink-0 flex items-center justify-end gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{format(kickoffDate, "HH:mm")}</span>
        </div>
      </div>
    </Card>
  );
};

export default Matches;
