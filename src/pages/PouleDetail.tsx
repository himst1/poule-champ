import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trophy, Users, ArrowLeft, Share2, Copy, Check, Target, Loader2, Lock, Clock, Brain, Star, StarOff, Calendar, X, Save, Settings, Goal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isBefore, addMinutes, differenceInMinutes, differenceInSeconds } from "date-fns";
import { nl } from "date-fns/locale";
import { BulkAIPredictionModal } from "@/components/BulkAIPredictionModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AIPredictionModal } from "@/components/AIPredictionModal";
import { AIPredictionStats } from "@/components/AIPredictionStats";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PouleManagement } from "@/components/PouleManagement";
import { MatchDeadlineBadge } from "@/components/DeadlineWarning";
import { MatchdayOverview } from "@/components/MatchdayOverview";
import TopscorerVoting from "@/components/TopscorerVoting";
import WinnerVoting from "@/components/WinnerVoting";
// Get all unique country names from COUNTRY_CODES (defined below)
const ALL_COUNTRIES = [
  "Argentinië", "Australië", "Bahrein", "België", "Bolivia", "Brazilië",
  "Canada", "Chili", "China", "Colombia", "Costa Rica", "Denemarken",
  "Duitsland", "Ecuador", "Egypte", "El Salvador", "Engeland", "Finland",
  "Frankrijk", "Ghana", "Griekenland", "Guatemala", "Honduras", "Hongarije",
  "Ierland", "India", "Indonesië", "Irak", "Iran", "Italië", "Ivoorkust",
  "Jamaica", "Japan", "Jordanië", "Kameroen", "Kroatië", "Mali", "Marokko",
  "Mexico", "Nederland", "Nieuw-Zeeland", "Nigeria", "Noorwegen", "Oekraïne",
  "Oezbekistan", "Oman", "Oostenrijk", "Panama", "Paraguay", "Peru", "Polen",
  "Portugal", "Qatar", "Roemenië", "Saoedi-Arabië", "Schotland", "Senegal",
  "Servië", "Slovenië", "Slowakije", "Spanje", "Thailand", "Trinidad en Tobago",
  "Tsjechië", "Tunesië", "Turkije", "Uruguay", "VAE", "Venezuela",
  "Verenigde Staten", "Vietnam", "Wales", "Zuid-Afrika", "Zuid-Korea", "Zweden",
  "Zwitserland"
];

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

  // More than 7 days
  if (days > 7) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/80 text-muted-foreground text-xs">
        <Clock className="w-3.5 h-3.5" />
        <span>{days} dagen</span>
      </div>
    );
  }

  // More than 24 hours
  if (days > 0) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/80 text-muted-foreground text-xs">
        <Clock className="w-3.5 h-3.5" />
        <span>{days}d {hours}u {minutes}m</span>
      </div>
    );
  }

  // Less than 24 hours but more than 1 hour
  if (hours > 0) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-accent/20 text-accent text-xs font-medium">
        <Clock className="w-3.5 h-3.5" />
        <span>{hours}u {minutes}m {seconds.toString().padStart(2, '0')}s</span>
      </div>
    );
  }

  // Less than 1 hour - urgent countdown
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive text-sm font-bold animate-pulse">
      <Clock className="w-4 h-4" />
      <span>{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}</span>
    </div>
  );
};

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
  return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
};

// Flag image component
const FlagImage = ({ teamName, size = "md" }: { teamName: string | null; size?: "sm" | "md" | "lg" }) => {
  const flagUrl = getFlagUrl(teamName);
  
  const sizeClasses = {
    sm: "w-6 h-4",
    md: "w-10 h-7",
    lg: "w-12 h-8",
  };
  
  if (!flagUrl) {
    return (
      <div className={`${sizeClasses[size]} bg-secondary rounded flex items-center justify-center`}>
        <span className="text-muted-foreground text-xs">?</span>
      </div>
    );
  }
  
  return (
    <img
      src={flagUrl}
      alt={`Vlag van ${teamName}`}
      className={`${sizeClasses[size]} object-cover rounded shadow-sm`}
      onError={(e) => {
        e.currentTarget.src = "";
        e.currentTarget.className = `${sizeClasses[size]} bg-secondary rounded`;
      }}
    />
  );
};

