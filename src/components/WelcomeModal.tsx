import { useState, useEffect } from "react";
import { Trophy, Target, Users, ChevronRight, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface WelcomeModalProps {
  isNewUser: boolean;
}

export const WelcomeModal = ({ isNewUser }: WelcomeModalProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Only show for new users who haven't seen the welcome modal
    const hasSeenWelcome = localStorage.getItem("welcome-modal-seen");
    if (isNewUser && !hasSeenWelcome) {
      // Small delay for better UX
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isNewUser]);

  const handleClose = () => {
    localStorage.setItem("welcome-modal-seen", "true");
    setOpen(false);
  };

  const handleGetStarted = () => {
    handleClose();
    navigate("/create-poule");
  };

  const handleViewGuide = () => {
    handleClose();
    navigate("/handleiding");
  };

  const features = [
    {
      icon: <Trophy className="w-8 h-8 text-primary" />,
      title: "Maak een Poule",
      description: "Start je eigen poule en nodig vrienden uit om mee te doen aan het WK 2026.",
    },
    {
      icon: <Target className="w-8 h-8 text-accent" />,
      title: "Voorspel Wedstrijden",
      description: "Voorspel de uitslagen van alle 104 WK-wedstrijden en verdien punten.",
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Strijd om de Winst",
      description: "Bekijk de live ranglijst en versla je vrienden om de hoofdprijs!",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-background border-primary/20">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary/20 via-accent/10 to-background p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.15),transparent_70%)]" />
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl sm:text-3xl font-bold text-center">
                Welkom bij WK Poule 2026! 🎉
              </DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground mt-2">
              Klaar om je vrienden te verslaan in het grootste voetbaltoernooi ter wereld?
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Features */}
          <div className="space-y-4 mb-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="hero"
              className="flex-1"
              onClick={handleGetStarted}
            >
              Start Nu
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleViewGuide}
            >
              Bekijk Handleiding
            </Button>
          </div>

          {/* Skip */}
          <button
            onClick={handleClose}
            className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Overslaan
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
