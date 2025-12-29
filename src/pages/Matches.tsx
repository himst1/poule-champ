import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Filter, Trophy, Clock, Check, X, LogIn, Loader2, Bell, BellOff, Star, StarOff, Brain, Save, Users, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, isBefore, differenceInSeconds, differenceInMinutes, addMinutes } from "date-fns";
import { nl } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIPredictionModal } from "@/components/AIPredictionModal";
import { BulkAIPredictionModal } from "@/components/BulkAIPredictionModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AIPredictionStats } from "@/components/AIPredictionStats";
import { AIPredictionChart } from "@/components/AIPredictionChart";
import { FlagImage } from "@/components/FlagImage";
import { COUNTRY_CODES, ALL_COUNTRIES, getFlagUrl } from "@/lib/flags";

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

  // More than 7 days - don't show
  if (days > 7) {
    return null;
  }

  // More than 24 hours
  if (days > 0) {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-secondary/80 text-muted-foreground text-xs">
        <Clock className="w-3 h-3" />
        <span>{days}d {hours}u</span>
      </div>
    );
  }

  // Less than 24 hours but more than 1 hour
  if (hours > 0) {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-accent/20 text-accent text-xs font-medium">
        <Clock className="w-3 h-3" />
        <span>{hours}u {minutes}m {seconds.toString().padStart(2, '0')}s</span>
      </div>
    );
  }

  // Less than 1 hour - urgent countdown with seconds
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-destructive/20 text-destructive text-xs font-bold animate-pulse">
      <Clock className="w-3 h-3" />
      <span>{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}</span>
    </div>
  );
};

