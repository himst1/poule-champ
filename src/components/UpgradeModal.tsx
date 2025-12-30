import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Bell, CreditCard, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";

type FeatureType = "ai" | "push" | "payments";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: FeatureType;
  pouleName?: string;
}

const featureInfo: Record<FeatureType, { title: string; description: string; icon: React.ElementType }> = {
  ai: {
    title: "AI Voorspellingen",
    description: "Laat AI je helpen met slimme voorspellingen gebaseerd op historische data en team statistieken.",
    icon: Sparkles,
  },
  push: {
    title: "Push Notificaties",
    description: "Ontvang herinneringen voor naderende deadlines zodat je nooit een voorspelling mist.",
    icon: Bell,
  },
  payments: {
    title: "Stripe Betalingen",
    description: "Verzamel inleg van deelnemers automatisch via veilige online betalingen.",
    icon: CreditCard,
  },
};

const proFeatures = [
  "AI voorspellingen",
  "Push notificaties",
  "Stripe betalingen",
  "Tot 100 deelnemers",
  "Uitgebreide statistieken",
];

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

export const UpgradeModal = ({ isOpen, onClose, feature, pouleName }: UpgradeModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const info = featureInfo[feature];
  const FeatureIcon = info.icon;

  const handleUpgrade = () => {
    // Fire confetti celebration
    fireConfetti();
    // Show success toast
    toast({
      title: "🎉 Welkom bij Pro!",
      description: pouleName 
        ? `"${pouleName}" wordt geüpgraded. Je krijgt nu toegang tot alle premium features!`
        : "Je krijgt nu toegang tot alle premium features!",
    });
    // Navigate to pricing section on home page
    navigate("/#pricing");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Upgrade naar Pro
          </DialogTitle>
          <DialogDescription>
            {pouleName ? `Upgrade "${pouleName}" naar Pro` : "Upgrade naar Pro"} om toegang te krijgen tot deze feature.
          </DialogDescription>
        </DialogHeader>

        {/* Feature Highlight */}
        <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="p-2 rounded-lg bg-primary/10">
            <FeatureIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{info.title}</h3>
            <p className="text-sm text-muted-foreground">{info.description}</p>
          </div>
        </div>

        {/* Pro Plan Features */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Pro abonnement bevat:</p>
          <ul className="space-y-2">
            {proFeatures.map((feat, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary" />
                {feat}
              </li>
            ))}
          </ul>
        </div>

        {/* Price */}
        <div className="text-center py-4 bg-secondary/30 rounded-lg">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-bold">€9</span>
          </div>
          <p className="text-sm text-muted-foreground">eenmalig per poule</p>
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Later
          </Button>
          <Button variant="hero" onClick={handleUpgrade} className="flex-1">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade naar Pro
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
