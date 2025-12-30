import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Bell, CreditCard, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

export const UpgradeModal = ({ isOpen, onClose, feature, pouleName }: UpgradeModalProps) => {
  const navigate = useNavigate();
  const info = featureInfo[feature];
  const FeatureIcon = info.icon;

  const handleUpgrade = () => {
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
