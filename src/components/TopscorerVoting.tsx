import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Goal, Search, Check, Clock, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { format, isBefore } from "date-fns";
import { nl } from "date-fns/locale";

interface Player {
  id: string;
  name: string;
  country: string;
  country_flag: string | null;
  position: string;
  goals: number;
  jersey_number: number | null;
}

interface TopscorerPrediction {
  id: string;
  user_id: string;
  player_id: string;
  points_earned: number;
  created_at: string;
  player?: Player;
}

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface TopscorerVotingProps {
  pouleId: string;
  deadline?: string | null;
}

const TopscorerVoting = ({ pouleId, deadline }: TopscorerVotingProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");

  const isDeadlinePassed = deadline ? isBefore(new Date(deadline), new Date()) : false;

  // Fetch first match kickoff as fallback deadline
  const { data: firstMatch } = useQuery({
    queryKey: ["first-match"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("kickoff_time")
        .order("kickoff_time", { ascending: true })
        .limit(1)
        .single();
      if (error) return null;
      return data;
    },
  });

  const effectiveDeadline = deadline || firstMatch?.kickoff_time;
  const isEffectiveDeadlinePassed = effectiveDeadline 
    ? isBefore(new Date(effectiveDeadline), new Date()) 
    : false;

  // Fetch all players
  const { data: players } = useQuery({
    queryKey: ["players-for-voting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("goals", { ascending: false })
        .order("name");
      if (error) throw error;
      return data as Player[];
    },
  });

  // Fetch user's prediction
  const { data: myPrediction } = useQuery({
    queryKey: ["my-topscorer-prediction", pouleId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("topscorer_predictions")
        .select("*, player:players(*)")
        .eq("poule_id", pouleId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as TopscorerPrediction | null;
    },
    enabled: !!user,
  });

  // Fetch all predictions in poule
  const { data: allPredictions } = useQuery({
    queryKey: ["topscorer-predictions", pouleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topscorer_predictions")
        .select("*, player:players(*)")
        .eq("poule_id", pouleId);
      if (error) throw error;
      return data as TopscorerPrediction[];
    },
  });

  // Fetch profiles for predictions
  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-predictions", allPredictions?.map(p => p.user_id)],
    queryFn: async () => {
      if (!allPredictions?.length) return {};
      const userIds = [...new Set(allPredictions.map(p => p.user_id))];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);
      if (error) throw error;
      return Object.fromEntries((data as Profile[]).map(p => [p.id, p]));
    },
    enabled: !!allPredictions?.length,
  });

  // Create/update prediction mutation
  const saveMutation = useMutation({
    mutationFn: async (playerId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      if (myPrediction) {
        const { error } = await supabase
          .from("topscorer_predictions")
          .update({ player_id: playerId })
          .eq("id", myPrediction.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("topscorer_predictions")
          .insert({
            user_id: user.id,
            poule_id: pouleId,
            player_id: playerId,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-topscorer-prediction", pouleId] });
      queryClient.invalidateQueries({ queryKey: ["topscorer-predictions", pouleId] });
      toast.success("Topscorer voorspelling opgeslagen!");
      setSelectedPlayerId("");
    },
    onError: (error) => {
      toast.error("Fout bij opslaan: " + error.message);
    },
  });

  const filteredPlayers = players?.filter(
    (player) =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = () => {
    if (selectedPlayerId) {
      saveMutation.mutate(selectedPlayerId);
    }
  };

  // Group predictions by player
  const predictionsByPlayer = allPredictions?.reduce((acc, pred) => {
    if (!acc[pred.player_id]) {
      acc[pred.player_id] = [];
    }
    acc[pred.player_id].push(pred);
    return acc;
  }, {} as Record<string, TopscorerPrediction[]>) || {};

  return (
    <div className="space-y-6">
      {/* Deadline Warning */}
      {effectiveDeadline && (
        <Card className={isEffectiveDeadlinePassed ? "border-destructive/50 bg-destructive/5" : "border-primary/50 bg-primary/5"}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              {isEffectiveDeadlinePassed ? (
                <>
                  <Lock className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">Stemmen gesloten</p>
                    <p className="text-sm text-muted-foreground">
                      De deadline was {format(new Date(effectiveDeadline), "d MMMM yyyy 'om' HH:mm", { locale: nl })}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Deadline voor stemmen</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(effectiveDeadline), "d MMMM yyyy 'om' HH:mm", { locale: nl })}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Current Prediction */}
      {myPrediction?.player && (
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Jouw voorspelling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-2xl">
                {myPrediction.player.country_flag || "⚽"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {myPrediction.player.jersey_number && (
                    <span className="text-xs font-bold text-primary">#{myPrediction.player.jersey_number}</span>
                  )}
                  <span className="font-semibold">{myPrediction.player.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{myPrediction.player.country}</span>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-primary font-bold">
                  <Goal className="w-4 h-4" />
                  <span>{myPrediction.player.goals}</span>
                </div>
                <span className="text-xs text-muted-foreground">goals</span>
              </div>
            </div>
            {myPrediction.points_earned > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary">
                  +{myPrediction.points_earned} punten verdiend
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vote Form */}
      {!isEffectiveDeadlinePassed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {myPrediction ? "Wijzig je voorspelling" : "Kies je topscorer"}
            </CardTitle>
            <CardDescription>
              Wie wordt de topscorer van het toernooi?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Zoek speler..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer een speler" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {filteredPlayers?.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    <div className="flex items-center gap-2">
                      <span>{player.country_flag}</span>
                      {player.jersey_number && (
                        <span className="text-xs font-bold text-primary">#{player.jersey_number}</span>
                      )}
                      <span>{player.name}</span>
                      <span className="text-muted-foreground">({player.goals} goals)</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={handleSubmit} 
              disabled={!selectedPlayerId || saveMutation.isPending}
              className="w-full"
            >
              {saveMutation.isPending ? "Opslaan..." : myPrediction ? "Wijzigen" : "Stem opslaan"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* All Predictions in Poule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Stemmen in deze poule
          </CardTitle>
          <CardDescription>
            {allPredictions?.length || 0} stemmen uitgebracht
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.entries(predictionsByPlayer).length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              Nog geen stemmen uitgebracht
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(predictionsByPlayer)
                .sort((a, b) => b[1].length - a[1].length)
                .map(([playerId, predictions]) => {
                  const player = predictions[0]?.player;
                  if (!player) return null;
                  
                  return (
                    <div key={playerId} className="p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">{player.country_flag}</span>
                        <div className="flex-1">
                          <span className="font-medium">{player.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({player.goals} goals)
                          </span>
                        </div>
                        <Badge variant="secondary">{predictions.length} stem{predictions.length !== 1 ? "men" : ""}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {predictions.map((pred) => (
                          <Badge 
                            key={pred.id} 
                            variant="outline" 
                            className={pred.user_id === user?.id ? "border-primary bg-primary/10" : ""}
                          >
                            {pred.user_id === user?.id && <Check className="w-3 h-3 mr-1" />}
                            {profiles?.[pred.user_id]?.display_name || "Onbekend"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Scorers Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Goal className="w-5 h-5 text-primary" />
            Topscorers Stand
          </CardTitle>
          <CardDescription>
            Huidige topscorers van het toernooi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {players?.slice(0, 10).map((player, index) => (
              <div 
                key={player.id} 
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors"
              >
                <span className={`w-6 text-center font-bold ${index < 3 ? "text-primary" : "text-muted-foreground"}`}>
                  {index + 1}
                </span>
                <span className="text-lg">{player.country_flag}</span>
                <div className="flex-1">
                  <span className="font-medium">{player.name}</span>
                </div>
                <div className="flex items-center gap-1 font-bold text-primary">
                  <Goal className="w-4 h-4" />
                  {player.goals}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopscorerVoting;