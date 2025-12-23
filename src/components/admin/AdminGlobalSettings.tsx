import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Trophy, Target, Timer, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ScoringRules {
  correct_score: number;
  correct_result: number;
  topscorer_correct: number;
  topscorer_in_top3: number;
  wk_winner_correct: number;
  wk_winner_finalist: number;
  extra_time_counts: boolean;
}

const defaultRules: ScoringRules = {
  correct_score: 5,
  correct_result: 2,
  topscorer_correct: 10,
  topscorer_in_top3: 3,
  wk_winner_correct: 15,
  wk_winner_finalist: 5,
  extra_time_counts: false,
};

const AdminGlobalSettings = () => {
  const queryClient = useQueryClient();
  const [rules, setRules] = useState<ScoringRules>(defaultRules);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["global-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_settings")
        .select("*")
        .eq("setting_key", "default_scoring_rules")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data?.setting_value as unknown as ScoringRules | null;
    },
  });

  useEffect(() => {
    if (settings) {
      setRules({ ...defaultRules, ...settings });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (newRules: ScoringRules) => {
      // First try to update existing record
      const { data: existing } = await supabase
        .from("global_settings")
        .select("id")
        .eq("setting_key", "default_scoring_rules")
        .single();

      if (existing) {
        const { error } = await supabase
          .from("global_settings")
          .update({ setting_value: JSON.parse(JSON.stringify(newRules)) })
          .eq("setting_key", "default_scoring_rules");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("global_settings")
          .insert([{ 
            setting_key: "default_scoring_rules", 
            setting_value: JSON.parse(JSON.stringify(newRules))
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-settings"] });
      toast.success("Instellingen opgeslagen");
    },
    onError: (error) => {
      toast.error("Fout bij opslaan: " + error.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate(rules);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Match Predictions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Wedstrijdvoorspellingen</CardTitle>
              <CardDescription>Punten voor wedstrijdvoorspellingen</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="correct_score">Exacte score (punten)</Label>
              <Input
                id="correct_score"
                type="number"
                min="0"
                value={rules.correct_score}
                onChange={(e) => setRules({ ...rules, correct_score: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Juiste eindstand voorspeld</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="correct_result">Correct resultaat (punten)</Label>
              <Input
                id="correct_result"
                type="number"
                min="0"
                value={rules.correct_result}
                onChange={(e) => setRules({ ...rules, correct_result: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Winnaar of gelijkspel correct</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Timer className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Verlenging telt mee</p>
                <p className="text-sm text-muted-foreground">
                  Inclusief verlenging (excl. penalty's)
                </p>
              </div>
            </div>
            <Switch
              checked={rules.extra_time_counts}
              onCheckedChange={(checked) => setRules({ ...rules, extra_time_counts: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Topscorer */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">Topscorer</CardTitle>
              <CardDescription>Punten voor topscorer voorspelling</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topscorer_correct">Exacte topscorer (punten)</Label>
              <Input
                id="topscorer_correct"
                type="number"
                min="0"
                value={rules.topscorer_correct}
                onChange={(e) => setRules({ ...rules, topscorer_correct: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Juiste topscorer voorspeld</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topscorer_in_top3">Speler in top 3 (punten)</Label>
              <Input
                id="topscorer_in_top3"
                type="number"
                min="0"
                value={rules.topscorer_in_top3}
                onChange={(e) => setRules({ ...rules, topscorer_in_top3: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Voorspelde speler in top 3</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WK Winner */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <CardTitle className="text-lg">WK Winnaar</CardTitle>
              <CardDescription>Punten voor WK winnaar voorspelling</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wk_winner_correct">Juiste winnaar (punten)</Label>
              <Input
                id="wk_winner_correct"
                type="number"
                min="0"
                value={rules.wk_winner_correct}
                onChange={(e) => setRules({ ...rules, wk_winner_correct: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Correct land als winnaar</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wk_winner_finalist">Land in finale (punten)</Label>
              <Input
                id="wk_winner_finalist"
                type="number"
                min="0"
                value={rules.wk_winner_finalist}
                onChange={(e) => setRules({ ...rules, wk_winner_finalist: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Gekozen land haalt finale</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="gap-2"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Instellingen Opslaan
        </Button>
      </div>
    </div>
  );
};

export default AdminGlobalSettings;
