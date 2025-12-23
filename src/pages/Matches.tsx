import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Filter, Trophy, Clock, Check, X, LogIn, Loader2, Bell, BellOff } from "lucide-react";
import { format, parseISO, isBefore, differenceInSeconds, differenceInMinutes } from "date-fns";
import { nl } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Countdown hook for upcoming matches
const useCountdown = (targetDate: Date) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = differenceInSeconds(targetDate, new Date());
    return diff > 0 ? diff : 0;
  });

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      const diff = differenceInSeconds(targetDate, new Date());
      setTimeLeft(diff > 0 ? diff : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, timeLeft]);

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return { days, hours, minutes, seconds, totalSeconds: timeLeft };
};

// Countdown display component
const CountdownTimer = ({ kickoffDate }: { kickoffDate: Date }) => {
  const { days, hours, minutes, seconds, totalSeconds } = useCountdown(kickoffDate);

  if (totalSeconds <= 0) return null;

  // Show countdown only for matches within 24 hours
  if (days > 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span>{days}d {hours}u</span>
      </div>
    );
  }

  // Within 1 hour - show urgent countdown
  if (hours === 0 && minutes < 60) {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium animate-pulse">
        <Clock className="w-3 h-3" />
        <span>{minutes}:{seconds.toString().padStart(2, '0')}</span>
      </div>
    );
  }

  // Within 24 hours
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
      <Clock className="w-3 h-3" />
      <span>{hours}u {minutes}m</span>
    </div>
  );
};

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

// Team name to ISO country code mapping for WK 2026
const COUNTRY_CODES: Record<string, string> = {
  // Group A - North America
  "Verenigde Staten": "us", "VS": "us", "USA": "us",
  "Mexico": "mx", "Canada": "ca",
  // Europe
  "Nederland": "nl", "Duitsland": "de", "Frankrijk": "fr", "Spanje": "es",
  "Engeland": "gb-eng", "Italië": "it", "Portugal": "pt", "België": "be",
  "Kroatië": "hr", "Zwitserland": "ch", "Denemarken": "dk", "Polen": "pl",
  "Servië": "rs", "Oekraïne": "ua", "Oostenrijk": "at", "Tsjechië": "cz",
  "Wales": "gb-wls", "Schotland": "gb-sct", "Zweden": "se", "Noorwegen": "no",
  "Griekenland": "gr", "Turkije": "tr", "Roemenië": "ro", "Hongarije": "hu",
  "Slowakije": "sk", "Slovenië": "si", "Finland": "fi", "Ierland": "ie",
  // South America
  "Brazilië": "br", "Argentinië": "ar", "Uruguay": "uy", "Colombia": "co",
  "Chili": "cl", "Ecuador": "ec", "Peru": "pe", "Paraguay": "py",
  "Venezuela": "ve", "Bolivia": "bo",
  // Africa
  "Marokko": "ma", "Senegal": "sn", "Ghana": "gh", "Kameroen": "cm",
  "Nigeria": "ng", "Tunesië": "tn", "Egypte": "eg", "Algerije": "dz",
  "Zuid-Afrika": "za", "Ivoorkust": "ci", "Mali": "ml",
  // Asia
  "Japan": "jp", "Zuid-Korea": "kr", "Australië": "au", "Saoedi-Arabië": "sa",
  "Iran": "ir", "Qatar": "qa", "China": "cn", "Indonesië": "id",
  "Bahrein": "bh", "Irak": "iq", "VAE": "ae", "Oman": "om", "Jordanië": "jo",
  "Oezbekistan": "uz", "Thailand": "th", "Vietnam": "vn", "India": "in",
  // CONCACAF
  "Costa Rica": "cr", "Jamaica": "jm", "Honduras": "hn", "Panama": "pa",
  "El Salvador": "sv", "Guatemala": "gt", "Trinidad en Tobago": "tt",
  // Oceania
  "Nieuw-Zeeland": "nz",
};

// Get flag image URL from Flagcdn
const getFlagUrl = (teamName: string | null): string | null => {
  if (!teamName) return null;
  const code = COUNTRY_CODES[teamName];
  if (!code) return null;
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
};

