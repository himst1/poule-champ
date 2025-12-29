import { useState } from "react";
import { getFlagUrl } from "@/lib/flags";
import { Globe, Trophy, Shield } from "lucide-react";

interface FlagImageProps {
  teamName: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "w-5 h-3",
  sm: "w-7 h-5",
  md: "w-10 h-7",
  lg: "w-12 h-8",
};

const sizeWidths = {
  xs: 20,
  sm: 40,
  md: 60,
  lg: 80,
};

const iconSizes = {
  xs: 10,
  sm: 14,
  md: 18,
  lg: 22,
};

// Detect if team name is a playoff/knockout placeholder
const getPlayoffType = (teamName: string | null): "fifa" | "uefa" | "caf" | "afc" | "concacaf" | "conmebol" | "ofc" | "knockout" | null => {
  if (!teamName) return null;
  const lower = teamName.toLowerCase();
  
  // Knockout stage placeholders (e.g., "Winnaar A", "Tweede B", "1A", "2B", etc.)
  if (
    lower.startsWith("winnaar ") ||
    lower.startsWith("tweede ") ||
    lower.startsWith("winner ") ||
    lower.startsWith("runner-up ") ||
    lower.startsWith("1") ||
    lower.startsWith("2") ||
    lower.startsWith("3") ||
    lower === "tbd" ||
    lower === "nader te bepalen"
  ) {
    return "knockout";
  }
  
  if (lower.includes("play-off fifa") || lower.includes("playoff fifa")) {
    return "fifa";
  }
  if (lower.includes("play-off uefa") || lower.includes("playoff uefa")) {
    return "uefa";
  }
  if (lower.includes("play-off caf") || lower.includes("playoff caf")) {
    return "caf";
  }
  if (lower.includes("play-off afc") || lower.includes("playoff afc")) {
    return "afc";
  }
  if (lower.includes("play-off concacaf") || lower.includes("playoff concacaf")) {
    return "concacaf";
  }
  if (lower.includes("play-off conmebol") || lower.includes("playoff conmebol")) {
    return "conmebol";
  }
  if (lower.includes("play-off ofc") || lower.includes("playoff ofc")) {
    return "ofc";
  }
  
  return null;
};

// Get colors for confederation/knockout badges
const getConfederationStyle = (type: "fifa" | "uefa" | "caf" | "afc" | "concacaf" | "conmebol" | "ofc" | "knockout") => {
  switch (type) {
    case "knockout":
      return { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" };
    case "fifa":
      return { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" };
    case "uefa":
      return { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/30" };
    case "caf":
      return { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" };
    case "afc":
      return { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" };
    case "concacaf":
      return { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" };
    case "conmebol":
      return { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" };
    case "ofc":
      return { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" };
  }
};

/**
 * Flag image component that displays country flags from flagcdn.com
 * Shows confederation badges for playoff matches
 * Handles fallback when flag is not found
 */
export const FlagImage = ({ teamName, size = "sm", className = "" }: FlagImageProps) => {
  const [hasError, setHasError] = useState(false);
  const flagUrl = getFlagUrl(teamName, sizeWidths[size]);
  const playoffType = getPlayoffType(teamName);
  
  // Show confederation badge for playoff matches
  if (playoffType) {
    const style = getConfederationStyle(playoffType);
    const iconSize = iconSizes[size];
    
    return (
      <div 
        className={`${sizeClasses[size]} ${style.bg} ${style.border} border rounded flex items-center justify-center flex-shrink-0 ${className}`}
        title={teamName || undefined}
      >
        {playoffType === "knockout" ? (
          <Trophy className={style.text} size={iconSize} strokeWidth={2} />
        ) : playoffType === "fifa" ? (
          <Globe className={style.text} size={iconSize} strokeWidth={2} />
        ) : playoffType === "uefa" ? (
          <Shield className={style.text} size={iconSize} strokeWidth={2} />
        ) : (
          <Trophy className={style.text} size={iconSize} strokeWidth={2} />
        )}
      </div>
    );
  }
  
  // Show placeholder if no flag URL or if image failed to load
  if (!flagUrl || hasError) {
    return (
      <div 
        className={`${sizeClasses[size]} bg-secondary/50 border border-border/50 rounded flex items-center justify-center flex-shrink-0 ${className}`}
        title={teamName || undefined}
      >
        <Globe className="text-muted-foreground" size={iconSizes[size]} strokeWidth={1.5} />
      </div>
    );
  }
  
  return (
    <img
      src={flagUrl}
      alt={teamName ? `Vlag van ${teamName}` : "Vlag"}
      className={`${sizeClasses[size]} object-cover rounded shadow-sm flex-shrink-0 ${className}`}
      onError={() => setHasError(true)}
    />
  );
};

export default FlagImage;
