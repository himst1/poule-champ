import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, GripVertical, Check, Loader2, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FlagImage } from "@/components/FlagImage";

interface GroupTeam {
  name: string;
  flag: string;
}

interface GroupData {
  name: string;
  teams: GroupTeam[];
}

interface GroupStandingsPredictionProps {
  pouleId: string;
}

// Extract unique teams per group from matches
const useGroupTeams = () => {
  return useQuery({
    queryKey: ["group-teams"],
    queryFn: async () => {
      const { data: matches, error } = await supabase
        .from("matches")
        .select("phase, home_team, away_team, home_flag, away_flag")
        .like("phase", "Groep%");

      if (error) throw error;

      const groupsMap: Record<string, Map<string, string>> = {};

      matches?.forEach((match) => {
        const groupName = match.phase?.replace("Groep ", "") || "";
        if (!groupsMap[groupName]) {
          groupsMap[groupName] = new Map();
        }
        if (match.home_team) {
          groupsMap[groupName].set(match.home_team, match.home_team);
        }
        if (match.away_team) {
          groupsMap[groupName].set(match.away_team, match.away_team);
        }
      });

      const groups: GroupData[] = Object.entries(groupsMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, teamsMap]) => ({
          name,
          teams: Array.from(teamsMap.entries()).map(([teamName, flag]) => ({
            name: teamName,
            flag,
          })),
        }));

      return groups;
    },
  });
};

// Draggable team item component
const DraggableTeam = ({
  team,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: {
  team: GroupTeam;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  isDragging: boolean;
}) => {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      className={`flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "opacity-50 scale-95" : "hover:bg-secondary"
      }`}
    >
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm">
        {index + 1}
      </div>
      <GripVertical className="w-4 h-4 text-muted-foreground" />
      <FlagImage teamName={team.name} size="sm" />
      <span className="font-medium flex-1 truncate">{team.name}</span>
    </div>
  );
};

// Single group prediction component
const GroupPrediction = ({
  group,
  pouleId,
  existingPrediction,
  onSave,
  isSaving,
}: {
  group: GroupData;
  pouleId: string;
  existingPrediction: string[] | null;
  onSave: (groupName: string, standings: string[]) => void;
  isSaving: boolean;
}) => {
  const [teams, setTeams] = useState<GroupTeam[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (existingPrediction && existingPrediction.length > 0) {
      // Reconstruct team order from saved prediction
      const orderedTeams = existingPrediction
        .map((teamName) => group.teams.find((t) => t.name === teamName))
        .filter((t): t is GroupTeam => t !== undefined);
      
      // Add any missing teams at the end
      const missingTeams = group.teams.filter(
        (t) => !existingPrediction.includes(t.name)
      );
      
      setTeams([...orderedTeams, ...missingTeams]);
    } else {
      setTeams([...group.teams]);
    }
    setHasChanges(false);
  }, [group, existingPrediction]);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) return;

    const newTeams = [...teams];
    const [draggedTeam] = newTeams.splice(dragIndex, 1);
    newTeams.splice(dropIndex, 0, draggedTeam);
    
    setTeams(newTeams);
    setDragIndex(null);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(group.name, teams.map((t) => t.name));
    setHasChanges(false);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {teams.map((team, index) => (
          <DraggableTeam
            key={team.name}
            team={team}
            index={index}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isDragging={dragIndex === index}
          />
        ))}
      </div>
      
      {hasChanges && (
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
          size="sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Opslaan
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export const GroupStandingsPrediction = ({ pouleId }: GroupStandingsPredictionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [savingGroup, setSavingGroup] = useState<string | null>(null);

  const { data: groups, isLoading: groupsLoading } = useGroupTeams();

  // Fetch existing predictions
  const { data: existingPredictions } = useQuery({
    queryKey: ["group-predictions", pouleId, user?.id],
    queryFn: async () => {
      if (!user?.id) return {};

      const { data, error } = await supabase
        .from("group_standings_predictions")
        .select("group_name, predicted_standings")
        .eq("poule_id", pouleId)
        .eq("user_id", user.id);

      if (error) throw error;

      const predictionsMap: Record<string, string[]> = {};
      data?.forEach((p) => {
        predictionsMap[p.group_name] = p.predicted_standings as string[];
      });

      return predictionsMap;
    },
    enabled: !!user?.id && !!pouleId,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ groupName, standings }: { groupName: string; standings: string[] }) => {
      if (!user?.id) throw new Error("Niet ingelogd");

      const { data: existing } = await supabase
        .from("group_standings_predictions")
        .select("id")
        .eq("poule_id", pouleId)
        .eq("user_id", user.id)
        .eq("group_name", groupName)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("group_standings_predictions")
          .update({ predicted_standings: standings, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("group_standings_predictions")
          .insert({
            poule_id: pouleId,
            user_id: user.id,
            group_name: groupName,
            predicted_standings: standings,
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["group-predictions", pouleId, user?.id] });
      toast({
        title: "Opgeslagen!",
        description: `Groep ${variables.groupName} voorspelling opgeslagen`,
      });
      setSavingGroup(null);
    },
    onError: (error) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
      setSavingGroup(null);
    },
  });

  const handleSave = useCallback((groupName: string, standings: string[]) => {
    setSavingGroup(groupName);
    saveMutation.mutate({ groupName, standings });
  }, [saveMutation]);

  const toggleGroup = (groupName: string) => {
    const newOpen = new Set(openGroups);
    if (newOpen.has(groupName)) {
      newOpen.delete(groupName);
    } else {
      newOpen.add(groupName);
    }
    setOpenGroups(newOpen);
  };

  const completedCount = Object.keys(existingPredictions || {}).length;
  const totalGroups = groups?.length || 0;

  if (groupsLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Groepen laden...</span>
        </div>
      </Card>
    );
  }

  if (!groups || groups.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Groepseindstand Voorspellen</h3>
              <p className="text-sm text-muted-foreground">
                Sleep de teams naar de juiste positie
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-display font-bold text-primary">
              {completedCount}/{totalGroups}
            </div>
            <p className="text-xs text-muted-foreground">groepen ingevuld</p>
          </div>
        </div>

        {/* Points info */}
        <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-secondary/50 text-sm">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="text-muted-foreground">
            <span className="font-medium text-foreground">Punten:</span> 3 punten per correcte positie, 
            +10 bonus als alle 4 posities correct zijn
          </div>
        </div>
      </div>

      <div className="divide-y divide-border">
        {groups.map((group) => (
          <Collapsible
            key={group.name}
            open={openGroups.has(group.name)}
            onOpenChange={() => toggleGroup(group.name)}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-display font-bold text-primary">
                    {group.name}
                  </div>
                  <span className="font-medium">Groep {group.name}</span>
                  <div className="flex -space-x-1">
                    {group.teams.slice(0, 4).map((team) => (
                      <FlagImage key={team.name} teamName={team.name} size="xs" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {existingPredictions?.[group.name] && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs">
                      <Check className="w-3 h-3" />
                      <span>Ingevuld</span>
                    </div>
                  )}
                  {openGroups.has(group.name) ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0">
                <GroupPrediction
                  group={group}
                  pouleId={pouleId}
                  existingPrediction={existingPredictions?.[group.name] || null}
                  onSave={handleSave}
                  isSaving={savingGroup === group.name}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </Card>
  );
};

export default GroupStandingsPrediction;
