import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { Save, Trophy, Medal, Users, Loader2, Calculator, Check, Lock, Unlock, FileText, ChevronDown, History } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { FlagImage } from "@/components/FlagImage";

interface WKResults {
  winner: string;
  finalist: string;
}

interface GroupStanding {
  team: string;
  position: number;
}

interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value: any;
  new_value: any;
  performed_by: string;
  performed_at: string;
  notes: string | null;
  profiles?: { display_name: string | null; email: string | null } | null;
}

const COUNTRIES = [
  { name: "Nederland" },
  { name: "Duitsland" },
  { name: "Frankrijk" },
  { name: "Spanje" },
  { name: "Engeland" },
  { name: "Portugal" },
  { name: "België" },
  { name: "Italië" },
  { name: "Argentinië" },
  { name: "Brazilië" },
  { name: "USA" },
  { name: "Mexico" },
  { name: "Canada" },
  { name: "Japan" },
  { name: "Australië" },
  { name: "Marokko" },
  { name: "Senegal" },
  { name: "Zuid-Korea" },
  { name: "Kroatië" },
  { name: "Uruguay" },
  { name: "Zwitserland" },
  { name: "Colombia" },
  { name: "Denemarken" },
  { name: "Polen" },
  { name: "Ecuador" },
  { name: "Saoedi-Arabië" },
  { name: "Qatar" },
  { name: "Wales" },
  { name: "Servië" },
  { name: "Kameroen" },
  { name: "Ghana" },
  { name: "Tunesië" },
];

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H"];

type ResultStatus = "draft" | "final" | "locked";

const StatusBadge = ({ status }: { status: ResultStatus }) => {
  const config = {
    draft: { label: "Concept", variant: "secondary" as const, icon: FileText },
    final: { label: "Definitief", variant: "default" as const, icon: Check },
    locked: { label: "Vergrendeld", variant: "destructive" as const, icon: Lock },
  };
  
  const { label, variant, icon: Icon } = config[status];
  
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
};

