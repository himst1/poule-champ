import { useMemo } from "react";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO, differenceInHours, isBefore, addMinutes } from "date-fns";
import { nl } from "date-fns/locale";

type Match = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_time: string;
  status: "pending" | "live" | "finished";
};

type Prediction = {
  id: string;
  match_id: string;
};

interface DeadlineNotificationBannerProps {
  matches: Match[];
  predictions: Prediction[];
  onNavigateToMatches: () => void;
}

export const DeadlineNotificationBanner = ({
  matches,
  predictions,
  onNavigateToMatches,
}: DeadlineNotificationBannerProps) => {
  const urgentMatches = useMemo(() => {
    const now = new Date();
    const predictedMatchIds = new Set(predictions.map(p => p.match_id));

    return matches.filter(match => {
      // Only pending matches without predictions
      if (match.status !== "pending" || predictedMatchIds.has(match.id)) {
        return false;
      }

      const kickoff = parseISO(match.kickoff_time);
      const deadline = addMinutes(kickoff, -5);

      // Check if deadline is still in the future and within 24 hours
      if (!isBefore(now, deadline)) {
        return false;
      }

      const hoursUntilDeadline = differenceInHours(deadline, now);
      return hoursUntilDeadline <= 24;
    }).sort((a, b) => 
      parseISO(a.kickoff_time).getTime() - parseISO(b.kickoff_time).getTime()
    );
  }, [matches, predictions]);

  if (urgentMatches.length === 0) {
    return null;
  }

  const mostUrgent = urgentMatches[0];
  const mostUrgentKickoff = parseISO(mostUrgent.kickoff_time);
  const hoursLeft = differenceInHours(addMinutes(mostUrgentKickoff, -5), new Date());

  const isVeryUrgent = hoursLeft <= 2;
  const isUrgent = hoursLeft <= 6;

  return (
    <Card className={`mb-6 border ${
      isVeryUrgent 
        ? "border-destructive/50 bg-destructive/10 animate-pulse" 
        : isUrgent 
        ? "border-amber-500/50 bg-amber-500/10" 
        : "border-primary/50 bg-primary/10"
    }`}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${
            isVeryUrgent 
              ? "bg-destructive/20" 
              : isUrgent 
              ? "bg-amber-500/20" 
              : "bg-primary/20"
          }`}>
            {isVeryUrgent ? (
              <AlertTriangle className="w-5 h-5 text-destructive" />
            ) : (
              <Clock className={`w-5 h-5 ${isUrgent ? "text-amber-500" : "text-primary"}`} />
            )}
          </div>
          <div className="flex-1">
            <p className={`font-semibold ${
              isVeryUrgent 
                ? "text-destructive" 
                : isUrgent 
                ? "text-amber-600 dark:text-amber-400" 
                : "text-primary"
            }`}>
              {urgentMatches.length === 1 
                ? "1 wedstrijd wacht op je voorspelling!"
                : `${urgentMatches.length} wedstrijden wachten op je voorspelling!`
              }
            </p>
            <div className="mt-1 space-y-1">
              {urgentMatches.slice(0, 3).map(match => {
                const kickoff = parseISO(match.kickoff_time);
                const hoursUntil = differenceInHours(addMinutes(kickoff, -5), new Date());
                
                return (
                  <p key={match.id} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="font-medium">{match.home_team} - {match.away_team}</span>
                    <span className="text-xs opacity-70">
                      • {format(kickoff, "EEE d MMM HH:mm", { locale: nl })}
                      {hoursUntil <= 2 && (
                        <span className="ml-1 text-destructive font-semibold">(nog {hoursUntil}u!)</span>
                      )}
                    </span>
                  </p>
                );
              })}
              {urgentMatches.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  en nog {urgentMatches.length - 3} andere wedstrijd{urgentMatches.length - 3 > 1 ? 'en' : ''}...
                </p>
              )}
            </div>
            <Button 
              size="sm" 
              variant={isVeryUrgent ? "destructive" : "outline"} 
              onClick={onNavigateToMatches}
              className="mt-3 gap-2"
            >
              Vul nu in
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