// Flag image component
const FlagImage = ({ teamName, className = "" }: { teamName: string | null; className?: string }) => {
  const flagUrl = getFlagUrl(teamName);
  const code = teamName ? COUNTRY_CODES[teamName]?.toUpperCase() : null;
  
  if (!flagUrl) {
    return <span className={`text-muted-foreground text-xs ${className}`}>--</span>;
  }
  
  return (
    <img
      src={flagUrl}
      alt={`Vlag van ${teamName}`}
      className={`w-6 h-4 object-cover rounded-sm shadow-sm ${className}`}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
};

const Matches = () => {
  const [selectedPhase, setSelectedPhase] = useState("Alle fases");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem("matchNotifications") === "true";
  });
  const notifiedMatchesRef = useRef<Set<string>>(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant chime sound
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
    oscillator1.type = "sine";
    oscillator2.type = "sine";
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
    
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.8);
    oscillator2.stop(audioContext.currentTime + 0.8);
  }, []);

  // Toggle notifications
  const toggleNotifications = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem("matchNotifications", String(newValue));
    
    if (newValue) {
      // Test sound when enabling
      playNotificationSound();
      toast({
        title: "🔔 Notificaties ingeschakeld",
        description: "Je krijgt een melding 5 minuten voor wedstrijdaanvang",
      });
    } else {
      toast({
        title: "🔕 Notificaties uitgeschakeld",
        description: "Je ontvangt geen meldingen meer",
      });
    }
  };

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

  // Check for upcoming matches and show notification
  useEffect(() => {
    if (!notificationsEnabled || !matches) return;

    const checkUpcomingMatches = () => {
      const now = new Date();
      
      matches.forEach(match => {
        if (match.status !== "pending") return;
        
        const kickoffDate = parseISO(match.kickoff_time);
        const minutesUntilKickoff = differenceInMinutes(kickoffDate, now);
        
        // Notify when match is between 4-5 minutes away (to avoid repeat notifications)
        if (minutesUntilKickoff >= 4 && minutesUntilKickoff <= 5 && !notifiedMatchesRef.current.has(match.id)) {
          notifiedMatchesRef.current.add(match.id);
          
          playNotificationSound();
          
          toast({
            title: "⚽ Wedstrijd begint zo!",
            description: `${match.home_team} vs ${match.away_team} begint over ${minutesUntilKickoff} minuten`,
            duration: 10000,
          });
        }
      });
    };

    // Check immediately and then every 30 seconds
    checkUpcomingMatches();
    const interval = setInterval(checkUpcomingMatches, 30000);

    return () => clearInterval(interval);
  }, [notificationsEnabled, matches, playNotificationSound, toast]);

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
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Bekijk alle 106 wedstrijden van het WK 2026 in de VS, Canada en Mexico
            </p>
            
            {/* Notification Toggle */}
            <Button
              variant={notificationsEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleNotifications}
              className={notificationsEnabled ? "glow-primary" : ""}
            >
              {notificationsEnabled ? (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Notificaties aan
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4 mr-2" />
                  Notificaties uit
                </>
              )}
            </Button>
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
      {/* Time / Countdown */}
      <div className="w-20 shrink-0 flex flex-col items-center gap-0.5">
        <span className="text-xs text-muted-foreground font-medium">
          {format(kickoffDate, "HH:mm")}
        </span>
        {canPredict && <CountdownTimer kickoffDate={kickoffDate} />}
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
        <FlagImage teamName={match.home_team} />
      </div>

      {/* Score / Prediction Input */}
      <div className="shrink-0 flex items-center gap-1">
        {isFinished || isLive ? (
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded ${isLive ? "bg-destructive/20" : "bg-secondary"}`}>
            <span className="w-8 text-center font-bold text-base">{match.home_score}</span>
            <span className="text-muted-foreground text-sm">-</span>
            <span className="w-8 text-center font-bold text-base">{match.away_score}</span>
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
          <div className="flex items-center gap-1 px-3 py-1.5 rounded bg-secondary">
            <span className="w-8 text-center text-muted-foreground text-base">-</span>
            <span className="text-muted-foreground text-sm">-</span>
            <span className="w-8 text-center text-muted-foreground text-base">-</span>
          </div>
        )}
      </div>

      {/* Away Team */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <FlagImage teamName={match.away_team} />
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
