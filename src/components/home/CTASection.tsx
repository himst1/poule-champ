import { ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-gold/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gold to-gold-dark mb-8">
            <Trophy className="w-10 h-10 text-accent-foreground" />
          </div>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Klaar om te winnen?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Start vandaag nog je WK 2026 poule en verzamel je vrienden en collega's. 
            Het is gratis om te beginnen!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="gold" size="xl" className="w-full sm:w-auto group">
              Start Je Poule Nu
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Geen creditcard nodig • Gratis voor altijd met basis features
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
