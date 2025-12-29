import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Check, Loader2, Calculator, Pencil, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { FlagImage } from "@/components/FlagImage";
import { ALL_COUNTRIES } from "@/lib/flags";

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
  stadium: string | null;
  city: string | null;
  is_knockout: boolean;
  penalty_winner: string | null;
  status: "pending" | "live" | "finished";
};

const PHASES = [
  "Groep A",
  "Groep B",
  "Groep C",
  "Groep D",
  "Groep E",
  "Groep F",
  "Groep G",
  "Groep H",
  "Groep I",
  "Groep J",
  "Groep K",
  "Groep L",
  "Achtste finale",
  "Kwartfinale",
  "Halve finale",
  "Troostfinale",
  "Finale",
];

const AdminMatchesTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCalculating, setIsCalculating] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nieuwe wedstrijd
          </Button>
          <Button onClick={calculatePoints} disabled={isCalculating} className="gap-2">
            {isCalculating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            Bereken Punten
          </Button>
        </div>
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
          matches?.map((match) => (
            <MatchScoreCard 
              key={match.id} 
              match={match} 
              onEdit={() => setEditingMatch(match)}
            />
          ))
        )}
      </div>

      {/* Edit Match Dialog */}
      <MatchEditDialog
        match={editingMatch}
        open={!!editingMatch}
        onClose={() => setEditingMatch(null)}
      />

      {/* Create Match Dialog */}
      <MatchEditDialog
        match={null}
        open={isCreating}
        onClose={() => setIsCreating(false)}
        isNew
      />
    </div>
  );
};

