import { useState } from "react";
import { Settings, Users, Lock, Unlock, Trash2, Loader2, AlertTriangle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ScoringRules {
  correct_score: number;
  correct_result: number;
  topscorer_correct?: number;
  topscorer_in_top3?: number;
}

interface PouleManagementProps {
  pouleId: string;
  pouleName: string;
  status: "open" | "closed" | "finished";
  scoringRules: ScoringRules | null;
  isCreator: boolean;
  members: Array<{
    id: string;
    user_id: string;
    points: number;
    rank: number | null;
    profiles: {
      display_name: string | null;
      email: string | null;
    };
  }>;
  currentUserId?: string;
}

export const PouleManagement = ({
  pouleId,
  pouleName,
  status,
  scoringRules,
  isCreator,
  members,
  currentUserId,
}: PouleManagementProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [exactScorePoints, setExactScorePoints] = useState(
    scoringRules?.correct_score?.toString() || "5"
  );
  const [correctResultPoints, setCorrectResultPoints] = useState(
    scoringRules?.correct_result?.toString() || "2"
  );
  const [topscorerCorrectPoints, setTopscorerCorrectPoints] = useState(
    scoringRules?.topscorer_correct?.toString() || "10"
  );
  const [topscorerTop3Points, setTopscorerTop3Points] = useState(
    scoringRules?.topscorer_in_top3?.toString() || "3"
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleStatusToggle = async () => {
    setIsUpdating(true);
    try {
      const newStatus = status === "open" ? "closed" : "open";
      const { error } = await supabase
        .from("poules")
        .update({ status: newStatus })
        .eq("id", pouleId);

      if (error) throw error;

      toast({
        title: newStatus === "open" ? "Poule geopend" : "Poule gesloten",
        description: newStatus === "open" 
          ? "Nieuwe deelnemers kunnen nu toetreden" 
          : "Geen nieuwe deelnemers meer toegestaan",
      });

      queryClient.invalidateQueries({ queryKey: ["poule", pouleId] });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Kon status niet wijzigen",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveScoringRules = async () => {
    setIsUpdating(true);
    try {
      const exactScore = parseInt(exactScorePoints);
      const correctResult = parseInt(correctResultPoints);
      const topscorerCorrect = parseInt(topscorerCorrectPoints);
      const topscorerTop3 = parseInt(topscorerTop3Points);

      if (isNaN(exactScore) || isNaN(correctResult) || exactScore < 0 || correctResult < 0) {
        throw new Error("Voer geldige punten in voor wedstrijdvoorspellingen");
      }

      if (isNaN(topscorerCorrect) || isNaN(topscorerTop3) || topscorerCorrect < 0 || topscorerTop3 < 0) {
        throw new Error("Voer geldige punten in voor topscorer");
      }

      if (exactScore <= correctResult) {
        throw new Error("Exacte score moet meer punten opleveren dan correct resultaat");
      }

      if (topscorerCorrect <= topscorerTop3) {
        throw new Error("Exacte topscorer moet meer punten opleveren dan top 3");
      }

      const { error } = await supabase
        .from("poules")
        .update({
          scoring_rules: {
            correct_score: exactScore,
            correct_result: correctResult,
            topscorer_correct: topscorerCorrect,
            topscorer_in_top3: topscorerTop3,
          },
        })
        .eq("id", pouleId);

      if (error) throw error;

      toast({
        title: "Puntensysteem opgeslagen",
        description: `Wedstrijden: ${exactScore}/${correctResult} pts • Topscorer: ${topscorerCorrect}/${topscorerTop3} pts`,
      });

      queryClient.invalidateQueries({ queryKey: ["poule", pouleId] });
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Kon puntensysteem niet opslaan",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    try {
      const { error } = await supabase
        .from("poule_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Deelnemer verwijderd",
        description: `${memberName} is uit de poule verwijderd`,
      });

      queryClient.invalidateQueries({ queryKey: ["poule-members", pouleId] });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Kon deelnemer niet verwijderen",
        variant: "destructive",
      });
    }
  };

  if (!isCreator) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Beheer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Poule Beheer</DialogTitle>
          <DialogDescription>
            Beheer instellingen voor {pouleName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Toggle */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {status === "open" ? (
                  <Unlock className="w-5 h-5 text-primary" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <h3 className="font-medium">Poule Status</h3>
                  <p className="text-sm text-muted-foreground">
                    {status === "open" 
                      ? "Open voor nieuwe deelnemers" 
                      : "Gesloten voor nieuwe deelnemers"}
                  </p>
                </div>
              </div>
              <Switch
                checked={status === "open"}
                onCheckedChange={handleStatusToggle}
                disabled={isUpdating || status === "finished"}
              />
            </div>
          </Card>

          {/* Scoring Rules */}
          <Card className="p-4">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Puntensysteem - Wedstrijden
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exact-score">Exacte score</Label>
                <Input
                  id="exact-score"
                  type="number"
                  min="0"
                  value={exactScorePoints}
                  onChange={(e) => setExactScorePoints(e.target.value)}
                  placeholder="5"
                />
                <p className="text-xs text-muted-foreground">
                  Punten voor juiste eindstand
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="correct-result">Correct resultaat</Label>
                <Input
                  id="correct-result"
                  type="number"
                  min="0"
                  value={correctResultPoints}
                  onChange={(e) => setCorrectResultPoints(e.target.value)}
                  placeholder="2"
                />
                <p className="text-xs text-muted-foreground">
                  Punten voor juiste winnaar/gelijkspel
                </p>
              </div>
            </div>
          </Card>

          {/* Topscorer Scoring Rules */}
          <Card className="p-4">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Puntensysteem - Topscorer
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="topscorer-correct">Exacte topscorer</Label>
                <Input
                  id="topscorer-correct"
                  type="number"
                  min="0"
                  value={topscorerCorrectPoints}
                  onChange={(e) => setTopscorerCorrectPoints(e.target.value)}
                  placeholder="10"
                />
                <p className="text-xs text-muted-foreground">
                  Punten voor juiste topscorer
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topscorer-top3">In top 3 scorers</Label>
                <Input
                  id="topscorer-top3"
                  type="number"
                  min="0"
                  value={topscorerTop3Points}
                  onChange={(e) => setTopscorerTop3Points(e.target.value)}
                  placeholder="3"
                />
                <p className="text-xs text-muted-foreground">
                  Punten als gekozen speler in top 3 eindigt
                </p>
              </div>
            </div>
            <Button
              className="mt-4"
              onClick={handleSaveScoringRules}
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Opslaan
            </Button>
          </Card>

          {/* Members List */}
          <Card className="p-4">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Deelnemers ({members.length})
            </h3>
            <div className="divide-y divide-border max-h-60 overflow-y-auto">
              {members.map((member) => {
                const displayName = member.profiles?.display_name || 
                  member.profiles?.email?.split("@")[0] || 
                  "Onbekend";
                const isCurrentUser = member.user_id === currentUserId;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                        {member.rank || "-"}
                      </div>
                      <div>
                        <p className="font-medium">
                          {displayName}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-primary">(jij)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.points} punten
                        </p>
                      </div>
                    </div>
                    {!isCurrentUser && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Deelnemer verwijderen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Weet je zeker dat je {displayName} uit de poule wilt verwijderen? 
                              Alle voorspellingen van deze deelnemer worden ook verwijderd.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleren</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveMember(member.id, displayName)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Verwijderen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Tie-breaking Rules Info */}
          <Card className="p-4 bg-secondary/30">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-accent" />
              Tie-breaking regels
            </h3>
            <p className="text-sm text-muted-foreground">
              Bij gelijke stand wordt de ranking bepaald door:
            </p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside mt-2 space-y-1">
              <li>Totaal aantal punten</li>
              <li>Aantal exacte scores</li>
              <li>Aantal correcte resultaten</li>
              <li>Alfabetische volgorde</li>
            </ol>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Sluiten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
