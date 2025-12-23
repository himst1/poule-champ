import { ArrowRight, Users, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
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

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" className="w-full sm:w-auto group">
              Maak Je Poule
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="glass" size="xl" className="w-full sm:w-auto">
              Bekijk Demo
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

        {/* Preview Card */}
        <div className="mt-16 max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-transparent to-gold/20 rounded-3xl blur-2xl opacity-50" />
            
            {/* Card */}
            <div className="relative glass-card rounded-2xl p-6 sm:p-8">
              {/* Mock Leaderboard */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display font-bold text-lg">Kantoor Poule 2026</h3>
                  <p className="text-sm text-muted-foreground">12 deelnemers • €5 inleg</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                  Live
                </div>
              </div>

              {/* Leaderboard Preview */}
              <div className="space-y-3">
                {[
                  { rank: 1, name: "Sophie M.", points: 47, change: "up" },
                  { rank: 2, name: "Mark V.", points: 44, change: "up" },
                  { rank: 3, name: "Jij", points: 42, change: "same", isYou: true },
                ].map((player) => (
                  <div
                    key={player.rank}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                      player.isYou ? "bg-primary/10 border border-primary/30" : "bg-secondary/50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      player.rank === 1 ? "bg-gold text-accent-foreground" :
                      player.rank === 2 ? "bg-muted-foreground/30 text-foreground" :
                      player.rank === 3 ? "bg-orange-600/30 text-orange-400" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {player.rank}
                    </div>
                    <span className={`flex-1 font-medium ${player.isYou ? "text-primary" : ""}`}>
                      {player.name}
                    </span>
                    <span className="font-display font-bold">{player.points} pts</span>
                    <span className={`text-sm ${
                      player.change === "up" ? "text-primary" : "text-muted-foreground"
                    }`}>
                      {player.change === "up" ? "↑" : "→"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