const StatusWorkflow = ({ currentStatus }: { currentStatus: ResultStatus }) => {
  const steps = [
    { status: "draft" as const, label: "Concept", icon: FileText },
    { status: "final" as const, label: "Definitief", icon: Check },
    { status: "locked" as const, label: "Vergrendeld", icon: Lock },
  ];
  
  const currentIndex = steps.findIndex(s => s.status === currentStatus);
  
  return (
    <div className="flex items-center gap-2 text-sm">
      {steps.map((step, index) => {
        const isActive = step.status === currentStatus;
        const isPast = index < currentIndex;
        
        return (
          <div key={step.status} className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${
              isActive ? "bg-primary text-primary-foreground" : 
              isPast ? "bg-muted text-muted-foreground" : "text-muted-foreground/50"
            }`}>
              <step.icon className="w-3 h-3" />
              <span>{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <span className="text-muted-foreground">→</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

const AdminWKResults = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [wkResults, setWkResults] = useState<WKResults>({ winner: "", finalist: "" });
  const [groupStandings, setGroupStandings] = useState<Record<string, GroupStanding[]>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCalculatingGroup, setIsCalculatingGroup] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [wkStatus, setWkStatus] = useState<ResultStatus>("draft");

  // Fetch WK results with status
  const { data: existingWkResults, isLoading: isLoadingWk } = useQuery({
    queryKey: ["wk-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_settings")
        .select("*")
        .eq("setting_key", "wk_results")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch audit logs
  const { data: auditLogs } = useQuery({
    queryKey: ["result-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("result_audit_log")
        .select("*")
        .order("performed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set(data?.map(log => log.performed_by).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, email")
        .in("id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      return data?.map(log => ({
        ...log,
        profiles: log.performed_by ? profileMap.get(log.performed_by) : null
      })) as AuditLogEntry[];
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
      const value = existingWkResults.setting_value as unknown as WKResults;
      setWkResults(value || { winner: "", finalist: "" });
      setWkStatus((existingWkResults.status as ResultStatus) || "draft");
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

  // Log audit entry
  const logAuditEntry = async (
    entityType: string,
    entityId: string,
    action: string,
    oldValue: any,
    newValue: any,
    notes?: string
  ) => {
    await supabase.from("result_audit_log").insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      old_value: oldValue,
      new_value: newValue,
      performed_by: user?.id,
      notes,
    });
    queryClient.invalidateQueries({ queryKey: ["result-audit-logs"] });
  };

  // Save WK results
  const saveWkResultsMutation = useMutation({
    mutationFn: async (results: WKResults) => {
      const { data: existing } = await supabase
        .from("global_settings")
        .select("id, setting_value")
        .eq("setting_key", "wk_results")
        .maybeSingle();

      const oldValue = existing?.setting_value;

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

      await logAuditEntry("wk_results", "wk_results", existing ? "updated" : "created", oldValue, results);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wk-results"] });
      toast.success("WK resultaten opgeslagen");
    },
    onError: (error) => {
      toast.error("Fout bij opslaan: " + error.message);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ newStatus, notes }: { newStatus: ResultStatus; notes?: string }) => {
      const oldStatus = wkStatus;
      
      const updateData: any = { status: newStatus };
      if (newStatus === "locked") {
        updateData.locked_at = new Date().toISOString();
        updateData.locked_by = user?.id;
      } else if (newStatus === "draft") {
        updateData.locked_at = null;
        updateData.locked_by = null;
      }

      const { error } = await supabase
        .from("global_settings")
        .update(updateData)
        .eq("setting_key", "wk_results");
      if (error) throw error;

      await logAuditEntry("wk_results", "wk_results", newStatus === "locked" ? "locked" : newStatus === "final" ? "finalized" : "unlocked", { status: oldStatus }, { status: newStatus }, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wk-results"] });
      toast.success("Status bijgewerkt");
    },
    onError: (error) => {
      toast.error("Fout bij status wijzigen: " + error.message);
    },
  });

  // Save group standings
  const saveGroupStandingMutation = useMutation({
    mutationFn: async ({ group, standings }: { group: string; standings: GroupStanding[] }) => {
      const { data: existing } = await supabase
        .from("actual_group_standings")
        .select("id, standings")
        .eq("group_name", group)
        .maybeSingle();

      const oldValue = existing?.standings;

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

      await logAuditEntry("group_standings", group, existing ? "updated" : "created", oldValue, standings);
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
    if (wkStatus === "locked") return;
    
    const currentStandings = groupStandings[group] || [];
    const newStandings = [...currentStandings];
    
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
      
      await logAuditEntry("wk_results", "wk_results", "points_calculated", null, { action: "calculate_winner_points" });
      
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
      
      await logAuditEntry("group_standings", "all", "points_calculated", null, { action: "calculate_group_points" });
      
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

  const isLocked = wkStatus === "locked";

  if (isLoadingWk || isLoadingGroups) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Workflow */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <StatusBadge status={wkStatus} />
              <span className="text-sm text-muted-foreground">Huidige status</span>
            </div>
            <StatusWorkflow currentStatus={wkStatus} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {wkStatus === "draft" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default" className="gap-2">
                    <Check className="w-4 h-4" />
                    Markeer als Definitief
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Resultaten definitief maken?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hiermee bevestig je dat de ingevulde resultaten correct zijn. Je kunt ze daarna nog steeds aanpassen, maar ze zijn gemarkeerd als gecontroleerd.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuleren</AlertDialogCancel>
                    <AlertDialogAction onClick={() => updateStatusMutation.mutate({ newStatus: "final" })}>
                      Bevestigen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            {wkStatus === "final" && (
              <>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => updateStatusMutation.mutate({ newStatus: "draft" })}
                >
                  <FileText className="w-4 h-4" />
                  Terug naar Concept
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Lock className="w-4 h-4" />
                      Vergrendel Resultaten
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Resultaten vergrendelen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Let op! Na vergrendeling kunnen de resultaten niet meer worden gewijzigd. Dit zorgt voor consistente puntenberekening. Alleen een super-admin kan dit ongedaan maken.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuleren</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => updateStatusMutation.mutate({ newStatus: "locked", notes: "Resultaten vergrendeld door admin" })}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Vergrendelen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            
            {wkStatus === "locked" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Unlock className="w-4 h-4" />
                    Ontgrendelen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Resultaten ontgrendelen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Weet je zeker dat je de resultaten wilt ontgrendelen? Dit kan leiden tot inconsistente puntenberekeningen als er al punten zijn toegekend.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuleren</AlertDialogCancel>
                    <AlertDialogAction onClick={() => updateStatusMutation.mutate({ newStatus: "final", notes: "Resultaten ontgrendeld door admin" })}>
                      Ontgrendelen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* WK Winner & Finalist */}
      <Card className={isLocked ? "opacity-75" : ""}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <CardTitle className="text-lg">WK Winnaar & Finalist</CardTitle>
              <CardDescription>Vul de officiële WK resultaten in voor puntenberekening</CardDescription>
            </div>
            {isLocked && <Lock className="w-4 h-4 text-muted-foreground ml-auto" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                WK Winnaar
              </Label>
              <Select 
                value={wkResults.winner} 
                onValueChange={(v) => setWkResults({ ...wkResults, winner: v })}
                disabled={isLocked}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer winnaar" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c.name} value={c.name}>
                      <div className="flex items-center gap-2">
                        <FlagImage teamName={c.name} size="sm" />
                        <span>{c.name}</span>
                      </div>
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
              <Select 
                value={wkResults.finalist} 
                onValueChange={(v) => setWkResults({ ...wkResults, finalist: v })}
                disabled={isLocked}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer finalist" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.filter(c => c.name !== wkResults.winner).map(c => (
                    <SelectItem key={c.name} value={c.name}>
                      <div className="flex items-center gap-2">
                        <FlagImage teamName={c.name} size="sm" />
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 pt-2">
            <Button 
              onClick={() => saveWkResultsMutation.mutate(wkResults)} 
              disabled={saveWkResultsMutation.isPending || !wkResults.winner || isLocked}
              className="gap-2"
            >
              {saveWkResultsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Opslaan
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="secondary"
                  disabled={isCalculating || !wkResults.winner}
                  className="gap-2"
                >
                  {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                  Bereken Punten
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Punten berekenen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hiermee worden de punten voor WK winnaar voorspellingen berekend en toegekend aan alle gebruikers. Dit overschrijft eventueel eerder berekende punten.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction onClick={calculateWinnerPoints}>
                    Bereken Punten
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Group Standings */}
      <Card className={isLocked ? "opacity-75" : ""}>
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
              {isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="secondary"
                  disabled={isCalculatingGroup}
                  className="gap-2"
                >
                  {isCalculatingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                  Bereken Alle Punten
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Groepspunten berekenen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hiermee worden de punten voor alle groepseindstand voorspellingen berekend. Dit overschrijft eventueel eerder berekende punten.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction onClick={calculateGroupPoints}>
                    Bereken Punten
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
                      disabled={saveGroupStandingMutation.isPending || !complete || isLocked}
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
                            disabled={isLocked}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={`${pos}e plaats`} />
                            </SelectTrigger>
                            <SelectContent>
                              {teams.map(t => (
                                <SelectItem key={t.name} value={t.name}>
                                  <div className="flex items-center gap-2">
                                    <FlagImage teamName={t.name} size="sm" />
                                    <span>{t.name}</span>
                                  </div>
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

      {/* Audit Log */}
      <Collapsible open={showAuditLog} onOpenChange={setShowAuditLog}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <History className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Wijzigingslogboek</CardTitle>
                    <CardDescription>Bekijk alle wijzigingen aan resultaten</CardDescription>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${showAuditLog ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {auditLogs && auditLogs.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {auditLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 text-sm">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <History className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {log.profiles?.display_name || log.profiles?.email || "Onbekend"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.action}
                          </Badge>
                          <span className="text-muted-foreground">
                            {log.entity_type === "wk_results" ? "WK Resultaten" : `Groep ${log.entity_id}`}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs mt-1">
                          {format(new Date(log.performed_at), "d MMM yyyy 'om' HH:mm", { locale: nl })}
                        </p>
                        {log.notes && (
                          <p className="text-muted-foreground text-xs mt-1 italic">{log.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Nog geen wijzigingen gelogd.</p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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