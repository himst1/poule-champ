import { useState, useEffect, useCallback } from "react";
import { Trophy, Crown, Medal, TrendingUp, TrendingDown, Minus, Sparkles, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  points: number;
  rank: number | null;
  display_name: string | null;
  avatar_url: string | null;
  previousRank?: number | null;
}

interface LiveLeaderboardProps {
  pouleId: string;
  currentUserId?: string;
  className?: string;
}

// Confetti celebration function
const triggerConfetti = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    // Confetti from both sides
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#FFD700', '#FFA500', '#FF6B00', '#FFFFFF', '#FFE4B5'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#FFD700', '#FFA500', '#FF6B00', '#FFFFFF', '#FFE4B5'],
    });
  }, 250);

  // Big burst in the center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0.5, y: 0.5 },
    colors: ['#FFD700', '#FFA500', '#FF6B00'],
    zIndex: 9999,
  });
};

const LiveLeaderboard = ({ pouleId, currentUserId, className }: LiveLeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [previousEntries, setPreviousEntries] = useState<Map<string, LeaderboardEntry>>(new Map());
  const [showCelebration, setShowCelebration] = useState(false);

  // Check if current user became first place
  const checkForFirstPlaceCelebration = useCallback((
    newEntries: LeaderboardEntry[],
    prevEntriesMap: Map<string, LeaderboardEntry>
  ) => {
    if (!currentUserId) return;

    const currentUserEntry = newEntries.find(e => e.user_id === currentUserId);
    const previousUserEntry = prevEntriesMap.get(currentUserId);

    // User is now rank 1 but wasn't before
    if (
      currentUserEntry?.rank === 1 && 
      previousUserEntry && 
      previousUserEntry.rank !== 1 &&
      previousUserEntry.rank !== null
    ) {
      console.log("🎉 User reached first place! Triggering celebration!");
      setShowCelebration(true);
      triggerConfetti();
      
      // Hide celebration overlay after animation
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [currentUserId]);

  // Fetch initial data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from("poule_members")
        .select(`
          id,
          user_id,
          points,
          rank,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq("poule_id", pouleId)
        .order("rank", { ascending: true, nullsFirst: false })
        .order("points", { ascending: false });

      if (!error && data) {
        const mapped = data.map((entry) => ({
          id: entry.id,
          user_id: entry.user_id,
          points: entry.points,
          rank: entry.rank,
          display_name: (entry.profiles as any)?.display_name || "Speler",
          avatar_url: (entry.profiles as any)?.avatar_url,
        }));
        setEntries(mapped);
        setPreviousEntries(new Map(mapped.map(e => [e.user_id, e])));
      }
      setIsLoading(false);
    };

    fetchLeaderboard();
  }, [pouleId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`leaderboard-${pouleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "poule_members",
          filter: `poule_id=eq.${pouleId}`,
        },
        async (payload) => {
          console.log("Realtime update received:", payload);
          
          // Refetch the full leaderboard to get updated ranks
          const { data, error } = await supabase
            .from("poule_members")
            .select(`
              id,
              user_id,
              points,
              rank,
              profiles:user_id (
                display_name,
                avatar_url
              )
            `)
            .eq("poule_id", pouleId)
            .order("rank", { ascending: true, nullsFirst: false })
            .order("points", { ascending: false });

          if (!error && data) {
            const mapped = data.map((entry) => ({
              id: entry.id,
              user_id: entry.user_id,
              points: entry.points,
              rank: entry.rank,
              display_name: (entry.profiles as any)?.display_name || "Speler",
              avatar_url: (entry.profiles as any)?.avatar_url,
              previousRank: previousEntries.get(entry.user_id)?.rank,
            }));

            // Check for first place celebration before updating state
            checkForFirstPlaceCelebration(mapped, previousEntries);

            // Find entries that changed
            const changedIds = new Set<string>();
            mapped.forEach((entry) => {
              const prev = previousEntries.get(entry.user_id);
              if (prev && (prev.points !== entry.points || prev.rank !== entry.rank)) {
                changedIds.add(entry.id);
              }
            });

            setAnimatingIds(changedIds);
            setEntries(mapped);
            setPreviousEntries(new Map(mapped.map(e => [e.user_id, e])));

            // Clear animation after delay
            setTimeout(() => setAnimatingIds(new Set()), 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pouleId, previousEntries, checkForFirstPlaceCelebration]);

  const getRankChange = (current: number | null, previous: number | null | undefined) => {
    if (current === null || previous === null || previous === undefined) return "same";
    if (current < previous) return "up";
    if (current > previous) return "down";
    return "same";
  };

  const getRankIcon = (rank: number | null) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />;
    return null;
  };

  const getRankBadgeStyles = (rank: number | null) => {
    if (rank === 1) return "bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-lg shadow-yellow-500/30";
    if (rank === 2) return "bg-gradient-to-br from-gray-300 to-gray-400 text-black shadow-lg shadow-gray-400/30";
    if (rank === 3) return "bg-gradient-to-br from-orange-400 to-orange-500 text-black shadow-lg shadow-orange-500/30";
    return "bg-secondary text-muted-foreground";
  };

  const getRowStyles = (rank: number | null, isCurrentUser: boolean, isAnimating: boolean) => {
    const baseStyles = "flex items-center gap-4 p-4 rounded-xl transition-all duration-500";
    
    if (isAnimating) {
      return cn(baseStyles, "animate-pulse ring-2 ring-primary ring-offset-2 ring-offset-background");
    }
    
    if (isCurrentUser) {
      return cn(baseStyles, "bg-primary/10 border-2 border-primary/40 shadow-lg shadow-primary/10");
    }
    
    if (rank === 1) {
      return cn(baseStyles, "bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-500/20");
    }
    
    if (rank === 2) {
      return cn(baseStyles, "bg-gradient-to-r from-gray-400/10 via-gray-300/5 to-transparent border border-gray-400/20");
    }
    
    if (rank === 3) {
      return cn(baseStyles, "bg-gradient-to-r from-orange-500/10 via-orange-400/5 to-transparent border border-orange-500/20");
    }
    
    return cn(baseStyles, "bg-secondary/30 hover:bg-secondary/50 border border-transparent");
  };

  if (isLoading) {
    return (
      <div className={cn("glass-card rounded-2xl p-6", className)}>
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("glass-card rounded-2xl p-6 overflow-hidden relative", className)}>
      {/* Celebration overlay when user reaches first place */}
      {showCelebration && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-orange-500/20 backdrop-blur-sm animate-fade-in">
          <div className="text-center animate-scale-in">
            <Crown className="w-16 h-16 mx-auto text-yellow-400 animate-bounce mb-4" />
            <h3 className="font-display text-2xl font-bold text-yellow-400 mb-2">
              🎉 Gefeliciteerd! 🎉
            </h3>
            <p className="text-foreground/80">Je staat nu op de eerste plaats!</p>
          </div>
        </div>
      )}

      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Live Ranglijst</h3>
            <p className="text-sm text-muted-foreground">{entries.length} deelnemers</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-medium animate-pulse-glow">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          Live
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="relative space-y-2">
        {entries.map((entry, index) => {
          const isCurrentUser = entry.user_id === currentUserId;
          const isAnimating = animatingIds.has(entry.id);
          const rankChange = getRankChange(entry.rank, entry.previousRank);
          const displayRank = entry.rank ?? index + 1;

          return (
            <div
              key={entry.id}
              className={getRowStyles(entry.rank, isCurrentUser, isAnimating)}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {/* Rank Badge */}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0",
                getRankBadgeStyles(entry.rank)
              )}>
                {getRankIcon(entry.rank) || displayRank}
              </div>

              {/* Avatar */}
              <div className="relative shrink-0">
                <div className={cn(
                  "w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium overflow-hidden",
                  isCurrentUser && "ring-2 ring-primary"
                )}>
                  {entry.avatar_url ? (
                    <img 
                      src={entry.avatar_url} 
                      alt={entry.display_name || "Avatar"} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {(entry.display_name || "S")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                {entry.rank === 1 && (
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium truncate",
                  isCurrentUser && "text-primary"
                )}>
                  {entry.display_name || "Speler"}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-primary/70">(jij)</span>
                  )}
                </p>
                {entry.rank === 1 && (
                  <p className="text-xs text-yellow-500/80 flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Koploper
                  </p>
                )}
              </div>

              {/* Points */}
              <div className="text-right shrink-0">
                <p className={cn(
                  "font-display font-bold text-lg",
                  isAnimating && "text-primary"
                )}>
                  {entry.points}
                </p>
                <p className="text-xs text-muted-foreground">punten</p>
              </div>

              {/* Rank Change Indicator */}
              <div className="w-6 shrink-0 flex justify-center">
                {rankChange === "up" && (
                  <div className="text-green-500 animate-bounce">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                )}
                {rankChange === "down" && (
                  <div className="text-destructive">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                )}
                {rankChange === "same" && (
                  <Minus className="w-4 h-4 text-muted-foreground/50" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nog geen deelnemers</p>
        </div>
      )}
    </div>
  );
};

export default LiveLeaderboard;
