import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Check, Loader2, Calculator } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { FlagImage } from "@/components/FlagImage";

type Match = {
  id: string;
  home_team: string;
  away_team: string;
  home_flag: string | null;
  away_flag: string | null;
  home_score: number | null;
  away_score: number | null;
  kickoff_time: string;
  phase: string | null;
  status: "pending" | "live" | "finished";
};

const AdminMatchesTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: matches, isLoading } = useQuery({
    queryKey: ["admin-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("kickoff_time", { ascending: true });

      if (error) throw error;
      return data as Match[];
    },
  });

  const calculatePoints = async () => {
    setIsCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-points");

      if (error) throw error;

      toast({
        title: "Punten berekend!",
        description: `${data.updated} voorspellingen bijgewerkt`,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      queryClient.invalidateQueries({ queryKey: ["poule-members"] });
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
    } catch (error: any) {
      toast({
        title: "Fout bij berekenen",
        description: error.message || "Probeer het opnieuw",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const finishedCount = matches?.filter((m) => m.status === "finished").length || 0;
  const pendingCount = matches?.filter((m) => m.status === "pending").length || 0;

  return (
    <div className="space-y-6">
      {/* Stats & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-bold">{finishedCount}</p>
            <p className="text-sm text-muted-foreground">Afgelopen</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">Gepland</p>
          </div>
        </div>
        <Button onClick={calculatePoints} disabled={isCalculating} className="gap-2">
          {isCalculating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Calculator className="w-4 h-4" />
          )}
          Bereken Punten
        </Button>
      </div>

      {/* Scoring Rules */}
      <Card className="p-4">
        <div className="flex gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="font-bold text-primary">5</span>
            </div>
            <div>
              <p className="font-medium">Exacte score</p>
              <p className="text-sm text-muted-foreground">Juiste eindstand</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="font-bold text-accent">2</span>
            </div>
            <div>
              <p className="font-medium">Correcte uitslag</p>
              <p className="text-sm text-muted-foreground">Winnaar of gelijkspel</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Matches List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          </div>
        ) : (
          matches?.map((match) => <MatchScoreCard key={match.id} match={match} />)
        )}
      </div>
    </div>
  );
};

const MatchScoreCard = ({ match }: { match: Match }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [homeScore, setHomeScore] = useState(match.home_score?.toString() || "");
  const [awayScore, setAwayScore] = useState(match.away_score?.toString() || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveScore = async (finish: boolean) => {
    if (homeScore === "" || awayScore === "") return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("matches")
        .update({
          home_score: parseInt(homeScore),
          away_score: parseInt(awayScore),
          status: finish ? "finished" : match.status,
        })
        .eq("id", match.id);

      if (error) throw error;

      toast({
        title: finish ? "Wedstrijd afgerond!" : "Score opgeslagen",
        description: `${match.home_team} ${homeScore} - ${awayScore} ${match.away_team}`,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={`p-4 ${match.status === "finished" ? "border-l-4 border-l-primary" : ""}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                match.status === "finished"
                  ? "bg-primary/20 text-primary"
                  : match.status === "live"
                  ? "bg-destructive/20 text-destructive"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {match.status === "finished" ? "Afgelopen" : match.status === "live" ? "Live" : "Gepland"}
            </span>
            <span className="text-sm text-muted-foreground">{match.phase}</span>
            <span className="text-sm text-muted-foreground">
              {format(parseISO(match.kickoff_time), "d MMM HH:mm", { locale: nl })}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FlagImage teamName={match.home_team} size="sm" />
              <span className="font-medium">{match.home_team}</span>
            </div>

            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-14 text-center"
                />
                <span>-</span>
                <Input
                  type="number"
                  min="0"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-14 text-center"
                />
              </div>
            ) : (
              <div className="px-3 py-1 rounded bg-secondary">
                <span className="font-bold">
                  {match.home_score ?? "-"} - {match.away_score ?? "-"}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="font-medium">{match.away_team}</span>
              <FlagImage teamName={match.away_team} size="sm" />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Annuleren
              </Button>
              <Button size="sm" variant="outline" onClick={() => saveScore(false)} disabled={isSaving}>
                Opslaan
              </Button>
              <Button size="sm" onClick={() => saveScore(true)} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Afronden
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              Score invoeren
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AdminMatchesTab;
