import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Calendar, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, format } from "date-fns";
import { nl } from "date-fns/locale";

interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TournamentBanner = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState<CountdownValues | null>(null);

  // Fetch active tournament
  const { data: activeTournament } = useQuery({
    queryKey: ["active-tournament-banner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("id, name, year, type")
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch first upcoming match
  const { data: firstMatch } = useQuery({
    queryKey: ["first-upcoming-match"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, home_team, away_team, kickoff_time, stadium, city")
        .eq("status", "pending")
        .gt("kickoff_time", new Date().toISOString())
        .order("kickoff_time", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Update countdown every second
  useEffect(() => {
    if (!firstMatch?.kickoff_time) return;

    const updateCountdown = () => {
      const now = new Date();
      const kickoff = new Date(firstMatch.kickoff_time);
      
      if (kickoff <= now) {
        setCountdown(null);
        return;
      }

      const days = differenceInDays(kickoff, now);
      const hours = differenceInHours(kickoff, now) % 24;
      const minutes = differenceInMinutes(kickoff, now) % 60;
      const seconds = differenceInSeconds(kickoff, now) % 60;

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [firstMatch?.kickoff_time]);

  if (!activeTournament) return null;

  const tournamentTypeLabel = {
    world_cup: "Wereldkampioenschap",
    euro: "Europees Kampioenschap",
    copa_america: "Copa América",
    nations_league: "Nations League",
    other: "Toernooi",
  }[activeTournament.type] || "Toernooi";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border border-primary/30">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Tournament Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-primary font-medium uppercase tracking-wide">
                {tournamentTypeLabel}
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                {activeTournament.name}
              </h2>
              {firstMatch && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Eerste wedstrijd: {firstMatch.home_team} vs {firstMatch.away_team}
                </p>
              )}
            </div>
          </div>

          {/* Countdown */}
          {countdown && (
            <div className="flex flex-col items-center lg:items-end gap-3">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Aftellen naar de eerste wedstrijd
              </p>
              <div className="flex gap-3">
                <CountdownBlock value={countdown.days} label="dagen" />
                <CountdownBlock value={countdown.hours} label="uren" />
                <CountdownBlock value={countdown.minutes} label="min" />
                <CountdownBlock value={countdown.seconds} label="sec" />
              </div>
              {firstMatch?.kickoff_time && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(firstMatch.kickoff_time), "EEEE d MMMM yyyy 'om' HH:mm", { locale: nl })}
                </p>
              )}
            </div>
          )}

          {!countdown && firstMatch && (
            <div className="text-center lg:text-right">
              <p className="text-lg font-semibold text-primary">Het toernooi is begonnen!</p>
              <p className="text-sm text-muted-foreground">Doe je voorspellingen voor de komende wedstrijden</p>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button 
            variant="hero" 
            size="lg" 
            onClick={() => navigate("/matches")}
            className="gap-2"
          >
            Bekijk Wedstrijden
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => navigate("/create-poule")}
            className="gap-2"
          >
            Start een Poule
          </Button>
        </div>
      </div>
    </div>
  );
};

const CountdownBlock = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-background/80 backdrop-blur border border-border flex items-center justify-center">
      <span className="font-display text-2xl sm:text-3xl font-bold text-primary">
        {value.toString().padStart(2, "0")}
      </span>
    </div>
    <span className="text-xs text-muted-foreground mt-1">{label}</span>
  </div>
);

export default TournamentBanner;