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
  const flagUrl = getFlagUrl(teamName, sizeWidths[size]);
  
  if (!flagUrl) {
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
      onError={(e) => {
        // Hide broken image and show placeholder
        const target = e.currentTarget;
        target.style.display = "none";
        const placeholder = document.createElement("div");
        placeholder.className = `${sizeClasses[size]} bg-secondary rounded flex items-center justify-center flex-shrink-0`;
        placeholder.innerHTML = '<span class="text-muted-foreground text-[10px]">?</span>';
        target.parentNode?.insertBefore(placeholder, target);
      }}
    />
  );
};

export default FlagImage;
