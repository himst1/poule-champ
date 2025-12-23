import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trophy, Users, ArrowLeft, Share2, Copy, Check, Target, Loader2, Lock, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isBefore, addMinutes, differenceInMinutes } from "date-fns";
import { nl } from "date-fns/locale";

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
};

const PouleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"ranking" | "matches" | "predictions">("ranking");
  const [copied, setCopied] = useState(false);

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
      return data as Poule | null;
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

  // Fetch upcoming matches (first 10)
  const { data: matches } = useQuery({
    queryKey: ["upcoming-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("status", "pending")
        .order("kickoff_time", { ascending: true })
        .limit(10);
      
      if (error) throw error;
      return data as Match[];
    },
  });

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
          )}

          {activeTab === "matches" && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-lg mb-4">Komende Wedstrijden</h2>
              {matches && matches.length > 0 ? (
                matches.map((match) => (
                  <MatchPredictionCard
                    key={match.id}
                    match={match}
                    prediction={predictionMap[match.id]}
                    pouleId={id!}
                    userId={user?.id}
                    onSave={() => queryClient.invalidateQueries({ queryKey: ["poule-predictions"] })}
                  />
                ))
              ) : (
                <Card className="p-8 text-center text-muted-foreground">
                  Geen komende wedstrijden
                </Card>
              )}
              <Button variant="outline" className="w-full" onClick={() => navigate("/matches")}>
                Bekijk alle wedstrijden
              </Button>
            </div>
          )}

          {activeTab === "predictions" && (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-display font-bold text-lg mb-4">Jouw Voorspellingen</h2>
              {predictions && predictions.length > 0 ? (
                <div className="space-y-3">
                  {predictions.map(pred => (
                    <div key={pred.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <span className="text-sm">Match ID: {pred.match_id.slice(0, 8)}...</span>
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Match Prediction Card Component
interface MatchPredictionCardProps {
  match: Match;
  prediction?: Prediction;
  pouleId: string;
  userId?: string;
  onSave: () => void;
}

const MatchPredictionCard = ({ match, prediction, pouleId, userId, onSave }: MatchPredictionCardProps) => {
  const kickoffDate = parseISO(match.kickoff_time);
  const lockTime = addMinutes(kickoffDate, -5); // Lock 5 minutes before kickoff
  
  const [now, setNow] = useState(new Date());
  const [homeScore, setHomeScore] = useState(prediction?.predicted_home_score?.toString() || "");
  const [awayScore, setAwayScore] = useState(prediction?.predicted_away_score?.toString() || "");
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();

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
          });
        
        if (error) throw error;
      }
      
      toast({
        title: "Voorspelling opgeslagen!",
        description: `${match.home_team} ${homeScore} - ${awayScore} ${match.away_team}`,
      });
      
      onSave();
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
      <div className="flex items-center justify-between px-5 py-3 bg-secondary/50 border-b border-border/50">
        <span className="text-sm text-muted-foreground font-medium">{match.phase || "Groepsfase"}</span>
        <div className="flex items-center gap-2">
          {isLocked ? (
            <div className="flex items-center gap-1.5 text-destructive">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Vergrendeld</span>
            </div>
          ) : minutesUntilLock <= 60 ? (
            <div className="flex items-center gap-1.5 text-accent">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Nog {minutesUntilLock} min</span>
            </div>
          ) : null}
          <span className="text-sm text-muted-foreground">
            {format(kickoffDate, "d MMM HH:mm", { locale: nl })}
          </span>
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

        {/* Save Button */}
        {canPredict && (
          <div className="mt-4">
            <Button 
              variant="default" 
              className="w-full"
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
