import { AlertTriangle, Clock, Lock } from "lucide-react";
import { differenceInMinutes, differenceInHours, parseISO, isBefore } from "date-fns";

interface DeadlineWarningProps {
  kickoffTime: string;
  className?: string;
}

export const DeadlineWarning = ({ kickoffTime, className = "" }: DeadlineWarningProps) => {
  const kickoffDate = parseISO(kickoffTime);
  const now = new Date();
  
  // If match has already started
  if (!isBefore(now, kickoffDate)) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/20 text-destructive text-sm ${className}`}>
        <Lock className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">Voorspelling gesloten - wedstrijd is begonnen</span>
      </div>
    );
  }

  const minutesUntilKickoff = differenceInMinutes(kickoffDate, now);
  const hoursUntilKickoff = differenceInHours(kickoffDate, now);

  // Less than 30 minutes - urgent warning
  if (minutesUntilKickoff <= 30) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/20 text-destructive text-sm animate-pulse ${className}`}>
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">
          Nog {minutesUntilKickoff} minuten om te voorspellen!
        </span>
      </div>
    );
  }

  // Less than 2 hours - warning
  if (hoursUntilKickoff < 2) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/20 text-accent text-sm ${className}`}>
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">
          Nog {hoursUntilKickoff > 0 ? `${hoursUntilKickoff}u ${minutesUntilKickoff % 60}m` : `${minutesUntilKickoff}m`} tot deadline
        </span>
      </div>
    );
  }

  // Less than 24 hours - info
  if (hoursUntilKickoff < 24) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-muted-foreground text-sm ${className}`}>
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span>
          Deadline over {hoursUntilKickoff} uur
        </span>
      </div>
    );
  }

  return null;
};

interface MatchDeadlineBadgeProps {
  kickoffTime: string;
  size?: "sm" | "md";
}

export const MatchDeadlineBadge = ({ kickoffTime, size = "sm" }: MatchDeadlineBadgeProps) => {
  const kickoffDate = parseISO(kickoffTime);
  const now = new Date();
  
  // If match has already started
  if (!isBefore(now, kickoffDate)) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded bg-destructive/20 text-destructive font-medium ${
        size === "sm" ? "text-[10px]" : "text-xs"
      }`}>
        <Lock className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        Gesloten
      </span>
    );
  }

  const minutesUntilKickoff = differenceInMinutes(kickoffDate, now);

  // Less than 30 minutes - urgent
  if (minutesUntilKickoff <= 30) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded bg-destructive/20 text-destructive font-bold animate-pulse ${
        size === "sm" ? "text-[10px]" : "text-xs"
      }`}>
        <AlertTriangle className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        {minutesUntilKickoff}m
      </span>
    );
  }

  // Less than 2 hours
  if (minutesUntilKickoff < 120) {
    const hours = Math.floor(minutesUntilKickoff / 60);
    const mins = minutesUntilKickoff % 60;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/20 text-accent font-medium ${
        size === "sm" ? "text-[10px]" : "text-xs"
      }`}>
        <Clock className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        {hours > 0 ? `${hours}u ${mins}m` : `${mins}m`}
      </span>
    );
  }

  return null;
};
