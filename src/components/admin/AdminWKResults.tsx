import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save, Trophy, Medal, Users, Loader2, Calculator, Check } from "lucide-react";
import { toast } from "sonner";

interface WKResults {
  winner: string;
  finalist: string;
}

interface GroupStanding {
  team: string;
  position: number;
}

const COUNTRIES = [
  { name: "Nederland", flag: "🇳🇱" },
  { name: "Duitsland", flag: "🇩🇪" },
  { name: "Frankrijk", flag: "🇫🇷" },
  { name: "Spanje", flag: "🇪🇸" },
  { name: "Engeland", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "België", flag: "🇧🇪" },
  { name: "Italië", flag: "🇮🇹" },
  { name: "Argentinië", flag: "🇦🇷" },
  { name: "Brazilië", flag: "🇧🇷" },
  { name: "USA", flag: "🇺🇸" },
  { name: "Mexico", flag: "🇲🇽" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Japan", flag: "🇯🇵" },
  { name: "Australië", flag: "🇦🇺" },
  { name: "Marokko", flag: "🇲🇦" },
  { name: "Senegal", flag: "🇸🇳" },
  { name: "Zuid-Korea", flag: "🇰🇷" },
  { name: "Kroatië", flag: "🇭🇷" },
  { name: "Uruguay", flag: "🇺🇾" },
  { name: "Zwitserland", flag: "🇨🇭" },
  { name: "Colombia", flag: "🇨🇴" },
  { name: "Denemarken", flag: "🇩🇰" },
  { name: "Polen", flag: "🇵🇱" },
  { name: "Ecuador", flag: "🇪🇨" },
  { name: "Saoedi-Arabië", flag: "🇸🇦" },
  { name: "Qatar", flag: "🇶🇦" },
  { name: "Wales", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { name: "Servië", flag: "🇷🇸" },
  { name: "Kameroen", flag: "🇨🇲" },
  { name: "Ghana", flag: "🇬🇭" },
  { name: "Tunesië", flag: "🇹🇳" },
];

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const AdminWKResults = () => {
  const queryClient = useQueryClient();
  const [wkResults, setWkResults] = useState<WKResults>({ winner: "", finalist: "" });
  const [groupStandings, setGroupStandings] = useState<Record<string, GroupStanding[]>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCalculatingGroup, setIsCalculatingGroup] = useState(false);

  // Fetch WK results
  const { data: existingWkResults, isLoading: isLoadingWk } = useQuery({
    queryKey: ["wk-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_settings")
        .select("*")
        .eq("setting_key", "wk_results")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data?.setting_value as unknown as WKResults | null;
    },
  });

  // Fetch teams from matches to populate group standings
  const { data: matchTeams } = useQuery({
    queryKey: ["match-teams-for-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("home_team, away_team, home_flag, away_flag, phase")
        .not("phase", "is", null);
      if (error) throw error;
      
      // Extract unique teams per group
      const teamsByGroup: Record<string, { name: string; flag: string }[]> = {};
      
      data?.forEach(match => {
        const phase = match.phase;
        if (phase && phase.startsWith("Groep ")) {
          const group = phase.replace("Groep ", "");
          if (!teamsByGroup[group]) teamsByGroup[group] = [];
          
          const addTeam = (name: string, flag: string | null) => {
            if (!teamsByGroup[group].find(t => t.name === name)) {
              teamsByGroup[group].push({ name, flag: flag || "" });
            }
          };
          
          addTeam(match.home_team, match.home_flag);
          addTeam(match.away_team, match.away_flag);
        }
      });
      
      return teamsByGroup;
    },
  });

  // Fetch existing actual group standings
  const { data: existingGroupStandings, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["actual-group-standings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actual_group_standings")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existingWkResults) {
      setWkResults(existingWkResults);
    }
  }, [existingWkResults]);

  useEffect(() => {
    if (existingGroupStandings) {
      const standings: Record<string, GroupStanding[]> = {};
      existingGroupStandings.forEach(gs => {
        standings[gs.group_name] = gs.standings as unknown as GroupStanding[];
      });
      setGroupStandings(standings);
    }
  }, [existingGroupStandings]);

  // Save WK results
  const saveWkResultsMutation = useMutation({
    mutationFn: async (results: WKResults) => {
      const { data: existing } = await supabase
        .from("global_settings")
        .select("id")
        .eq("setting_key", "wk_results")
        .single();

      if (existing) {
        const { error } = await supabase
          .from("global_settings")
          .update({ setting_value: JSON.parse(JSON.stringify(results)) })
          .eq("setting_key", "wk_results");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("global_settings")
          .insert([{ setting_key: "wk_results", setting_value: JSON.parse(JSON.stringify(results)) }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wk-results"] });
      toast.success("WK resultaten opgeslagen");
    },
    onError: (error) => {
      toast.error("Fout bij opslaan: " + error.message);
    },
  });

  // Save group standings
  const saveGroupStandingMutation = useMutation({
    mutationFn: async ({ group, standings }: { group: string; standings: GroupStanding[] }) => {
      const { data: existing } = await supabase
        .from("actual_group_standings")
        .select("id")
        .eq("group_name", group)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("actual_group_standings")
          .update({ standings: JSON.parse(JSON.stringify(standings)) })
          .eq("group_name", group);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("actual_group_standings")
          .insert([{ group_name: group, standings: JSON.parse(JSON.stringify(standings)) }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actual-group-standings"] });
      toast.success("Groepseindstand opgeslagen");
    },
    onError: (error) => {
      toast.error("Fout bij opslaan: " + error.message);
    },
  });

  const handleGroupTeamChange = (group: string, position: number, team: string) => {
    const currentStandings = groupStandings[group] || [];
    const newStandings = [...currentStandings];
    
    // Remove team from other positions in same group
    const filtered = newStandings.filter(s => s.team !== team && s.position !== position);
    filtered.push({ team, position });
    filtered.sort((a, b) => a.position - b.position);
    
    setGroupStandings({ ...groupStandings, [group]: filtered });
  };

  const saveGroupStanding = (group: string) => {
    const standings = groupStandings[group];
    if (!standings || standings.length !== 4) {
      toast.error("Vul alle 4 posities in voor deze groep");
      return;
    }
    saveGroupStandingMutation.mutate({ group, standings });
  };

  const calculateWinnerPoints = async () => {
    setIsCalculating(true);
    try {
      const { error } = await supabase.functions.invoke("calculate-winner-points");
      if (error) throw error;
      toast.success("WK winnaar punten berekend");
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
    } catch (error: any) {
      toast.error("Fout bij berekenen: " + error.message);
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateGroupPoints = async () => {
    setIsCalculatingGroup(true);
    try {
      const { error } = await supabase.functions.invoke("calculate-group-points");
      if (error) throw error;
      toast.success("Groepseindstand punten berekend");
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
    } catch (error: any) {
      toast.error("Fout bij berekenen: " + error.message);
    } finally {
      setIsCalculatingGroup(false);
    }
  };

  const getTeamsForGroup = (group: string) => {
    return matchTeams?.[group] || [];
  };

  const getTeamAtPosition = (group: string, position: number) => {
    return groupStandings[group]?.find(s => s.position === position)?.team || "";
  };

  const isGroupComplete = (group: string) => {
    return groupStandings[group]?.length === 4;
  };

  if (isLoadingWk || isLoadingGroups) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* WK Winner & Finalist */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <CardTitle className="text-lg">WK Winnaar & Finalist</CardTitle>
              <CardDescription>Vul de officiële WK resultaten in voor puntenberekening</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                WK Winnaar
              </Label>
              <Select value={wkResults.winner} onValueChange={(v) => setWkResults({ ...wkResults, winner: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer winnaar" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.flag} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Medal className="w-4 h-4 text-gray-400" />
                Finalist (verliezer finale)
              </Label>
              <Select value={wkResults.finalist} onValueChange={(v) => setWkResults({ ...wkResults, finalist: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer finalist" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.filter(c => c.name !== wkResults.winner).map(c => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.flag} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 pt-2">
            <Button 
              onClick={() => saveWkResultsMutation.mutate(wkResults)} 
              disabled={saveWkResultsMutation.isPending || !wkResults.winner}
              className="gap-2"
            >
              {saveWkResultsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Opslaan
            </Button>
            <Button 
              variant="secondary"
              onClick={calculateWinnerPoints} 
              disabled={isCalculating || !wkResults.winner}
              className="gap-2"
            >
              {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
              Bereken Punten
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Group Standings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Groepseindstanden</CardTitle>
                <CardDescription>Vul de definitieve eindstanden per groep in</CardDescription>
              </div>
            </div>
            <Button 
              variant="secondary"
              onClick={calculateGroupPoints} 
              disabled={isCalculatingGroup}
              className="gap-2"
            >
              {isCalculatingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
              Bereken Alle Punten
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {GROUPS.map(group => {
              const teams = getTeamsForGroup(group);
              const complete = isGroupComplete(group);
              
              return (
                <div key={group} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2">
                      Groep {group}
                      {complete && <Check className="w-4 h-4 text-green-500" />}
                    </h4>
                    <Button 
                      size="sm" 
                      variant={complete ? "default" : "outline"}
                      onClick={() => saveGroupStanding(group)}
                      disabled={saveGroupStandingMutation.isPending || !complete}
                    >
                      {saveGroupStandingMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Save className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  
                  {teams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Geen teams gevonden voor deze groep</p>
                  ) : (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map(pos => (
                        <div key={pos} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                            {pos}
                          </span>
                          <Select 
                            value={getTeamAtPosition(group, pos)} 
                            onValueChange={(v) => handleGroupTeamChange(group, pos, v)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={`${pos}e plaats`} />
                            </SelectTrigger>
                            <SelectContent>
                              {teams.map(t => (
                                <SelectItem key={t.name} value={t.name}>
                                  {t.flag} {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Info Box */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Puntenberekening:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>WK Winnaar correct:</strong> 25 punten</li>
              <li><strong>Finalist voorspeld (haalt finale):</strong> 5 punten</li>
              <li><strong>Groepseindstand - positie correct:</strong> 3 punten per team</li>
              <li><strong>Groepseindstand - alle 4 correct:</strong> +10 bonus punten</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWKResults;
