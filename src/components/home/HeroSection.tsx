import { ArrowRight, Users, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import LiveLeaderboard from "@/components/LiveLeaderboard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get user's first poule for the live leaderboard demo
  const { data: userPoule } = useQuery({
    queryKey: ["user-first-poule", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("poule_members")
        .select("poule_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      return data?.poule_id || null;
    },
    enabled: !!user?.id,
  });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-pitch-pattern opacity-30" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse-slow" />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium text-primary">WK 2026 • 11 juni - 19 juli</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
            Jouw WK Poule,{" "}
            <span className="gradient-text">Professioneel</span>{" "}
            <span className="gradient-text-gold">Gespeeld</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Start je eigen WK 2026 poule, nodig vrienden en collega's uit, en strijd om de ultieme bragging rights. 
            Real-time scores, automatische puntentelling, en Stripe betalingen.
          </p>

          {/* CTA Button */}
          <div className="flex items-center justify-center mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button 
              variant="hero" 
              size="xl" 
              className="group"
              onClick={() => navigate(user ? "/create-poule" : "/auth")}
            >
              Maak Je Poule
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <Users className="w-4 h-4" />
                <span className="font-display font-bold text-2xl sm:text-3xl">50k+</span>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">Spelers</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gold mb-1">
                <Trophy className="w-4 h-4" />
                <span className="font-display font-bold text-2xl sm:text-3xl">2.5k</span>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">Poules</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <Zap className="w-4 h-4" />
                <span className="font-display font-bold text-2xl sm:text-3xl">€100k</span>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">Uitgekeerd</span>
            </div>
          </div>
        </div>

        {/* Live Leaderboard Card */}
        <div className="mt-16 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-transparent to-gold/20 rounded-3xl blur-2xl opacity-50" />
            
            {/* Show real leaderboard if user has a poule, otherwise show demo */}
            {userPoule ? (
              <LiveLeaderboard 
                pouleId={userPoule} 
                currentUserId={user?.id}
                className="relative"
              />
            ) : (
              <div className="relative glass-card rounded-2xl p-6 sm:p-8">
                {/* Mock Leaderboard */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg">Kantoor Poule 2026</h3>
                      <p className="text-sm text-muted-foreground">12 deelnemers • €5 inleg</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-medium animate-pulse-glow">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    Live
                  </div>
                </div>

                {/* Leaderboard Preview */}
                <div className="space-y-2">
                  {[
                    { rank: 1, name: "Sophie M.", points: 47, change: "up" },
                    { rank: 2, name: "Mark V.", points: 44, change: "up" },
                    { rank: 3, name: "Jij", points: 42, change: "same", isYou: true },
                    { rank: 4, name: "Lisa K.", points: 38, change: "down" },
                    { rank: 5, name: "Tom B.", points: 35, change: "same" },
                  ].map((player) => (
                    <div
                      key={player.rank}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                        player.isYou 
                          ? "bg-primary/10 border-2 border-primary/40" 
                          : player.rank === 1 
                            ? "bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-500/20"
                            : player.rank === 2
                              ? "bg-gradient-to-r from-gray-400/10 via-gray-300/5 to-transparent border border-gray-400/20"
                              : player.rank === 3
                                ? "bg-gradient-to-r from-orange-500/10 via-orange-400/5 to-transparent border border-orange-500/20"
                                : "bg-secondary/30 border border-transparent"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm ${
                        player.rank === 1 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-lg" :
                        player.rank === 2 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-black shadow-lg" :
                        player.rank === 3 ? "bg-gradient-to-br from-orange-400 to-orange-500 text-black shadow-lg" :
                        "bg-secondary text-muted-foreground"
                      }`}>
                        {player.rank}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium text-sm text-muted-foreground">
                        {player.name[0]}
                      </div>
                      <span className={`flex-1 font-medium ${player.isYou ? "text-primary" : ""}`}>
                        {player.name}
                        {player.isYou && <span className="ml-2 text-xs text-primary/70">(jij)</span>}
                      </span>
                      <div className="text-right">
                        <span className="font-display font-bold text-lg">{player.points}</span>
                        <p className="text-xs text-muted-foreground">punten</p>
                      </div>
                      <span className={`w-6 flex justify-center ${
                        player.change === "up" ? "text-green-500" : 
                        player.change === "down" ? "text-destructive" : 
                        "text-muted-foreground/50"
                      }`}>
                        {player.change === "up" ? "↑" : player.change === "down" ? "↓" : "→"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
