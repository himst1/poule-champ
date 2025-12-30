import { Crown, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

interface UpgradeBannerProps {
  pouleName: string;
}

const fireConfetti = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#9B59B6', '#3498DB'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#9B59B6', '#3498DB'],
    });
  }, 250);
};

export const UpgradeBanner = ({ pouleName }: UpgradeBannerProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    fireConfetti();
    navigate("/#pricing");
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 p-4 mb-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.1),transparent_50%)]" />
      <div className="absolute top-2 right-2 opacity-20">
        <Sparkles className="w-24 h-24 text-primary" />
      </div>
      
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Upgrade {pouleName} naar Pro
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Krijg toegang tot AI voorspellingen, push notificaties en meer premium features
            </p>
          </div>
        </div>
        
        <Button 
          onClick={handleUpgrade}
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shrink-0"
        >
          Upgrade naar Pro
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
