import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Trophy, Medal, Users, Loader2, TrendingUp, Award, Calendar, BarChart3, Target, CheckCircle } from "lucide-react";
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
  profiles?: { display_name: string | null; email: string | null } | null;
}

interface UserRecord {
  userId: string;
  userName: string;
  value: number;
  description: string;
}

const AdminAnalytics = () => {
  const queryClient = useQueryClient();
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [isUpdatingStats, setIsUpdatingStats] = useState(false);

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
        .select("id, display_name, email")
        .in("id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      return data?.map(stats => ({
        ...stats,
        profiles: profileMap.get(stats.user_id) || null
      })) as AllTimeStats[];
    },
  });

  // Fetch current tournament leaderboards from poule_members
  const { data: currentLeaderboard } = useQuery({
    queryKey: ["current-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poule_members")
        .select(`
          user_id,
          points,
          profiles:user_id (display_name, email)
        `)
        .order("points", { ascending: false });
      if (error) throw error;
      
      // Aggregate points per user across all poules
      const userPoints: Record<string, { points: number; name: string }> = {};
      data?.forEach(member => {
        const userId = member.user_id;
        const name = member.profiles?.display_name || member.profiles?.email || "Onbekend";
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
        userName: highestPoints.profiles?.display_name || highestPoints.profiles?.email || "Onbekend",
        value: highestPoints.total_points,
        description: "Meeste totale punten",
      });
    }

    // Most tournament wins
    const mostWins = [...allTimeStats].sort((a, b) => b.tournament_wins - a.tournament_wins)[0];
    if (mostWins && mostWins.tournament_wins > 0) {
      records.push({
        userId: mostWins.user_id,
        userName: mostWins.profiles?.display_name || mostWins.profiles?.email || "Onbekend",
        value: mostWins.tournament_wins,
        description: "Meeste toernooi overwinningen",
      });
    }

    // Most correct scores
    const mostCorrectScores = [...allTimeStats].sort((a, b) => b.correct_scores - a.correct_scores)[0];
    if (mostCorrectScores && mostCorrectScores.correct_scores > 0) {
      records.push({
        userId: mostCorrectScores.user_id,
        userName: mostCorrectScores.profiles?.display_name || mostCorrectScores.profiles?.email || "Onbekend",
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
        userName: bestAverage.profiles?.display_name || bestAverage.profiles?.email || "Onbekend",
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
    mutationFn: async ({ name, year }: { name: string; year: number }) => {
      const { error } = await supabase
        .from("tournaments")
        .insert({ name, year, type: "world_cup", status: "upcoming" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      toast.success("Toernooi aangemaakt");
    },
    onError: (error) => {
      toast.error("Fout bij aanmaken: " + error.message);
    },
  });

  const activeTournament = tournaments?.find(t => t.status === "active");

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

          <div className="flex flex-wrap gap-2">
            {tournaments?.map(t => (
              <Badge 
                key={t.id} 
                variant={t.status === "active" ? "default" : t.status === "completed" ? "secondary" : "outline"}
              >
                {t.name} ({t.status === "completed" ? "Afgerond" : t.status === "active" ? "Actief" : "Gepland"})
              </Badge>
            ))}
          </div>
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
                      {stats.profiles?.display_name || stats.profiles?.email || "Onbekend"}
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