const MatchScoreCard = ({ match, onEdit }: { match: Match; onEdit: () => void }) => {
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
            {match.stadium && (
              <span className="text-sm text-muted-foreground hidden md:inline">
                • {match.stadium}
              </span>
            )}
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
            <>
              <Button size="sm" variant="ghost" onClick={onEdit}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                Score invoeren
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

interface MatchEditDialogProps {
  match: Match | null;
  open: boolean;
  onClose: () => void;
  isNew?: boolean;
}

const MatchEditDialog = ({ match, open, onClose, isNew }: MatchEditDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    home_team: "",
    away_team: "",
    kickoff_time: "",
    phase: "",
    stadium: "",
    city: "",
    is_knockout: false,
    status: "pending" as "pending" | "live" | "finished",
    home_score: "",
    away_score: "",
    penalty_winner: "",
  });

  // Update form when match changes
  useState(() => {
    if (match) {
      setFormData({
        home_team: match.home_team,
        away_team: match.away_team,
        kickoff_time: match.kickoff_time.slice(0, 16), // Format for datetime-local
        phase: match.phase || "",
        stadium: match.stadium || "",
        city: match.city || "",
        is_knockout: match.is_knockout,
        status: match.status,
        home_score: match.home_score?.toString() || "",
        away_score: match.away_score?.toString() || "",
        penalty_winner: match.penalty_winner || "",
      });
    } else {
      setFormData({
        home_team: "",
        away_team: "",
        kickoff_time: "",
        phase: "",
        stadium: "",
        city: "",
        is_knockout: false,
        status: "pending",
        home_score: "",
        away_score: "",
        penalty_winner: "",
      });
    }
  });

  // Reset form when dialog opens/closes or match changes
  const resetForm = () => {
    if (match) {
      const kickoffDate = new Date(match.kickoff_time);
      const localKickoff = new Date(kickoffDate.getTime() - kickoffDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      
      setFormData({
        home_team: match.home_team,
        away_team: match.away_team,
        kickoff_time: localKickoff,
        phase: match.phase || "",
        stadium: match.stadium || "",
        city: match.city || "",
        is_knockout: match.is_knockout,
        status: match.status,
        home_score: match.home_score?.toString() || "",
        away_score: match.away_score?.toString() || "",
        penalty_winner: match.penalty_winner || "",
      });
    } else {
      setFormData({
        home_team: "",
        away_team: "",
        kickoff_time: "",
        phase: "",
        stadium: "",
        city: "",
        is_knockout: false,
        status: "pending",
        home_score: "",
        away_score: "",
        penalty_winner: "",
      });
    }
  };

  // Reset form when dialog opens
  if (open && match && formData.home_team !== match.home_team) {
    resetForm();
  }

  const handleSave = async () => {
    if (!formData.home_team || !formData.away_team || !formData.kickoff_time) {
      toast({
        title: "Vul verplichte velden in",
        description: "Thuisteam, uitteam en aftrap zijn verplicht",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        home_team: formData.home_team,
        away_team: formData.away_team,
        kickoff_time: new Date(formData.kickoff_time).toISOString(),
        phase: formData.phase || null,
        stadium: formData.stadium || null,
        city: formData.city || null,
        is_knockout: formData.is_knockout,
        status: formData.status,
        home_score: formData.home_score ? parseInt(formData.home_score) : null,
        away_score: formData.away_score ? parseInt(formData.away_score) : null,
        penalty_winner: formData.penalty_winner || null,
      };

      if (isNew) {
        const { error } = await supabase.from("matches").insert(updateData);
        if (error) throw error;
        toast({ title: "Wedstrijd aangemaakt!" });
      } else if (match) {
        const { error } = await supabase
          .from("matches")
          .update(updateData)
          .eq("id", match.id);
        if (error) throw error;
        toast({ title: "Wedstrijd bijgewerkt!" });
      }

      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      onClose();
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

  const handleDelete = async () => {
    if (!match) return;
    
    if (!confirm(`Weet je zeker dat je ${match.home_team} - ${match.away_team} wilt verwijderen?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("matches")
        .delete()
        .eq("id", match.id);

      if (error) throw error;

      toast({ title: "Wedstrijd verwijderd!" });
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      onClose();
    } catch (error: any) {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Nieuwe wedstrijd" : "Wedstrijd bewerken"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Home Team */}
          <div className="space-y-2">
            <Label>Thuisteam *</Label>
            <Select
              value={formData.home_team}
              onValueChange={(v) => setFormData({ ...formData, home_team: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer land" />
              </SelectTrigger>
              <SelectContent>
                {ALL_COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    <div className="flex items-center gap-2">
                      <FlagImage teamName={country} size="xs" />
                      {country}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Away Team */}
          <div className="space-y-2">
            <Label>Uitteam *</Label>
            <Select
              value={formData.away_team}
              onValueChange={(v) => setFormData({ ...formData, away_team: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer land" />
              </SelectTrigger>
              <SelectContent>
                {ALL_COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    <div className="flex items-center gap-2">
                      <FlagImage teamName={country} size="xs" />
                      {country}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kickoff Time */}
          <div className="space-y-2">
            <Label>Aftrap *</Label>
            <Input
              type="datetime-local"
              value={formData.kickoff_time}
              onChange={(e) => setFormData({ ...formData, kickoff_time: e.target.value })}
            />
          </div>

          {/* Phase */}
          <div className="space-y-2">
            <Label>Fase</Label>
            <Select
              value={formData.phase}
              onValueChange={(v) => setFormData({ ...formData, phase: v, is_knockout: !v.startsWith("Groep") })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer fase" />
              </SelectTrigger>
              <SelectContent>
                {PHASES.map((phase) => (
                  <SelectItem key={phase} value={phase}>
                    {phase}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stadium */}
          <div className="space-y-2">
            <Label>Stadion</Label>
            <Input
              value={formData.stadium}
              onChange={(e) => setFormData({ ...formData, stadium: e.target.value })}
              placeholder="b.v. MetLife Stadium"
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label>Stad</Label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="b.v. New York"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Gepland</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="finished">Afgelopen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Knockout checkbox */}
          <div className="space-y-2 flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_knockout}
                onChange={(e) => setFormData({ ...formData, is_knockout: e.target.checked })}
                className="w-4 h-4"
              />
              <span>Knockout wedstrijd</span>
            </label>
          </div>

          {/* Scores */}
          <div className="space-y-2">
            <Label>Thuisscore</Label>
            <Input
              type="number"
              min="0"
              value={formData.home_score}
              onChange={(e) => setFormData({ ...formData, home_score: e.target.value })}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Uitscore</Label>
            <Input
              type="number"
              min="0"
              value={formData.away_score}
              onChange={(e) => setFormData({ ...formData, away_score: e.target.value })}
              placeholder="0"
            />
          </div>

          {/* Penalty Winner (only for knockout) */}
          {formData.is_knockout && formData.home_score === formData.away_score && (
            <div className="space-y-2 md:col-span-2">
              <Label>Penalty winnaar</Label>
              <Select
                value={formData.penalty_winner}
                onValueChange={(v) => setFormData({ ...formData, penalty_winner: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer winnaar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={formData.home_team || "home"}>
                    {formData.home_team || "Thuisteam"}
                  </SelectItem>
                  <SelectItem value={formData.away_team || "away"}>
                    {formData.away_team || "Uitteam"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {!isNew && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Verwijderen
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isNew ? "Aanmaken" : "Opslaan"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminMatchesTab;
