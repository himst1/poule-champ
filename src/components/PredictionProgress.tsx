import { Target, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const PredictionProgress = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch total matches count
  const { data: totalMatches } = useQuery({
    queryKey: ["total-matches-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  // Fetch user's first poule and prediction count
  const { data: progressData } = useQuery({
    queryKey: ["prediction-progress", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get user's first poule
      const { data: membership } = await supabase
        .from("poule_members")
        .select("poule_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!membership) return { predictions: 0, pouleId: null };

      // Count predictions for this poule
      const { count } = await supabase
        .from("predictions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("poule_id", membership.poule_id);

      return { predictions: count || 0, pouleId: membership.poule_id };
    },
    enabled: !!user,
  });

  if (!user || !progressData?.pouleId) return null;

  const predictions = progressData.predictions;
  const total = totalMatches || 104;
  const remaining = Math.max(0, total - predictions);
  const percentage = Math.round((predictions / total) * 100);
  const isComplete = remaining === 0;

  const handleClick = () => {
    if (progressData.pouleId) {
      navigate(`/poule/${progressData.pouleId}`);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
              isComplete
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-secondary/80 border-border hover:bg-secondary hover:border-primary/30"
            )}
          >
            <div className="relative">
              <Target className="w-4 h-4" />
              {!isComplete && remaining <= 10 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
              )}
            </div>
            
            {/* Mini progress bar */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    isComplete
                      ? "bg-primary"
                      : percentage >= 75
                      ? "bg-primary"
                      : percentage >= 50
                      ? "bg-accent"
                      : "bg-muted-foreground"
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs font-medium tabular-nums">
                {predictions}/{total}
              </span>
            </div>

            {/* Mobile: just show count */}
            <span className="sm:hidden text-xs font-medium tabular-nums">
              {remaining > 0 ? remaining : "✓"}
            </span>

            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-center">
          <p className="font-medium">
            {isComplete
              ? "Alle voorspellingen ingevuld! 🎉"
              : `Nog ${remaining} voorspelling${remaining === 1 ? "" : "en"} te gaan`}
          </p>
          <p className="text-xs text-muted-foreground">
            {predictions} van {total} wedstrijden voorspeld
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
