import { useState } from "react";
import { getFlagUrl } from "@/lib/flags";

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

/**
 * Flag image component that displays country flags from flagcdn.com
 * Handles fallback when flag is not found
 */
export const FlagImage = ({ teamName, size = "sm", className = "" }: FlagImageProps) => {
  const [hasError, setHasError] = useState(false);
  const flagUrl = getFlagUrl(teamName, sizeWidths[size]);
  
  // Show placeholder if no flag URL or if image failed to load
  if (!flagUrl || hasError) {
    return (
      <div className={`${sizeClasses[size]} bg-secondary rounded flex items-center justify-center flex-shrink-0 ${className}`}>
        <span className="text-muted-foreground text-[10px]">?</span>
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
