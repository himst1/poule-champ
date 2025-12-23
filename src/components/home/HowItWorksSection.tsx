import { UserPlus, Target, Trophy, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Maak een Poule",
    description: "Kies een naam, stel het inschrijfgeld in, en deel de unieke link met je vrienden of collega's.",
  },
  {
    number: "02",
    icon: Target,
    title: "Doe Voorspellingen",
    description: "Voorspel de uitslag van elke WK-wedstrijd. Exacte scores leveren meer punten op!",
  },
  {
    number: "03",
    icon: Trophy,
    title: "Win de Pot",
    description: "Volg de live ranglijst en strijd om de eerste plaats. Winnaar krijgt de pot!",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 relative bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Hoe werkt het</span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-6">
            In 3 stappen naar je poule
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-6">
            Simpel, snel, en zonder gedoe. In minder dan 5 minuten is je poule live.
          </p>
          <Button variant="outline" size="lg" className="gap-2" onClick={() => window.location.href = "/handleiding"}>
            <BookOpen className="w-5 h-5" />
            Bekijk de volledige handleiding
          </Button>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/50 to-transparent" />
              )}

              <div className="text-center">
                {/* Icon Circle */}
                <div className="relative inline-flex mb-6">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-gold/10 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-card border border-border flex items-center justify-center">
                      <step.icon className="w-10 h-10 text-primary" />
                    </div>
                  </div>
                  {/* Step Number */}
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center font-display font-bold text-primary-foreground text-sm">
                    {step.number}
                  </div>
                </div>

                <h3 className="font-display font-bold text-xl mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
