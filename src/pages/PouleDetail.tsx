import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trophy, Users, ArrowLeft, Share2, Settings, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Mock data
const mockPoule = {
  id: "1",
  name: "Kantoor Poule 2026",
  members: 12,
  entryFee: 5,
  pot: 60,
  status: "active",
};

const mockLeaderboard = [
  { rank: 1, name: "Sophie M.", points: 47, accuracy: 68, trend: "up", isYou: false },
  { rank: 2, name: "Mark V.", points: 44, accuracy: 65, trend: "up", isYou: false },
  { rank: 3, name: "Jij", points: 42, accuracy: 62, trend: "same", isYou: true },
  { rank: 4, name: "Peter J.", points: 39, accuracy: 58, trend: "down", isYou: false },
  { rank: 5, name: "Lisa K.", points: 36, accuracy: 54, trend: "up", isYou: false },
  { rank: 6, name: "Tom B.", points: 34, accuracy: 51, trend: "down", isYou: false },
  { rank: 7, name: "Anna S.", points: 31, accuracy: 47, trend: "same", isYou: false },
  { rank: 8, name: "Jan W.", points: 28, accuracy: 42, trend: "down", isYou: false },
];

const mockUpcomingMatches = [
  {
    id: "m1",
    homeTeam: "Nederland",
    homeFlag: "🇳🇱",
    awayTeam: "Australië",
    awayFlag: "🇦🇺",
    datetime: "2026-06-14T18:00:00",
    phase: "Groep A",
    predicted: false,
  },
  {
    id: "m2",
    homeTeam: "Duitsland",
    homeFlag: "🇩🇪",
    awayTeam: "Japan",
    awayFlag: "🇯🇵",
    datetime: "2026-06-14T21:00:00",
    phase: "Groep B",
    predicted: true,
    prediction: { home: 2, away: 1 },
  },
  {
    id: "m3",
    homeTeam: "Brazilië",
    homeFlag: "🇧🇷",
    awayTeam: "Servië",
    awayFlag: "🇷🇸",
    datetime: "2026-06-15T18:00:00",
    phase: "Groep C",
    predicted: false,
  },
];

const PouleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"ranking" | "matches" | "predictions">("ranking");

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
                  <h1 className="font-display text-2xl sm:text-3xl font-bold">{mockPoule.name}</h1>
                  <div className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                    Live
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {mockPoule.members} deelnemers • €{mockPoule.entryFee} inleg • €{mockPoule.pot} pot
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="glass" size="sm">
                  <Share2 className="w-4 h-4" />
                  Delen
                </Button>
                <Button variant="glass" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Your Position Banner */}
            <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-xl">3e Plaats</p>
                    <p className="text-sm text-muted-foreground">Je staat er goed voor!</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-2xl text-primary">42 pts</p>
                  <p className="text-sm text-muted-foreground">5 punten van #1</p>
                </div>
              </div>
            </div>
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
              <div className="divide-y divide-border">
                {mockLeaderboard.map((player) => (
                  <div
                    key={player.rank}
                    className={`flex items-center gap-4 p-4 transition-colors ${
                      player.isYou ? "bg-primary/10" : "hover:bg-secondary/50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      player.rank === 1 ? "bg-gold text-accent-foreground" :
                      player.rank === 2 ? "bg-muted-foreground/30 text-foreground" :
                      player.rank === 3 ? "bg-orange-600/30 text-orange-400" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {player.rank}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${player.isYou ? "text-primary" : ""}`}>
                        {player.name}
                        {player.isYou && <span className="ml-2 text-xs text-primary">(jij)</span>}
                      </p>
                      <p className="text-sm text-muted-foreground">{player.accuracy}% accuraatheid</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold">{player.points} pts</p>
                      <span className={`text-sm ${
                        player.trend === "up" ? "text-primary" : 
                        player.trend === "down" ? "text-destructive" : 
                        "text-muted-foreground"
                      }`}>
                        {player.trend === "up" ? "↑" : player.trend === "down" ? "↓" : "→"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "matches" && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-lg mb-4">Volgende Wedstrijden</h2>
              {mockUpcomingMatches.map((match) => (
                <div key={match.id} className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">{match.phase}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(match.datetime).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{match.homeFlag}</span>
                      <span className="font-display font-bold">{match.homeTeam}</span>
                    </div>
                    
                    {match.predicted ? (
                      <div className="px-4 py-2 rounded-lg bg-primary/20 border border-primary/30">
                        <span className="font-display font-bold text-primary">
                          {match.prediction?.home} - {match.prediction?.away}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground font-medium">VS</span>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold">{match.awayTeam}</span>
                      <span className="text-3xl">{match.awayFlag}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    {match.predicted ? (
                      <Button variant="glass" className="w-full">
                        Wijzig Voorspelling
                      </Button>
                    ) : (
                      <Button variant="hero" className="w-full">
                        Voorspel Nu
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "predictions" && (
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-display font-bold text-lg mb-4">Jouw Voorspellingen</h2>
              <p className="text-muted-foreground">
                Hier zie je al je voorspellingen en resultaten.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PouleDetail;
