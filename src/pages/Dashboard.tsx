import { useState } from "react";
import { Trophy, Users, Clock, ArrowRight, Plus, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type PouleWithMembership = {
  id: string;
  name: string;
  description: string | null;
  entry_fee: number;
  max_members: number | null;
  status: "open" | "closed" | "finished";
  invite_code: string | null;
  creator_id: string;
  member_count: number;
  user_points: number;
  user_rank: number | null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Fetch user's poules
  const { data: poules, isLoading } = useQuery({
    queryKey: ["user-poules", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get poules where user is a member
      const { data: memberships, error: memberError } = await supabase
        .from("poule_members")
        .select(`
          poule_id,
          points,
          rank,
          poules (
            id,
            name,
            description,
            entry_fee,
            max_members,
            status,
            invite_code,
            creator_id
          )
        `)
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      // Get member counts for each poule
      const pouleIds = memberships?.map(m => m.poule_id) || [];
      if (pouleIds.length === 0) return [];

      const { data: memberCounts, error: countError } = await supabase
        .from("poule_members")
        .select("poule_id")
        .in("poule_id", pouleIds);

      if (countError) throw countError;

      const countMap: Record<string, number> = {};
      memberCounts?.forEach(m => {
        countMap[m.poule_id] = (countMap[m.poule_id] || 0) + 1;
      });

      return memberships?.map(m => ({
        ...(m.poules as any),
        member_count: countMap[m.poule_id] || 1,
        user_points: m.points,
        user_rank: m.rank,
      })) as PouleWithMembership[];
    },
    enabled: !!user,
  });

  // Fetch total stats
  const totalPoints = poules?.reduce((sum, p) => sum + p.user_points, 0) || 0;
  const bestRank = poules?.reduce((best, p) => {
    if (p.user_rank && (!best || p.user_rank < best)) return p.user_rank;
    return best;
  }, null as number | null);

  // Join poule mutation
  const joinPoule = async () => {
    if (!user || !joinCode.trim()) return;
    
    setIsJoining(true);
    try {
      // Find poule by invite code
      const { data: poule, error: findError } = await supabase
        .from("poules")
        .select("id, name, entry_fee, status")
        .eq("invite_code", joinCode.trim().toUpperCase())
        .maybeSingle();

      if (findError) throw findError;
      if (!poule) {
        toast({
          title: "Poule niet gevonden",
          description: "Controleer de uitnodigingscode en probeer opnieuw",
          variant: "destructive",
        });
        return;
      }

      if (poule.status !== "open") {
        toast({
          title: "Poule gesloten",
          description: "Deze poule accepteert geen nieuwe deelnemers meer",
          variant: "destructive",
        });
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from("poule_members")
        .select("id")
        .eq("poule_id", poule.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Al lid",
          description: "Je bent al lid van deze poule",
          variant: "destructive",
        });
        navigate(`/poule/${poule.id}`);
        return;
      }

      // Join the poule
      const { error: joinError } = await supabase
        .from("poule_members")
        .insert({
          poule_id: poule.id,
          user_id: user.id,
          payment_status: poule.entry_fee === 0 ? "succeeded" : "pending",
        });

      if (joinError) throw joinError;

      toast({
        title: "Welkom bij de poule!",
        description: `Je bent nu lid van ${poule.name}`,
      });

      queryClient.invalidateQueries({ queryKey: ["user-poules"] });
      setJoinCode("");
      navigate(`/poule/${poule.id}`);
    } catch (error: any) {
      toast({
        title: "Fout bij deelnemen",
        description: error.message || "Probeer het opnieuw",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Redirect if not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Log in om je dashboard te bekijken</h1>
            <p className="text-muted-foreground mb-6">Je moet ingelogd zijn om je poules te zien.</p>
            <Button variant="hero" onClick={() => navigate("/auth")}>
              Inloggen / Registreren
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
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
              Welkom terug{user?.user_metadata?.display_name ? `, ${user.user_metadata.display_name}` : ""}! 👋
            </h1>
            <p className="text-muted-foreground">
              Bekijk je poules en doe je voorspellingen.
            </p>
          </div>

          {/* Join Poule Card */}
          <Card className="glass-card rounded-2xl p-6 mb-8 border-dashed border-2 border-primary/30">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Heb je een uitnodigingscode?</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Voer de code in om deel te nemen aan een poule van vrienden
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABCD1234"
                  className="w-32 font-mono uppercase"
                  maxLength={8}
                />
                <Button 
                  onClick={joinPoule} 
                  disabled={!joinCode.trim() || isJoining}
                  variant="hero"
                >
                  {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deelnemen"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{poules?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Actieve Poules</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{totalPoints}</p>
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
                  <p className="text-2xl font-display font-bold">106</p>
                  <p className="text-sm text-muted-foreground">Wedstrijden</p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{bestRank ? `#${bestRank}` : "-"}</p>
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

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse bg-card">
                  <div className="h-32 bg-muted rounded" />
                </Card>
              ))}
            </div>
          ) : poules && poules.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {poules.map((poule) => (
                <div
                  key={poule.id}
                  className="glass-card rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate(`/poule/${poule.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display font-bold text-lg mb-1">{poule.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {poule.member_count} deelnemers • {poule.entry_fee === 0 ? "Gratis" : `€${poule.entry_fee}`}
                      </p>
                    </div>
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

                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 mb-4">
                    <div className="text-center">
                      <p className="text-lg font-display font-bold">{poule.user_rank ? `#${poule.user_rank}` : "-"}</p>
                      <p className="text-xs text-muted-foreground">Jouw Plek</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center">
                      <p className="text-lg font-display font-bold">{poule.user_points}</p>
                      <p className="text-xs text-muted-foreground">Punten</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center">
                      <p className="text-lg font-display font-bold">
                        {poule.entry_fee > 0 ? `€${poule.entry_fee * poule.member_count}` : "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">Pot</p>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full group-hover:bg-primary/10 group-hover:border-primary/50">
                    Bekijk Poule
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <Card className="glass-card rounded-2xl p-12 text-center">
              <Trophy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nog geen poules</h3>
              <p className="text-muted-foreground mb-6">
                Maak je eerste poule aan of neem deel met een uitnodigingscode
              </p>
              <Button variant="hero" onClick={() => navigate('/create-poule')}>
                <Plus className="w-4 h-4" />
                Maak je eerste poule
              </Button>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
