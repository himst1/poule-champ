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
import { Trophy, Search, Check, Clock, Lock, User, Flag } from "lucide-react";
import { toast } from "sonner";
import { format, isBefore } from "date-fns";
import { nl } from "date-fns/locale";
import { FlagImage } from "@/components/FlagImage";
import { COUNTRY_CODES } from "@/lib/flags";

// WK 2026 participating countries
const WK_COUNTRIES = [
  { name: "Argentinië", code: "ar" },
  { name: "Australië", code: "au" },
  { name: "België", code: "be" },
  { name: "Brazilië", code: "br" },
  { name: "Canada", code: "ca" },
  { name: "Chili", code: "cl" },
  { name: "Colombia", code: "co" },
  { name: "Costa Rica", code: "cr" },
  { name: "Denemarken", code: "dk" },
  { name: "Duitsland", code: "de" },
  { name: "Ecuador", code: "ec" },
  { name: "Egypte", code: "eg" },
  { name: "Engeland", code: "gb-eng" },
  { name: "Frankrijk", code: "fr" },
  { name: "Ghana", code: "gh" },
  { name: "Iran", code: "ir" },
  { name: "Italië", code: "it" },
  { name: "Japan", code: "jp" },
  { name: "Kameroen", code: "cm" },
  { name: "Kroatië", code: "hr" },
  { name: "Marokko", code: "ma" },
  { name: "Mexico", code: "mx" },
  { name: "Nederland", code: "nl" },
  { name: "Nigeria", code: "ng" },
  { name: "Oekraïne", code: "ua" },
  { name: "Paraguay", code: "py" },
  { name: "Peru", code: "pe" },
  { name: "Polen", code: "pl" },
  { name: "Portugal", code: "pt" },
  { name: "Qatar", code: "qa" },
  { name: "Saoedi-Arabië", code: "sa" },
  { name: "Senegal", code: "sn" },
  { name: "Servië", code: "rs" },
  { name: "Spanje", code: "es" },
  { name: "Tunesië", code: "tn" },
  { name: "Uruguay", code: "uy" },
  { name: "Verenigde Staten", code: "us" },
  { name: "Wales", code: "gb-wls" },
  { name: "Zuid-Korea", code: "kr" },
  { name: "Zwitserland", code: "ch" },
];

interface WinnerPrediction {
  id: string;
  user_id: string;
  country: string;
  points_earned: number;
  created_at: string;
}

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface WinnerVotingProps {
  pouleId: string;
  deadline?: string | null;
}

const WinnerVoting = ({ pouleId, deadline }: WinnerVotingProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");

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

  // Fetch user's prediction
  const { data: myPrediction } = useQuery({
    queryKey: ["my-winner-prediction", pouleId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("winner_predictions")
        .select("*")
        .eq("poule_id", pouleId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as WinnerPrediction | null;
    },
    enabled: !!user,
  });

  // Fetch all predictions in poule
  const { data: allPredictions } = useQuery({
    queryKey: ["winner-predictions", pouleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("winner_predictions")
        .select("*")
        .eq("poule_id", pouleId);
      if (error) throw error;
      return data as WinnerPrediction[];
    },
  });

  // Fetch profiles for predictions
  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-winner-predictions", allPredictions?.map(p => p.user_id)],
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
    mutationFn: async (countryName: string) => {
      if (!user) throw new Error("Not authenticated");
      
      const country = WK_COUNTRIES.find(c => c.name === countryName);
      if (!country) throw new Error("Land niet gevonden");
      
      if (myPrediction) {
        const { error } = await supabase
          .from("winner_predictions")
          .update({ 
            country: country.name,
            country_flag: null // We no longer store emoji flags
          })
          .eq("id", myPrediction.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("winner_predictions")
          .insert({
            user_id: user.id,
            poule_id: pouleId,
            country: country.name,
            country_flag: null, // We no longer store emoji flags
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-winner-prediction", pouleId] });
      queryClient.invalidateQueries({ queryKey: ["winner-predictions", pouleId] });
      toast.success("WK Winnaar voorspelling opgeslagen!");
      setSelectedCountry("");
    },
    onError: (error) => {
      toast.error("Fout bij opslaan: " + error.message);
    },
  });

  const filteredCountries = WK_COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = () => {
    if (selectedCountry) {
      saveMutation.mutate(selectedCountry);
    }
  };

  // Group predictions by country
  const predictionsByCountry = allPredictions?.reduce((acc, pred) => {
    if (!acc[pred.country]) {
      acc[pred.country] = [];
    }
    acc[pred.country].push(pred);
    return acc;
  }, {} as Record<string, WinnerPrediction[]>) || {};

  const getCountryInfo = (countryName: string) => {
    return WK_COUNTRIES.find(c => c.name === countryName);
  };

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
      {myPrediction && (
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Jouw voorspelling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
                <FlagImage teamName={myPrediction.country} size="md" />
              </div>
              <div className="flex-1">
                <span className="font-semibold">{myPrediction.country}</span>
                <span className="text-sm text-muted-foreground block">WK 2026 Winnaar</span>
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
              {myPrediction ? "Wijzig je voorspelling" : "Kies de WK Winnaar"}
            </CardTitle>
            <CardDescription>
              Welk land wint het WK 2026?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Zoek land..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer een land" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {filteredCountries.map((country) => (
                  <SelectItem key={country.code} value={country.name}>
                    <div className="flex items-center gap-2">
                      <FlagImage teamName={country.name} size="xs" />
                      <span>{country.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={handleSubmit} 
              disabled={!selectedCountry || saveMutation.isPending}
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
          {Object.entries(predictionsByCountry).length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              Nog geen stemmen uitgebracht
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(predictionsByCountry)
                .sort((a, b) => b[1].length - a[1].length)
                .map(([countryName, predictions]) => {
                  return (
                    <div key={countryName} className="p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-3 mb-2">
                        <FlagImage teamName={countryName} size="sm" />
                        <div className="flex-1">
                          <span className="font-medium">{countryName}</span>
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

      {/* Popular Picks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Flag className="w-5 h-5 text-primary" />
            Populaire Keuzes
          </CardTitle>
          <CardDescription>
            Top favorieten in deze poule
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.entries(predictionsByCountry).length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              Nog geen stemmen uitgebracht
            </p>
          ) : (
            <div className="space-y-2">
              {Object.entries(predictionsByCountry)
                .sort((a, b) => b[1].length - a[1].length)
                .slice(0, 5)
                .map(([countryName, predictions], index) => {
                  const totalVotes = allPredictions?.length || 1;
                  const percentage = Math.round((predictions.length / totalVotes) * 100);
                  
                  return (
                    <div 
                      key={countryName} 
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors"
                    >
                      <span className={`w-6 text-center font-bold ${index < 3 ? "text-primary" : "text-muted-foreground"}`}>
                        {index + 1}
                      </span>
                      <FlagImage teamName={countryName} size="sm" />
                      <div className="flex-1">
                        <span className="font-medium">{countryName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-primary">{predictions.length}</span>
                        <span className="text-muted-foreground text-sm ml-1">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WinnerVoting;