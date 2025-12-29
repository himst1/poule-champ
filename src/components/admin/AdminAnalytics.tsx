import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trophy, Medal, Users, Loader2, TrendingUp, Award, Calendar, BarChart3, Target, CheckCircle, Plus, Play, Trash2, FileText, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface Tournament {
  id: string;
  name: string;
  year: number;
  type: string;
  status: string;
}

interface AllTimeStats {
  user_id: string;
  total_points: number;
  total_tournaments: number;
  total_predictions: number;
  correct_scores: number;
  correct_results: number;
  best_finish: number | null;
  tournament_wins: number;
  podium_finishes: number;
  avg_points_per_tournament: number;
  profiles?: { display_name: string | null } | null;
}

interface UserRecord {
  userId: string;
  userName: string;
  value: number;
  description: string;
}

const TOURNAMENT_TYPES = [
  { value: "world_cup", label: "WK (Wereldkampioenschap)" },
  { value: "euro", label: "EK (Europees Kampioenschap)" },
  { value: "copa_america", label: "Copa América" },
  { value: "nations_league", label: "Nations League" },
  { value: "other", label: "Anders" },
];

const AdminAnalytics = () => {
  const queryClient = useQueryClient();
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [isUpdatingStats, setIsUpdatingStats] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: "",
    year: new Date().getFullYear(),
    type: "world_cup",
  });

  // Fetch tournaments
  const { data: tournaments, isLoading: isLoadingTournaments } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("year", { ascending: false });
      if (error) throw error;
      return data as Tournament[];
    },
  });

  // Fetch all-time stats
  const { data: allTimeStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["all-time-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_all_time_stats")
        .select("*")
        .order("total_points", { ascending: false });
      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = data?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      return data?.map(stats => ({
        ...stats,
        profiles: profileMap.get(stats.user_id) || null
      })) as AllTimeStats[];
    },
  });

  // Fetch poules with statistics
  const { data: poulesWithStats } = useQuery({
    queryKey: ["poules-with-stats"],
    queryFn: async () => {
      // Fetch all poules
      const { data: poules, error: poulesError } = await supabase
        .from("poules")
        .select("id, name, entry_fee, max_members, status, tournament_id, created_at")
        .order("created_at", { ascending: false });
      if (poulesError) throw poulesError;

      // Fetch member counts and total points per poule
      const { data: members, error: membersError } = await supabase
        .from("poule_members")
        .select("poule_id, points, user_id");
      if (membersError) throw membersError;

      // Fetch prediction counts per poule
      const { data: predictions, error: predictionsError } = await supabase
        .from("predictions")
        .select("poule_id, id");
      if (predictionsError) throw predictionsError;

      // Aggregate stats
      const statsMap: Record<string, { memberCount: number; totalPoints: number; predictionCount: number; potValue: number }> = {};
      
      poules?.forEach(poule => {
        const pouleMembers = members?.filter(m => m.poule_id === poule.id) || [];
        const poulePredictions = predictions?.filter(p => p.poule_id === poule.id) || [];
        
        statsMap[poule.id] = {
          memberCount: pouleMembers.length,
          totalPoints: pouleMembers.reduce((sum, m) => sum + m.points, 0),
          predictionCount: poulePredictions.length,
          potValue: pouleMembers.length * poule.entry_fee,
        };
      });

      return poules?.map(poule => ({
        ...poule,
        ...statsMap[poule.id],
      }));
    },
  });

  // Fetch current tournament leaderboards from poule_members
  const { data: currentLeaderboard } = useQuery({
    queryKey: ["current-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poule_members")
        .select("user_id, points")
        .order("points", { ascending: false });
      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set(data?.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      // Aggregate points per user across all poules
      const userPoints: Record<string, { points: number; name: string }> = {};
      data?.forEach(member => {
        const userId = member.user_id;
        const profile = profileMap.get(userId);
        const name = profile?.display_name || "Onbekend";
        if (!userPoints[userId]) {
          userPoints[userId] = { points: 0, name };
        }
        userPoints[userId].points += member.points;
      });
      
      return Object.entries(userPoints)
        .map(([userId, { points, name }]) => ({ userId, points, name }))
        .sort((a, b) => b.points - a.points);
    },
  });

  // Calculate records
  const records: UserRecord[] = [];
  if (allTimeStats && allTimeStats.length > 0) {
    // Highest total points
    const highestPoints = allTimeStats[0];
    if (highestPoints) {
      records.push({
        userId: highestPoints.user_id,
        userName: highestPoints.profiles?.display_name || "Onbekend",
        value: highestPoints.total_points,
        description: "Meeste totale punten",
      });
    }

    // Most tournament wins
    const mostWins = [...allTimeStats].sort((a, b) => b.tournament_wins - a.tournament_wins)[0];
    if (mostWins && mostWins.tournament_wins > 0) {
      records.push({
        userId: mostWins.user_id,
        userName: mostWins.profiles?.display_name || "Onbekend",
        value: mostWins.tournament_wins,
        description: "Meeste toernooi overwinningen",
      });
    }

    // Most correct scores
    const mostCorrectScores = [...allTimeStats].sort((a, b) => b.correct_scores - a.correct_scores)[0];
    if (mostCorrectScores && mostCorrectScores.correct_scores > 0) {
      records.push({
        userId: mostCorrectScores.user_id,
        userName: mostCorrectScores.profiles?.display_name || "Onbekend",
        value: mostCorrectScores.correct_scores,
        description: "Meeste exacte voorspellingen",
      });
    }

    // Best average
    const bestAverage = [...allTimeStats]
      .filter(s => s.total_tournaments > 0)
      .sort((a, b) => b.avg_points_per_tournament - a.avg_points_per_tournament)[0];
    if (bestAverage) {
      records.push({
        userId: bestAverage.user_id,
        userName: bestAverage.profiles?.display_name || "Onbekend",
        value: Math.round(bestAverage.avg_points_per_tournament),
        description: "Hoogste gemiddelde per toernooi",
      });
    }
  }

  // Finalize tournament and update all-time stats
  const finalizeTournamentMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      setIsUpdatingStats(true);
      
      // Get all poule members with their points
      const { data: members, error: membersError } = await supabase
        .from("poule_members")
        .select(`
          user_id,
          points,
          rank,
          poules!inner (tournament_id)
        `);
      
      if (membersError) throw membersError;
      
      // Filter by tournament
      const tournamentMembers = members?.filter(m => m.poules?.tournament_id === tournamentId) || [];
      
      // Aggregate stats per user
      const userStats: Record<string, {
        points: number;
        bestRank: number;
        isWinner: boolean;
        isPodium: boolean;
      }> = {};
      
      tournamentMembers.forEach(member => {
        const userId = member.user_id;
        if (!userStats[userId]) {
          userStats[userId] = { points: 0, bestRank: 999, isWinner: false, isPodium: false };
        }
        userStats[userId].points += member.points;
        if (member.rank && member.rank < userStats[userId].bestRank) {
          userStats[userId].bestRank = member.rank;
        }
        if (member.rank === 1) userStats[userId].isWinner = true;
        if (member.rank && member.rank <= 3) userStats[userId].isPodium = true;
      });
      
      // Update all-time stats for each user
      for (const [userId, stats] of Object.entries(userStats)) {
        const { data: existing } = await supabase
          .from("user_all_time_stats")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        
        if (existing) {
          const newTotalPoints = existing.total_points + stats.points;
          const newTotalTournaments = existing.total_tournaments + 1;
          
          await supabase
            .from("user_all_time_stats")
            .update({
              total_points: newTotalPoints,
              total_tournaments: newTotalTournaments,
              tournament_wins: existing.tournament_wins + (stats.isWinner ? 1 : 0),
              podium_finishes: existing.podium_finishes + (stats.isPodium ? 1 : 0),
              best_finish: existing.best_finish 
                ? Math.min(existing.best_finish, stats.bestRank) 
                : stats.bestRank < 999 ? stats.bestRank : null,
              avg_points_per_tournament: newTotalPoints / newTotalTournaments,
            })
            .eq("user_id", userId);
        } else {
          await supabase
            .from("user_all_time_stats")
            .insert({
              user_id: userId,
              total_points: stats.points,
              total_tournaments: 1,
              tournament_wins: stats.isWinner ? 1 : 0,
              podium_finishes: stats.isPodium ? 1 : 0,
              best_finish: stats.bestRank < 999 ? stats.bestRank : null,
              avg_points_per_tournament: stats.points,
            });
        }
      }
      
      // Update tournament status
      await supabase
        .from("tournaments")
        .update({ status: "completed" })
        .eq("id", tournamentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-time-stats"] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      toast.success("Toernooi afgerond en statistieken bijgewerkt");
      setIsUpdatingStats(false);
    },
    onError: (error) => {
      toast.error("Fout bij afronden: " + error.message);
      setIsUpdatingStats(false);
    },
  });

  // Create tournament mutation
  const createTournamentMutation = useMutation({
    mutationFn: async ({ name, year, type }: { name: string; year: number; type: string }) => {
      const { error } = await supabase
        .from("tournaments")
        .insert({ name, year, type, status: "upcoming" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      toast.success("Toernooi aangemaakt");
      setIsCreateDialogOpen(false);
      setNewTournament({ name: "", year: new Date().getFullYear(), type: "world_cup" });
    },
    onError: (error) => {
      toast.error("Fout bij aanmaken: " + error.message);
    },
  });

  // Activate tournament mutation
  const activateTournamentMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      // First deactivate any active tournament
      await supabase
        .from("tournaments")
        .update({ status: "upcoming" })
        .eq("status", "active");
      
      // Then activate the selected one
      const { error } = await supabase
        .from("tournaments")
        .update({ status: "active" })
        .eq("id", tournamentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      toast.success("Toernooi geactiveerd");
    },
    onError: (error) => {
      toast.error("Fout bij activeren: " + error.message);
    },
  });

  // Delete tournament mutation
  const deleteTournamentMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      const { error } = await supabase
        .from("tournaments")
        .delete()
        .eq("id", tournamentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      toast.success("Toernooi verwijderd");
    },
    onError: (error) => {
      toast.error("Fout bij verwijderen: " + error.message);
    },
  });

  const activeTournament = tournaments?.find(t => t.status === "active");

  const handleCreateTournament = () => {
    if (!newTournament.name.trim()) {
      toast.error("Vul een naam in voor het toernooi");
      return;
    }
    createTournamentMutation.mutate(newTournament);
  };

  if (isLoadingTournaments || isLoadingStats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Toernooibeheer</CardTitle>
                <CardDescription>Beheer toernooien en sluit af voor all-time statistieken</CardDescription>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nieuw Toernooi
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nieuw Toernooi Aanmaken</DialogTitle>
                  <DialogDescription>
                    Maak een nieuw toernooi aan voor het bijhouden van voorspellingen en statistieken.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="tournament-name">Naam</Label>
                    <Input
                      id="tournament-name"
                      placeholder="bijv. WK 2026"
                      value={newTournament.name}
                      onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tournament-year">Jaar</Label>
                      <Input
                        id="tournament-year"
                        type="number"
                        min={2020}
                        max={2100}
                        value={newTournament.year}
                        onChange={(e) => setNewTournament({ ...newTournament, year: parseInt(e.target.value) || new Date().getFullYear() })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tournament-type">Type</Label>
                      <Select
                        value={newTournament.type}
                        onValueChange={(value) => setNewTournament({ ...newTournament, type: value })}
                      >
                        <SelectTrigger id="tournament-type">
                          <SelectValue placeholder="Selecteer type" />
                        </SelectTrigger>
                        <SelectContent>
                          {TOURNAMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Annuleren
                  </Button>
                  <Button 
                    onClick={handleCreateTournament} 
                    disabled={createTournamentMutation.isPending}
                  >
                    {createTournamentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Aanmaken
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTournament && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{activeTournament.name}</p>
                    <p className="text-sm text-muted-foreground">Actief toernooi</p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="default" className="gap-2" disabled={isUpdatingStats}>
                      {isUpdatingStats ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Toernooi Afsluiten
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Toernooi afsluiten?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Hiermee worden alle punten gefinaliseerd en toegevoegd aan de all-time statistieken. 
                        Dit kan niet ongedaan worden gemaakt. Zorg dat alle resultaten correct zijn ingevuld en berekend.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuleren</AlertDialogCancel>
                      <AlertDialogAction onClick={() => finalizeTournamentMutation.mutate(activeTournament.id)}>
                        Afsluiten
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}

          {/* Tournament List */}
          {tournaments && tournaments.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Toernooi</TableHead>
                    <TableHead>Jaar</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tournaments.map((tournament) => (
                    <TableRow key={tournament.id}>
                      <TableCell className="font-medium">{tournament.name}</TableCell>
                      <TableCell>{tournament.year}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TOURNAMENT_TYPES.find(t => t.value === tournament.type)?.label || tournament.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={tournament.status === "active" ? "default" : tournament.status === "completed" ? "secondary" : "outline"}
                        >
                          {tournament.status === "completed" ? "Afgerond" : tournament.status === "active" ? "Actief" : "Gepland"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {tournament.status === "upcoming" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => activateTournamentMutation.mutate(tournament.id)}
                                disabled={activateTournamentMutation.isPending}
                              >
                                <Play className="w-3 h-3" />
                                Activeren
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Toernooi verwijderen?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Weet je zeker dat je "{tournament.name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteTournamentMutation.mutate(tournament.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Verwijderen
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                          {tournament.status === "completed" && (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Voltooid
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nog geen toernooien aangemaakt.</p>
              <p className="text-sm">Klik op "Nieuw Toernooi" om te beginnen.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Poules per Tournament */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Poule Overzicht</CardTitle>
              <CardDescription>Alle poules met statistieken per toernooi</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {poulesWithStats && poulesWithStats.length > 0 ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{poulesWithStats.length}</p>
                      <p className="text-sm text-muted-foreground">Totaal Poules</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {poulesWithStats.reduce((sum, p) => sum + (p.memberCount || 0), 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Totaal Deelnemers</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {poulesWithStats.reduce((sum, p) => sum + (p.predictionCount || 0), 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Totaal Voorspellingen</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        €{poulesWithStats.reduce((sum, p) => sum + (p.potValue || 0), 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Totale Pot</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group by tournament */}
              {tournaments?.map(tournament => {
                const tournamentPoules = poulesWithStats.filter(p => p.tournament_id === tournament.id);
                if (tournamentPoules.length === 0) return null;

                return (
                  <div key={tournament.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">{tournament.name}</h4>
                      <Badge variant={tournament.status === "active" ? "default" : "secondary"}>
                        {tournamentPoules.length} poules
                      </Badge>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Poule</TableHead>
                            <TableHead className="text-right">Deelnemers</TableHead>
                            <TableHead className="text-right hidden sm:table-cell">Voorspellingen</TableHead>
                            <TableHead className="text-right hidden md:table-cell">Punten</TableHead>
                            <TableHead className="text-right">Pot</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tournamentPoules.map(poule => (
                            <TableRow key={poule.id}>
                              <TableCell className="font-medium">{poule.name}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Users className="w-3 h-3 text-muted-foreground" />
                                  {poule.memberCount || 0}
                                  {poule.max_members && (
                                    <span className="text-muted-foreground">/{poule.max_members}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right hidden sm:table-cell">
                                {poule.predictionCount || 0}
                              </TableCell>
                              <TableCell className="text-right hidden md:table-cell font-medium text-primary">
                                {poule.totalPoints || 0}
                              </TableCell>
                              <TableCell className="text-right">
                                {poule.entry_fee > 0 ? (
                                  <span className="font-medium text-amber-500">€{poule.potValue || 0}</span>
                                ) : (
                                  <span className="text-muted-foreground">Gratis</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant={
                                  poule.status === "open" ? "default" : 
                                  poule.status === "closed" ? "secondary" : "outline"
                                }>
                                  {poule.status === "open" ? "Open" : poule.status === "closed" ? "Gesloten" : "Afgerond"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}

              {/* Unlinked poules */}
              {(() => {
                const unlinkedPoules = poulesWithStats.filter(p => !p.tournament_id);
                if (unlinkedPoules.length === 0) return null;

                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-semibold text-muted-foreground">Niet gekoppeld aan toernooi</h4>
                      <Badge variant="outline">{unlinkedPoules.length} poules</Badge>
                    </div>
                    <div className="border rounded-lg overflow-hidden border-dashed">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Poule</TableHead>
                            <TableHead className="text-right">Deelnemers</TableHead>
                            <TableHead className="text-right hidden sm:table-cell">Voorspellingen</TableHead>
                            <TableHead className="text-right hidden md:table-cell">Punten</TableHead>
                            <TableHead className="text-right">Pot</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unlinkedPoules.map(poule => (
                            <TableRow key={poule.id}>
                              <TableCell className="font-medium">{poule.name}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Users className="w-3 h-3 text-muted-foreground" />
                                  {poule.memberCount || 0}
                                </div>
                              </TableCell>
                              <TableCell className="text-right hidden sm:table-cell">
                                {poule.predictionCount || 0}
                              </TableCell>
                              <TableCell className="text-right hidden md:table-cell font-medium text-primary">
                                {poule.totalPoints || 0}
                              </TableCell>
                              <TableCell className="text-right">
                                {poule.entry_fee > 0 ? (
                                  <span className="font-medium text-amber-500">€{poule.potValue || 0}</span>
                                ) : (
                                  <span className="text-muted-foreground">Gratis</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline">{poule.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nog geen poules aangemaakt.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All-Time Ranking */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <CardTitle className="text-lg">All-Time Ranking</CardTitle>
              <CardDescription>Prestaties over alle toernooien heen</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {allTimeStats && allTimeStats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Speler</TableHead>
                  <TableHead className="text-right">Punten</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Toernooien</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Winsten</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Podium</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Gemiddeld</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTimeStats.map((stats, index) => (
                  <TableRow key={stats.user_id}>
                    <TableCell className="font-bold">
                      {index === 0 && <span className="text-yellow-500">🥇</span>}
                      {index === 1 && <span className="text-gray-400">🥈</span>}
                      {index === 2 && <span className="text-amber-600">🥉</span>}
                      {index > 2 && index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {stats.profiles?.display_name || "Onbekend"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {stats.total_points}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {stats.total_tournaments}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {stats.tournament_wins > 0 && (
                        <Badge variant="default" className="gap-1">
                          <Trophy className="w-3 h-3" />
                          {stats.tournament_wins}
                        </Badge>
                      )}
                      {stats.tournament_wins === 0 && "-"}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {stats.podium_finishes > 0 ? stats.podium_finishes : "-"}
                    </TableCell>
                    <TableCell className="text-right hidden lg:table-cell">
                      {stats.avg_points_per_tournament > 0 
                        ? Math.round(stats.avg_points_per_tournament) 
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nog geen all-time statistieken beschikbaar.</p>
              <p className="text-sm">Sluit een toernooi af om statistieken te genereren.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Records</CardTitle>
              <CardDescription>Hoogste prestaties aller tijden</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {records.map((record, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Target className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{record.description}</p>
                      <p className="font-medium">{record.userName}</p>
                    </div>
                    <div className="text-2xl font-bold text-primary">{record.value}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nog geen records beschikbaar.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Tournament Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Huidige Stand</CardTitle>
              <CardDescription>Totale punten dit toernooi (alle poules)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentLeaderboard && currentLeaderboard.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Speler</TableHead>
                  <TableHead className="text-right">Punten</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentLeaderboard.slice(0, 20).map((user, index) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-bold">
                      {index === 0 && <span className="text-yellow-500">🥇</span>}
                      {index === 1 && <span className="text-gray-400">🥈</span>}
                      {index === 2 && <span className="text-amber-600">🥉</span>}
                      {index > 2 && index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-right font-bold text-green-500">{user.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nog geen punten gescoord dit toernooi.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;