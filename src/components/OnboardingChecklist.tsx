import { useState, useEffect } from "react";
import { Check, Trophy, Users, Target, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action: () => void;
  actionLabel: string;
};

interface OnboardingChecklistProps {
  hasPoules: boolean;
  hasPredictions: boolean;
  hasInvitedFriends: boolean;
  pouleId?: string;
}

export const OnboardingChecklist = ({
  hasPoules,
  hasPredictions,
  hasInvitedFriends,
  pouleId,
}: OnboardingChecklistProps) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Check if onboarding was dismissed
  useEffect(() => {
    const isDismissed = localStorage.getItem("onboarding-dismissed");
    if (isDismissed === "true") {
      setDismissed(true);
    }
  }, []);

  const steps: OnboardingStep[] = [
    {
      id: "create-poule",
      title: "Maak een poule aan",
      description: "Start je eigen WK 2026 poule",
      icon: <Trophy className="w-5 h-5" />,
      completed: hasPoules,
      action: () => navigate("/create-poule"),
      actionLabel: "Poule aanmaken",
    },
    {
      id: "invite-friends",
      title: "Nodig vrienden uit",
      description: "Deel je poule met je vrienden",
      icon: <Users className="w-5 h-5" />,
      completed: hasInvitedFriends,
      action: () => pouleId && navigate(`/poule/${pouleId}`),
      actionLabel: "Naar mijn poule",
    },
    {
      id: "make-predictions",
      title: "Doe je voorspellingen",
      description: "Voorspel de wedstrijduitslagen",
      icon: <Target className="w-5 h-5" />,
      completed: hasPredictions,
      action: () => pouleId && navigate(`/poule/${pouleId}`),
      actionLabel: "Voorspellen",
    },
  ];

  const completedSteps = steps.filter((s) => s.completed).length;
  const allCompleted = completedSteps === steps.length;
  const progress = (completedSteps / steps.length) * 100;

  // Don't show if all completed and dismissed, or if explicitly dismissed
  if (dismissed || allCompleted) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem("onboarding-dismissed", "true");
    setDismissed(true);
  };

  return (
    <Card className="glass-card rounded-2xl p-6 mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Aan de slag!</h3>
            <p className="text-sm text-muted-foreground">
              Voltooi deze stappen om je WK-ervaring te starten
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-muted-foreground text-xs"
        >
          Verbergen
        </Button>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {completedSteps} van {steps.length} stappen voltooid
          </span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isNext = !step.completed && steps.slice(0, index).every((s) => s.completed);
          
          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl transition-all duration-300",
                step.completed
                  ? "bg-primary/10 border border-primary/20"
                  : isNext
                  ? "bg-secondary/80 border border-primary/30 shadow-sm"
                  : "bg-secondary/50 opacity-60"
              )}
            >
              {/* Step number / check */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                  step.completed
                    ? "bg-primary text-primary-foreground"
                    : isNext
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step.completed ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-bold">{index + 1}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {step.icon}
                  <h4
                    className={cn(
                      "font-semibold",
                      step.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground truncate">{step.description}</p>
              </div>

              {/* Action button */}
              {!step.completed && isNext && (
                <Button
                  variant="hero"
                  size="sm"
                  onClick={step.action}
                  className="flex-shrink-0"
                >
                  {step.actionLabel}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
              
              {step.completed && (
                <div className="text-primary font-medium text-sm flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Klaar
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
