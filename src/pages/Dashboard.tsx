import { useState } from "react";
import { Trophy, Users, Clock, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useNavigate } from "react-router-dom";

// Mock data for demonstration
const mockPoules = [
  {
    id: "1",
    name: "Kantoor Poule 2026",
    members: 12,
    entryFee: 5,
    yourRank: 3,
    totalPoints: 42,
    status: "active",
    deadline: "2026-06-11",
  },
  {
    id: "2",
    name: "Familie WK Pool",
    members: 8,
    entryFee: 10,
    yourRank: 1,
    totalPoints: 38,
    status: "active",
    deadline: "2026-06-11",
  },
  {
    id: "3",
    name: "Voetbal Vrienden",
    members: 15,
    entryFee: 20,
    yourRank: 5,
    totalPoints: 29,
    status: "pending",
    deadline: "2026-06-11",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
              Welkom terug! 👋
            </h1>
            <p className="text-muted-foreground">
              Bekijk je poules en doe je voorspellingen.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">3</p>
                  <p className="text-sm text-muted-foreground">Actieve Poules</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">109</p>
                  <p className="text-sm text-muted-foreground">Totale Punten</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">12</p>
                  <p className="text-sm text-muted-foreground">Voorspellingen</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">#1</p>
                  <p className="text-sm text-muted-foreground">Beste Ranking</p>
                </div>
              </div>
            </div>
          </div>

          {/* My Poules */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold">Mijn Poules</h2>
            <Button variant="hero" size="sm" onClick={() => navigate('/create-poule')}>
              <Plus className="w-4 h-4" />
              Nieuwe Poule
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockPoules.map((poule) => (
              <div
                key={poule.id}
                className="glass-card rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/poule/${poule.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display font-bold text-lg mb-1">{poule.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {poule.members} deelnemers • €{poule.entryFee} inleg
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    poule.status === "active" 
                      ? "bg-primary/20 text-primary" 
                      : "bg-gold/20 text-gold"
                  }`}>
                    {poule.status === "active" ? "Live" : "Pending"}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 mb-4">
                  <div className="text-center">
                    <p className="text-lg font-display font-bold">#{poule.yourRank}</p>
                    <p className="text-xs text-muted-foreground">Jouw Plek</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <p className="text-lg font-display font-bold">{poule.totalPoints}</p>
                    <p className="text-xs text-muted-foreground">Punten</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <p className="text-lg font-display font-bold">€{poule.entryFee * poule.members}</p>
                    <p className="text-xs text-muted-foreground">Pot</p>
                  </div>
                </div>

                <Button variant="glass" className="w-full group-hover:bg-primary/20">
                  Bekijk Poule
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