type Match = {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  kickoff_time: string;
  phase: string | null;
  status: "pending" | "live" | "finished";
  stadium: string | null;
  city: string | null;
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

// Use centralized FlagImage and utilities from lib/flags

const Matches = () => {
  const [selectedPhase, setSelectedPhase] = useState("Alle fases");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteCountries, setFavoriteCountries] = useState<string[]>(() => {
    const saved = localStorage.getItem("favoriteCountries");
    return saved ? JSON.parse(saved) : [];
  });
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem("matchNotifications") === "true";
  });
  const [selectedPouleId, setSelectedPouleId] = useState<string | null>(() => {
    return localStorage.getItem("selectedPouleId");
  });
  const notifiedMatchesRef = useRef<Set<string>>(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch user's poules
  const { data: userPoules } = useQuery({
    queryKey: ["user-poules", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("poule_members")
        .select(`
          poule_id,
          poules (
            id,
            name
          )
        `)
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data?.map(d => d.poules).filter(Boolean) as { id: string; name: string }[] || [];
    },
    enabled: !!user,
  });

  // Auto-select first poule if none selected
  useEffect(() => {
    if (userPoules && userPoules.length > 0 && !selectedPouleId) {
      const firstPouleId = userPoules[0].id;
      setSelectedPouleId(firstPouleId);
      localStorage.setItem("selectedPouleId", firstPouleId);
    }
  }, [userPoules, selectedPouleId]);

  // Handle poule selection change
  const handlePouleChange = (pouleId: string) => {
    setSelectedPouleId(pouleId);
    localStorage.setItem("selectedPouleId", pouleId);
    // Clear local scores when switching poules
    setLocalScores({});
    setBulkPredictions({});
    setAiGeneratedMatches(new Set());
  };

  // Toggle favorite country - automatically enable filter when selecting
  const toggleFavorite = (country: string) => {
    setFavoriteCountries(prev => {
      const newFavorites = prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country];
      localStorage.setItem("favoriteCountries", JSON.stringify(newFavorites));
      
      // Automatically enable filter when adding a favorite
      if (!prev.includes(country) && newFavorites.length > 0) {
        setShowOnlyFavorites(true);
      }
      // Automatically disable filter when removing the last favorite
      if (prev.includes(country) && newFavorites.length === 0) {
        setShowOnlyFavorites(false);
      }
      
      return newFavorites;
    });
  };

  // Clear all favorites
  const clearFavorites = () => {
    setFavoriteCountries([]);
    localStorage.setItem("favoriteCountries", JSON.stringify([]));
    setShowOnlyFavorites(false);
  };

  // Bulk AI prediction state
  const [showBulkAIPrediction, setShowBulkAIPrediction] = useState(false);
  const [bulkPredictions, setBulkPredictions] = useState<Record<string, { homeScore: number; awayScore: number }>>({});
  const [localScores, setLocalScores] = useState<Record<string, { homeScore: string; awayScore: string }>>({});
  const [aiGeneratedMatches, setAiGeneratedMatches] = useState<Set<string>>(new Set());
  const [isSavingAll, setIsSavingAll] = useState(false);
  const queryClient = useQueryClient();

  // Handle local score changes from MatchRow
  const handleLocalScoreChange = useCallback((matchId: string, homeScore: string, awayScore: string) => {
    setLocalScores(prev => ({
      ...prev,
      [matchId]: { homeScore, awayScore }
    }));
  }, []);

  // Handle bulk predictions applied
  const handleBulkPredictionsApplied = (predictions: { matchId: string; homeScore: number; awayScore: number }[]) => {
    const newBulkPredictions: Record<string, { homeScore: number; awayScore: number }> = {};
    const newLocalScores: Record<string, { homeScore: string; awayScore: string }> = { ...localScores };
    const newAiGenerated = new Set(aiGeneratedMatches);
    predictions.forEach(p => {
      newBulkPredictions[p.matchId] = { homeScore: p.homeScore, awayScore: p.awayScore };
      newLocalScores[p.matchId] = { homeScore: p.homeScore.toString(), awayScore: p.awayScore.toString() };
      newAiGenerated.add(p.matchId);
    });
    setBulkPredictions(newBulkPredictions);
    setLocalScores(newLocalScores);
    setAiGeneratedMatches(newAiGenerated);
  };

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

  // Fetch user predictions for selected poule
  const { data: predictions } = useQuery({
    queryKey: ["predictions", user?.id, selectedPouleId],
    queryFn: async () => {
      if (!user || !selectedPouleId) return [];
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", user.id)
        .eq("poule_id", selectedPouleId);
      
      if (error) throw error;
      return data as Prediction[];
    },
    enabled: !!user && !!selectedPouleId,
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
      
      // Search filter - match team names, stadium, or city
      const searchLower = searchQuery.toLowerCase().trim();
      const searchMatch = !searchLower || 
        match.home_team.toLowerCase().includes(searchLower) ||
        match.away_team.toLowerCase().includes(searchLower) ||
        (match.stadium && match.stadium.toLowerCase().includes(searchLower)) ||
        (match.city && match.city.toLowerCase().includes(searchLower));
      
      // Favorite countries filter - when favorites are selected AND showOnlyFavorites is true
      const favoriteMatch = favoriteCountries.length === 0 || !showOnlyFavorites || 
        favoriteCountries.includes(match.home_team) || 
        favoriteCountries.includes(match.away_team);
      
      return phaseMatch && dateMatch && searchMatch && favoriteMatch;
    });
  }, [matches, selectedPhase, selectedDate, searchQuery, showOnlyFavorites, favoriteCountries]);

  // Get predictable matches (pending matches that haven't started yet)
  const predictableMatches = useMemo(() => {
    if (!matches) return [];
    return matches.filter(match => {
      const kickoffDate = parseISO(match.kickoff_time);
      return match.status === "pending" && isBefore(new Date(), kickoffDate);
    });
  }, [matches]);

  // Get all unsaved predictions
  const unsavedPredictions = useMemo(() => {
    const unsaved: { matchId: string; homeScore: number; awayScore: number; isAiGenerated: boolean; existingId?: string }[] = [];
    
    Object.entries(localScores).forEach(([matchId, scores]) => {
      if (scores.homeScore === "" || scores.awayScore === "") return;
      
      const match = predictableMatches.find(m => m.id === matchId);
      if (!match) return;
      
      // Check if match is still open for predictions
      const kickoffDate = parseISO(match.kickoff_time);
      if (!isBefore(new Date(), kickoffDate)) return;
      
      const existingPrediction = predictionMap[matchId];
      const homeScore = parseInt(scores.homeScore);
      const awayScore = parseInt(scores.awayScore);
      const isAiGenerated = aiGeneratedMatches.has(matchId);
      
      // Only add if it's new or different from existing
      if (!existingPrediction) {
        unsaved.push({ matchId, homeScore, awayScore, isAiGenerated });
      } else if (
        existingPrediction.predicted_home_score !== homeScore ||
        existingPrediction.predicted_away_score !== awayScore
      ) {
        unsaved.push({ matchId, homeScore, awayScore, isAiGenerated, existingId: existingPrediction.id });
      }
    });
    
    return unsaved;
  }, [localScores, predictableMatches, predictionMap, aiGeneratedMatches]);

  // Save all unsaved predictions
  const saveAllPredictions = async () => {
    if (!user || unsavedPredictions.length === 0 || !selectedPouleId) return;
    
    setIsSavingAll(true);
    try {
      const newPredictions = unsavedPredictions.filter(p => !p.existingId);
      const updates = unsavedPredictions.filter(p => p.existingId);
      
      // Insert new predictions
      if (newPredictions.length > 0) {
        const { error: insertError } = await supabase
          .from("predictions")
          .insert(
            newPredictions.map(p => ({
              user_id: user.id,
              match_id: p.matchId,
              poule_id: selectedPouleId,
              predicted_home_score: p.homeScore,
              predicted_away_score: p.awayScore,
              is_ai_generated: p.isAiGenerated,
            }))
          );
        
        if (insertError) throw insertError;
      }
      
      // Update existing predictions
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from("predictions")
          .update({
            predicted_home_score: update.homeScore,
            predicted_away_score: update.awayScore,
            is_ai_generated: update.isAiGenerated,
          })
          .eq("id", update.existingId);
        
        if (updateError) throw updateError;
      }
      
      toast({
        title: "Alle voorspellingen opgeslagen!",
        description: `${unsavedPredictions.length} voorspelling${unsavedPredictions.length > 1 ? 'en' : ''} opgeslagen`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
      queryClient.invalidateQueries({ queryKey: ["ai-prediction-stats"] });
      setLocalScores({});
      setBulkPredictions({});
      setAiGeneratedMatches(new Set());
    } catch (error: any) {
      toast({
        title: "Fout bij opslaan",
        description: error.message || "Probeer het opnieuw",
        variant: "destructive",
      });
    } finally {
      setIsSavingAll(false);
    }
  };

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
            <>
              <div className="glass-card rounded-2xl p-6 mb-8">
                <div className="flex flex-col gap-4">
                  {/* Poule Selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Voorspellingen voor poule:</span>
                    </div>
                    {userPoules && userPoules.length > 0 ? (
                      <Select value={selectedPouleId || ""} onValueChange={handlePouleChange}>
                        <SelectTrigger className="w-full sm:w-64">
                          <SelectValue placeholder="Selecteer een poule" />
                        </SelectTrigger>
                        <SelectContent>
                          {userPoules.map(poule => (
                            <SelectItem key={poule.id} value={poule.id}>
                              {poule.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Je bent nog geen lid van een poule.</span>
                        <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                          Bekijk poules
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Stats row */}
                  {selectedPouleId && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-border">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Jouw voorspellingen</h3>
                        <p className="text-muted-foreground text-sm">
                          {predictedCount} van {totalMatches} wedstrijden voorspeld
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
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
                        
                        {/* Save All Button */}
                        {unsavedPredictions.length > 0 && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={saveAllPredictions}
                            disabled={isSavingAll}
                            className="gap-2 glow-primary"
                          >
                            {isSavingAll ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            Sla alles op
                            <span className="bg-primary-foreground/20 text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                              {unsavedPredictions.length}
                            </span>
                          </Button>
                        )}
                        
                        {/* Bulk AI Prediction Button */}
                        {predictableMatches.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowBulkAIPrediction(true)}
                            className="gap-2"
                          >
                            <Brain className="w-4 h-4 text-primary" />
                            Bulk AI
                            <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded">
                              {predictableMatches.length}
                            </span>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* AI Prediction Stats */}
              {selectedPouleId && <AIPredictionStats pouleId={selectedPouleId} />}
              
              {/* AI Prediction Chart */}
              {selectedPouleId && <AIPredictionChart pouleId={selectedPouleId} />}
            </>
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
            <div className="flex flex-col gap-6">
              {/* Search Bar */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Zoek wedstrijden</span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Zoek op land, stad of stadion..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-secondary border-border"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

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

              <div className="flex flex-col lg:flex-row gap-6">
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

                {/* Favorite Countries Filter */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Favoriete landen</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Star className="w-4 h-4" />
                          Selecteer landen
                          {favoriteCountries.length > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                              {favoriteCountries.length}
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <div className="p-3 border-b border-border">
                          <h4 className="font-medium text-sm">Kies je favoriete landen</h4>
                          <p className="text-xs text-muted-foreground">
                            Selecteer landen om hun wedstrijden te filteren
                          </p>
                        </div>
                        <ScrollArea className="h-72">
                          <div className="p-2 space-y-1">
                            {ALL_COUNTRIES.map(country => (
                              <label
                                key={country}
                                className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-secondary cursor-pointer"
                              >
                                <Checkbox
                                  checked={favoriteCountries.includes(country)}
                                  onCheckedChange={() => toggleFavorite(country)}
                                />
                                <FlagImage teamName={country} size="sm" />
                                <span className="text-sm">{country}</span>
                              </label>
                            ))}
                          </div>
                        </ScrollArea>
                        {favoriteCountries.length > 0 && (
                          <div className="p-2 border-t border-border">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-muted-foreground"
                              onClick={clearFavorites}
                            >
                              <X className="w-3 h-3 mr-2" />
                              Alle favorieten wissen
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>

                    {/* Show selected favorites as chips */}
                    {favoriteCountries.slice(0, 5).map(country => (
                      <div
                        key={country}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20"
                      >
                        <FlagImage teamName={country} size="sm" />
                        <span className="text-xs font-medium">{country}</span>
                        <button
                          onClick={() => toggleFavorite(country)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {favoriteCountries.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{favoriteCountries.length - 5} meer
                      </span>
                    )}

                    {/* Toggle to show only favorites */}
                    {favoriteCountries.length > 0 && (
                      <Button
                        variant={showOnlyFavorites ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                        className={showOnlyFavorites ? "glow-primary" : ""}
                      >
                        {showOnlyFavorites ? (
                          <>
                            <Star className="w-4 h-4 mr-1 fill-current" />
                            Alleen favorieten
                          </>
                        ) : (
                          <>
                            <StarOff className="w-4 h-4 mr-1" />
                            Toon alle landen
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              <span className="text-foreground font-semibold">{filteredMatches.length}</span> wedstrijden gevonden
              {showOnlyFavorites && favoriteCountries.length > 0 && (
                <span className="ml-2 text-primary">
                  (favorieten: {favoriteCountries.join(", ")})
                </span>
              )}
            </p>
            {(selectedPhase !== "Alle fases" || selectedDate || showOnlyFavorites || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPhase("Alle fases");
                  setSelectedDate(null);
                  setShowOnlyFavorites(false);
                  setSearchQuery("");
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
                        pouleId={selectedPouleId}
                        bulkPrediction={bulkPredictions[match.id]}
                        onScoreChange={(home, away) => handleLocalScoreChange(match.id, home, away)}
                        onSave={() => {
                          queryClient.invalidateQueries({ queryKey: ["predictions"] });
                          queryClient.invalidateQueries({ queryKey: ["ai-prediction-stats"] });
                          setLocalScores(prev => {
                            const newScores = { ...prev };
                            delete newScores[match.id];
                            return newScores;
                          });
                          setAiGeneratedMatches(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(match.id);
                            return newSet;
                          });
                        }}
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

      {/* Bulk AI Prediction Modal */}
      <BulkAIPredictionModal
        isOpen={showBulkAIPrediction}
        onClose={() => setShowBulkAIPrediction(false)}
        matches={predictableMatches}
        onApplyPredictions={handleBulkPredictionsApplied}
      />
    </div>
  );
};

interface MatchRowProps {
  match: Match;
  prediction?: Prediction;
  isLoggedIn: boolean;
  userId?: string;
  pouleId?: string | null;
  bulkPrediction?: { homeScore: number; awayScore: number };
  onScoreChange?: (homeScore: string, awayScore: string) => void;
  onSave?: () => void;
}

const MatchRow = ({ match, prediction, isLoggedIn, userId, pouleId, bulkPrediction, onScoreChange, onSave }: MatchRowProps) => {
  const kickoffDate = parseISO(match.kickoff_time);
  const isFinished = match.status === "finished";
  const isLive = match.status === "live";
  const canPredict = !isFinished && !isLive && isBefore(new Date(), kickoffDate) && !!pouleId;
  
  // Initialize with bulk prediction if available
  const [homeScore, setHomeScore] = useState(
    bulkPrediction?.homeScore?.toString() || 
    prediction?.predicted_home_score?.toString() || 
    ""
  );
  const [awayScore, setAwayScore] = useState(
    bulkPrediction?.awayScore?.toString() || 
    prediction?.predicted_away_score?.toString() || 
    ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showAIPrediction, setShowAIPrediction] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  
  // Update when bulk prediction changes
  useEffect(() => {
    if (bulkPrediction) {
      setHomeScore(bulkPrediction.homeScore.toString());
      setAwayScore(bulkPrediction.awayScore.toString());
      setIsAiGenerated(true);
    }
  }, [bulkPrediction]);

  // Notify parent of score changes
  useEffect(() => {
    onScoreChange?.(homeScore, awayScore);
  }, [homeScore, awayScore, onScoreChange]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleApplyAIPrediction = (aiHomeScore: number, aiAwayScore: number) => {
    setHomeScore(aiHomeScore.toString());
    setAwayScore(aiAwayScore.toString());
    setIsAiGenerated(true);
  };

  const savePrediction = async () => {
    if (!userId || homeScore === "" || awayScore === "" || !pouleId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("predictions")
        .upsert({
          id: prediction?.id,
          user_id: userId,
          match_id: match.id,
          poule_id: pouleId,
          predicted_home_score: parseInt(homeScore),
          predicted_away_score: parseInt(awayScore),
          is_ai_generated: isAiGenerated,
        }, {
          onConflict: "id"
        });
      
      if (error) throw error;
      
      toast({
        title: "Opgeslagen!",
        description: `${match.home_team} ${homeScore} - ${awayScore} ${match.away_team}`,
      });
      
      onSave?.();
      setIsAiGenerated(false);
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
    <div className={`flex flex-col gap-2 p-3 rounded-lg transition-all ${
      prediction ? "bg-primary/5 border border-primary/20" : "bg-card border border-border/50 hover:border-border"
    }`}>
      {/* Stadium & City Info */}
      {(match.stadium || match.city) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
          <span className="truncate">
            {[match.stadium, match.city].filter(Boolean).join(" • ")}
          </span>
        </div>
      )}

      {/* Main match row */}
      <div className="flex items-center gap-2 md:gap-4">
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
        <FlagImage teamName={match.home_team} size="md" />
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
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              max="99"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              className="w-12 h-10 text-center text-sm font-bold p-0 touch-manipulation"
              placeholder="-"
            />
            <span className="text-muted-foreground text-xs">-</span>
            <Input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              max="99"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              className="w-12 h-10 text-center text-sm font-bold p-0 touch-manipulation"
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
        <FlagImage teamName={match.away_team} size="md" />
        <span className="text-sm font-medium truncate">{match.away_team}</span>
      </div>

      {/* AI Prediction Button */}
      <div className="w-8 shrink-0 flex justify-center">
        {canPredict && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => setShowAIPrediction(true)}
                >
                  <Brain className="w-4 h-4 text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>AI voorspelling</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
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

        {/* AI Prediction Modal */}
        <AIPredictionModal
          isOpen={showAIPrediction}
          onClose={() => setShowAIPrediction(false)}
          homeTeam={match.home_team}
          awayTeam={match.away_team}
          phase={match.phase}
          kickoffTime={match.kickoff_time}
          onApplyPrediction={isLoggedIn ? handleApplyAIPrediction : undefined}
        />
      </div>
    </div>
  );
};

export default Matches;