type Poule = {
  id: string;
  name: string;
  description: string | null;
  entry_fee: number;
  max_members: number | null;
  status: "open" | "closed" | "finished";
  invite_code: string | null;
  creator_id: string;
  scoring_rules: { correct_score: number; correct_result: number } | null;
  deadline: string | null;
};

type Member = {
  id: string;
  user_id: string;
  points: number;
  rank: number | null;
  profiles: {
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
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
  is_ai_generated?: boolean;
};

const PouleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"ranking" | "matches" | "predictions" | "topscorer" | "winner">("ranking");
  const [copied, setCopied] = useState(false);
  const [showBulkAIPrediction, setShowBulkAIPrediction] = useState(false);
  const [bulkPredictions, setBulkPredictions] = useState<Record<string, { homeScore: number; awayScore: number }>>({});
  const [localScores, setLocalScores] = useState<Record<string, { homeScore: string; awayScore: string }>>({});
  const [aiGeneratedMatches, setAiGeneratedMatches] = useState<Set<string>>(new Set());
  const [isSavingAll, setIsSavingAll] = useState(false);
  
  // Filter states
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [favoriteCountries, setFavoriteCountries] = useState<string[]>(() => {
    const saved = localStorage.getItem("favoriteCountries");
    return saved ? JSON.parse(saved) : [];
  });
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

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

  // Update local scores from child component
  const handleLocalScoreChange = useCallback((matchId: string, homeScore: string, awayScore: string) => {
    setLocalScores(prev => ({
      ...prev,
      [matchId]: { homeScore, awayScore }
    }));
  }, []);


  // Fetch poule details
  const { data: poule, isLoading: pouleLoading } = useQuery({
    queryKey: ["poule", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poules")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      // Parse scoring_rules from Json to our type
      const scoringRules = data.scoring_rules as { correct_score: number; correct_result: number } | null;
      
      return {
        ...data,
        scoring_rules: scoringRules,
      } as Poule;
    },
  });

  // Fetch members with profiles
  const { data: members } = useQuery({
    queryKey: ["poule-members", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poule_members")
        .select(`
          id,
          user_id,
          points,
          rank,
          profiles (
            display_name,
            email,
            avatar_url
          )
        `)
        .eq("poule_id", id)
        .order("points", { ascending: false });
      
      if (error) throw error;
      return data as Member[];
    },
    enabled: !!id,
  });

  // Fetch upcoming matches (all pending for bulk AI)
  const { data: matches } = useQuery({
    queryKey: ["all-pending-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("status", "pending")
        .order("kickoff_time", { ascending: true });
      
      if (error) throw error;
      return data as Match[];
    },
  });

  // Fetch all matches (for matchday overview including finished)
  const { data: allMatches } = useQuery({
    queryKey: ["all-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("kickoff_time", { ascending: true });
      
      if (error) throw error;
      return data as Match[];
    },
  });

  // Fetch all predictions in this poule (for matchday overview)
  const { data: allPoulePredictions } = useQuery({
    queryKey: ["all-poule-predictions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("poule_id", id);
      
      if (error) throw error;
      return data as (Prediction & { user_id: string })[];
    },
    enabled: !!id,
  });

  // Available dates for filter
  const availableDates = useMemo(() => {
    if (!matches) return [];
    const dates = new Set(matches.map(m => format(parseISO(m.kickoff_time), "yyyy-MM-dd")));
    return Array.from(dates).sort();
  }, [matches]);

  // Filter matches based on date and favorite countries
  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    
    return matches.filter(match => {
      const kickoffDate = parseISO(match.kickoff_time);
      if (!isBefore(new Date(), kickoffDate)) return false; // Only future matches
      
      const matchDate = format(kickoffDate, "yyyy-MM-dd");
      const dateMatch = !selectedDate || matchDate === selectedDate;
      
      // Favorite countries filter
      const favoriteMatch = favoriteCountries.length === 0 || !showOnlyFavorites || 
        favoriteCountries.includes(match.home_team) || 
        favoriteCountries.includes(match.away_team);
      
      return dateMatch && favoriteMatch;
    });
  }, [matches, selectedDate, showOnlyFavorites, favoriteCountries]);

  // Display matches (first 20 filtered)
  const displayMatches = filteredMatches.slice(0, 20);

  // Get predictable matches (for bulk AI - use filtered)
  const predictableMatches = useMemo(() => {
    return filteredMatches.filter(match => {
      const kickoffDate = parseISO(match.kickoff_time);
      return isBefore(new Date(), kickoffDate);
    });
  }, [filteredMatches]);

  // Fetch user's predictions for this poule
  const { data: predictions } = useQuery({
    queryKey: ["poule-predictions", id, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("poule_id", id)
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data as Prediction[];
    },
    enabled: !!user && !!id,
  });

  const predictionMap: Record<string, Prediction> = {};
  predictions?.forEach(p => {
    predictionMap[p.match_id] = p;
  });

  // Get all unsaved predictions (local scores that differ from saved predictions)
  const unsavedPredictions = useMemo(() => {
    const unsaved: { matchId: string; homeScore: number; awayScore: number; isNew: boolean; isAiGenerated: boolean }[] = [];
    
    Object.entries(localScores).forEach(([matchId, scores]) => {
      if (scores.homeScore === "" || scores.awayScore === "") return;
      
      const match = displayMatches.find(m => m.id === matchId);
      if (!match) return;
      
      // Check if match is still open for predictions
      const kickoffDate = parseISO(match.kickoff_time);
      const lockTime = addMinutes(kickoffDate, -5);
      if (!isBefore(new Date(), lockTime)) return;
      
      const existingPrediction = predictionMap[matchId];
      const homeScore = parseInt(scores.homeScore);
      const awayScore = parseInt(scores.awayScore);
      const isAiGenerated = aiGeneratedMatches.has(matchId);
      
      // Only add if it's new or different from existing
      if (!existingPrediction) {
        unsaved.push({ matchId, homeScore, awayScore, isNew: true, isAiGenerated });
      } else if (
        existingPrediction.predicted_home_score !== homeScore ||
        existingPrediction.predicted_away_score !== awayScore
      ) {
        unsaved.push({ matchId, homeScore, awayScore, isNew: false, isAiGenerated });
      }
    });
    
    return unsaved;
  }, [localScores, displayMatches, predictionMap, aiGeneratedMatches]);

  // Save all unsaved predictions
  const saveAllPredictions = async () => {
    if (!user || unsavedPredictions.length === 0) return;
    
    setIsSavingAll(true);
    try {
      const newPredictions = unsavedPredictions.filter(p => p.isNew);
      const updates = unsavedPredictions.filter(p => !p.isNew);
      
      // Insert new predictions
      if (newPredictions.length > 0) {
        const { error: insertError } = await supabase
          .from("predictions")
          .insert(
            newPredictions.map(p => ({
              user_id: user.id,
              match_id: p.matchId,
              poule_id: id!,
              predicted_home_score: p.homeScore,
              predicted_away_score: p.awayScore,
              is_ai_generated: p.isAiGenerated,
            }))
          );
        
        if (insertError) throw insertError;
      }
      
      // Update existing predictions one by one (Supabase doesn't support batch updates easily)
      for (const update of updates) {
        const existingPrediction = predictionMap[update.matchId];
        if (existingPrediction) {
          const { error: updateError } = await supabase
            .from("predictions")
            .update({
              predicted_home_score: update.homeScore,
              predicted_away_score: update.awayScore,
              is_ai_generated: update.isAiGenerated,
            })
            .eq("id", existingPrediction.id);
          
          if (updateError) throw updateError;
        }
      }
      
      toast({
        title: "Alle voorspellingen opgeslagen!",
        description: `${unsavedPredictions.length} voorspelling${unsavedPredictions.length > 1 ? 'en' : ''} opgeslagen`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["poule-predictions"] });
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

  const currentMember = members?.find(m => m.user_id === user?.id);
  const memberCount = members?.length || 0;
  const pot = poule ? poule.entry_fee * memberCount : 0;

  const copyInviteCode = () => {
    if (poule?.invite_code) {
      navigator.clipboard.writeText(poule.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Gekopieerd!",
        description: "Deel deze code met je vrienden",
      });
    }
  };

  if (pouleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!poule) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 text-center">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Poule niet gevonden</h1>
            <p className="text-muted-foreground mb-6">Deze poule bestaat niet of je hebt geen toegang.</p>
            <Button variant="hero" onClick={() => navigate("/dashboard")}>
              Naar Dashboard
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar dashboard
          </button>

          {/* Poule Header */}
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold">{poule.name}</h1>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    poule.status === "open" 
                      ? "bg-primary/20 text-primary" 
                      : poule.status === "closed"
                      ? "bg-accent/20 text-accent"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {poule.status === "open" ? "Open" : poule.status === "closed" ? "Bezig" : "Afgelopen"}
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {memberCount} deelnemers • {poule.entry_fee === 0 ? "Gratis" : `€${poule.entry_fee} inleg`}
                  {pot > 0 && ` • €${pot} pot`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyInviteCode}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {poule.invite_code}
                </Button>
                {user?.id === poule.creator_id && members && (
                  <PouleManagement
                    pouleId={poule.id}
                    pouleName={poule.name}
                    status={poule.status}
                    scoringRules={poule.scoring_rules}
                    isCreator={true}
                    members={members}
                    currentUserId={user?.id}
                  />
                )}
              </div>
            </div>

            {/* Your Position Banner */}
            {currentMember && (
              <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-xl">
                        {currentMember.rank ? `${currentMember.rank}e Plaats` : "Nog geen ranking"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {predictions?.length || 0} voorspellingen gedaan
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-2xl text-primary">{currentMember.points} pts</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: "ranking", label: "Ranking", icon: Trophy },
              { id: "matches", label: "Wedstrijden", icon: Target },
              { id: "predictions", label: "Mijn Voorspellingen", icon: Users },
              { id: "topscorer", label: "Topscorer", icon: Goal },
              { id: "winner", label: "WK Winnaar", icon: Trophy },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "ranking" && (
            <div className="space-y-6">
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="font-display font-bold text-lg">Live Ranglijst</h2>
                </div>
                {members && members.length > 0 ? (
                  <div className="divide-y divide-border">
                    {members.map((member, index) => {
                      const isCurrentUser = member.user_id === user?.id;
                      const rank = index + 1;
                      return (
                        <div
                          key={member.id}
                          className={`flex items-center gap-4 p-4 transition-colors ${
                            isCurrentUser ? "bg-primary/10" : "hover:bg-secondary/50"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            rank === 1 ? "bg-accent text-accent-foreground" :
                            rank === 2 ? "bg-muted-foreground/30 text-foreground" :
                            rank === 3 ? "bg-orange-600/30 text-orange-400" :
                            "bg-secondary text-muted-foreground"
                          }`}>
                            {rank}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${isCurrentUser ? "text-primary" : ""}`}>
                              {member.profiles?.display_name || member.profiles?.email?.split("@")[0] || "Onbekend"}
                              {isCurrentUser && <span className="ml-2 text-xs text-primary">(jij)</span>}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-display font-bold">{member.points} pts</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Nog geen deelnemers
                  </div>
                )}
              </div>

              {/* Matchday Overview */}
              {allMatches && allPoulePredictions && members && poule && (
                <MatchdayOverview
                  matches={allMatches}
                  predictions={allPoulePredictions}
                  members={members}
                  scoringRules={poule.scoring_rules || { correct_score: 5, correct_result: 2 }}
                />
              )}
            </div>
          )}

          {activeTab === "matches" && (
            <div className="space-y-4">
              {/* Header with Bulk AI button and Save All button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                <h2 className="font-display font-bold text-lg">Komende Wedstrijden</h2>
                <div className="flex gap-2">
                  {user && unsavedPredictions.length > 0 && (
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
                  {user && predictableMatches.length > 0 && (
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

              {/* Filters */}
              <div className="glass-card rounded-xl p-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Date Filter */}
                  <div className="sm:w-48">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Datum</span>
                    </div>
                    <select
                      value={selectedDate || ""}
                      onChange={(e) => setSelectedDate(e.target.value || null)}
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Alle datums</option>
                      {availableDates.map(date => (
                        <option key={date} value={date}>
                          {format(parseISO(date), "d MMM yyyy", { locale: nl })}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Favorite Countries Filter */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Favoriete landen</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Star className="w-4 h-4" />
                            Selecteer
                            {favoriteCountries.length > 0 && (
                              <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                                {favoriteCountries.length}
                              </span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0" align="start">
                          <div className="p-3 border-b border-border">
                            <h4 className="font-medium text-sm">Kies favoriete landen</h4>
                          </div>
                          <ScrollArea className="h-64">
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
                        </PopoverContent>
                      </Popover>

                      {/* Show selected favorites as chips */}
                      {favoriteCountries.slice(0, 3).map(country => (
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
                      {favoriteCountries.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{favoriteCountries.length - 3} meer
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
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Alleen favorieten
                            </>
                          ) : (
                            <>
                              <StarOff className="w-3 h-3 mr-1" />
                              Alle landen
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Results count */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-medium">{filteredMatches.length}</span> wedstrijden
                    {showOnlyFavorites && favoriteCountries.length > 0 && (
                      <span className="text-primary ml-1">({favoriteCountries.join(", ")})</span>
                    )}
                  </span>
                  {(selectedDate || showOnlyFavorites) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDate(null);
                        setShowOnlyFavorites(false);
                      }}
                    >
                      Filters wissen
                    </Button>
                  )}
                </div>
              </div>

              {/* Match Cards */}
              {displayMatches && displayMatches.length > 0 ? (
                displayMatches.map((match) => (
                  <MatchPredictionCard
                    key={match.id}
                    match={match}
                    prediction={predictionMap[match.id]}
                    pouleId={id!}
                    userId={user?.id}
                    onSave={() => {
                      queryClient.invalidateQueries({ queryKey: ["poule-predictions"] });
                      queryClient.invalidateQueries({ queryKey: ["ai-prediction-stats"] });
                      // Clear local score for this match after individual save
                      setLocalScores(prev => {
                        const newScores = { ...prev };
                        delete newScores[match.id];
                        return newScores;
                      });
                      // Clear AI generated flag for this match
                      setAiGeneratedMatches(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(match.id);
                        return newSet;
                      });
                    }}
                    bulkPrediction={bulkPredictions[match.id]}
                    onScoreChange={(home, away) => handleLocalScoreChange(match.id, home, away)}
                  />
                ))
              ) : (
                <Card className="p-8 text-center text-muted-foreground">
                  {selectedDate || showOnlyFavorites 
                    ? "Geen wedstrijden gevonden met deze filters" 
                    : "Geen komende wedstrijden"}
                </Card>
              )}
              <Button variant="outline" className="w-full" onClick={() => navigate("/matches")}>
                Bekijk alle wedstrijden
              </Button>
            </div>
          )}

          {activeTab === "predictions" && (
            <div className="space-y-6">
              {/* AI Prediction Stats */}
              <AIPredictionStats pouleId={id} />
              
              <div className="glass-card rounded-2xl p-6">
                <h2 className="font-display font-bold text-lg mb-4">Jouw Voorspellingen</h2>
                {predictions && predictions.length > 0 ? (
                  <div className="space-y-3">
                    {predictions.map(pred => (
                      <div key={pred.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Match ID: {pred.match_id.slice(0, 8)}...</span>
                          {pred.is_ai_generated && (
                            <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-xs font-medium flex items-center gap-1">
                              <Brain className="w-3 h-3" />
                              AI
                            </span>
                          )}
                        </div>
                        <span className="font-semibold">
                          {pred.predicted_home_score} - {pred.predicted_away_score}
                        </span>
                        {pred.points_earned !== null && (
                          <span className={`font-bold ${pred.points_earned > 0 ? "text-primary" : "text-muted-foreground"}`}>
                            +{pred.points_earned} pts
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Je hebt nog geen voorspellingen gedaan voor deze poule.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "topscorer" && (
            <TopscorerVoting pouleId={id!} deadline={poule?.deadline} />
          )}

          {activeTab === "winner" && (
            <WinnerVoting pouleId={id!} deadline={poule?.deadline} />
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

// Match Prediction Card Component
interface MatchPredictionCardProps {
  match: Match;
  prediction?: Prediction;
  pouleId: string;
  userId?: string;
  onSave: (isAiGenerated: boolean) => void;
  bulkPrediction?: { homeScore: number; awayScore: number };
  onScoreChange?: (homeScore: string, awayScore: string) => void;
}

const MatchPredictionCard = ({ match, prediction, pouleId, userId, onSave, bulkPrediction, onScoreChange }: MatchPredictionCardProps) => {
  const kickoffDate = parseISO(match.kickoff_time);
  const lockTime = addMinutes(kickoffDate, -5); // Lock 5 minutes before kickoff
  
  const [now, setNow] = useState(new Date());
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
  
  const { toast } = useToast();

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

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const isLocked = !isBefore(now, lockTime) || match.status !== "pending";
  const canPredict = !isLocked && !!userId;
  const minutesUntilLock = differenceInMinutes(lockTime, now);

  const savePrediction = async () => {
    if (!userId || homeScore === "" || awayScore === "") return;
    
    // Double-check lock time
    if (!isBefore(new Date(), lockTime)) {
      toast({
        title: "Te laat!",
        description: "De wedstrijd is vergrendeld voor voorspellingen.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      if (prediction) {
        const { error } = await supabase
          .from("predictions")
          .update({
            predicted_home_score: parseInt(homeScore),
            predicted_away_score: parseInt(awayScore),
            is_ai_generated: isAiGenerated,
          })
          .eq("id", prediction.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("predictions")
          .insert({
            user_id: userId,
            match_id: match.id,
            poule_id: pouleId,
            predicted_home_score: parseInt(homeScore),
            predicted_away_score: parseInt(awayScore),
            is_ai_generated: isAiGenerated,
          });
        
        if (error) throw error;
      }
      
      toast({
        title: "Voorspelling opgeslagen!",
        description: `${match.home_team} ${homeScore} - ${awayScore} ${match.away_team}`,
      });
      
      onSave(isAiGenerated);
      setIsAiGenerated(false);
    } catch (error: any) {
      toast({
        title: "Fout bij opslaan",
        description: error.message || "Probeer het opnieuw",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save when both scores are filled
  useEffect(() => {
    if (prediction) {
      setHomeScore(prediction.predicted_home_score?.toString() || "");
      setAwayScore(prediction.predicted_away_score?.toString() || "");
    }
  }, [prediction]);

  return (
    <Card className="glass-card rounded-2xl overflow-hidden">
      {/* Header with phase and time */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3 bg-secondary/50 border-b border-border/50">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <span className="text-sm text-muted-foreground font-medium">{match.phase || "Groepsfase"}</span>
          <span className="text-sm text-muted-foreground">
            {format(kickoffDate, "d MMM HH:mm", { locale: nl })}
          </span>
        </div>
        <div className="flex items-center justify-center gap-2">
          {isLocked ? (
            <MatchDeadlineBadge kickoffTime={match.kickoff_time} size="md" />
          ) : minutesUntilLock <= 30 ? (
            <MatchDeadlineBadge kickoffTime={lockTime.toISOString()} size="md" />
          ) : (
            <CountdownTimer kickoffDate={lockTime} />
          )}
        </div>
      </div>
      
      {/* Match Content */}
      <div className="p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
          {/* Home Team */}
          <div className="flex items-center gap-2 sm:gap-3">
            <FlagImage teamName={match.home_team} size="lg" />
            <span className="font-display font-bold text-sm sm:text-base truncate">
              {match.home_team}
            </span>
          </div>

          {/* Score Input */}
          <div className="flex items-center gap-2">
            {canPredict ? (
              <>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-12 sm:w-14 h-11 sm:h-12 text-center font-display font-bold text-lg sm:text-xl bg-secondary border-border focus:border-primary"
                  placeholder="-"
                  disabled={isSaving}
                />
                <span className="text-muted-foreground font-bold text-lg sm:text-xl">:</span>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-12 sm:w-14 h-11 sm:h-12 text-center font-display font-bold text-lg sm:text-xl bg-secondary border-border focus:border-primary"
                  placeholder="-"
                  disabled={isSaving}
                />
              </>
            ) : prediction ? (
              <div className="px-3 sm:px-4 py-2 rounded-lg bg-primary/20 border border-primary/30">
                <span className="font-display font-bold text-lg sm:text-xl text-primary">
                  {prediction.predicted_home_score} : {prediction.predicted_away_score}
                </span>
              </div>
            ) : (
              <div className="px-2 sm:px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/30">
                <span className="font-display font-bold text-xs sm:text-sm text-destructive whitespace-nowrap">
                  Niet ingevuld
                </span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <span className="font-display font-bold text-sm sm:text-base truncate text-right">
              {match.away_team}
            </span>
            <FlagImage teamName={match.away_team} size="lg" />
          </div>
        </div>

        {/* Action Buttons */}
        {canPredict && (
          <div className="mt-4 flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
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
            
            <Button 
              variant="default" 
              className="flex-1"
              onClick={savePrediction}
              disabled={isSaving || homeScore === "" || awayScore === ""}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : prediction ? (
                <Check className="w-4 h-4 mr-2" />
              ) : null}
              {isSaving ? "Opslaan..." : prediction ? "Wijziging Opslaan" : "Voorspelling Opslaan"}
            </Button>
          </div>
        )}

        {/* AI Prediction Modal */}
        <AIPredictionModal
          isOpen={showAIPrediction}
          onClose={() => setShowAIPrediction(false)}
          homeTeam={match.home_team}
          awayTeam={match.away_team}
          phase={match.phase}
          kickoffTime={match.kickoff_time}
          onApplyPrediction={(h, a) => {
            setHomeScore(h.toString());
            setAwayScore(a.toString());
            setIsAiGenerated(true);
          }}
        />

        {/* Locked Message */}
        {isLocked && !prediction && userId && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
            <p className="text-sm text-destructive font-medium">
              Je hebt geen voorspelling gedaan voor deze wedstrijd
            </p>
          </div>
        )}

        {/* Points Earned (for finished matches) */}
        {prediction?.points_earned !== null && prediction?.points_earned !== undefined && match.status === "finished" && (
          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-sm text-muted-foreground">Punten verdiend</p>
            <p className="font-display font-bold text-2xl text-primary">+{prediction.points_earned}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PouleDetail;
