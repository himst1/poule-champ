import { Check, X, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Gratis",
    description: "Perfect om te beginnen",
    price: "€0",
    period: "voor altijd",
    icon: Zap,
    featured: false,
    features: [
      { text: "1 poule aanmaken", included: true },
      { text: "Tot 10 deelnemers", included: true },
      { text: "Live ranglijst", included: true },
      { text: "Basisstatistieken", included: true },
      { text: "Push notificaties", included: false },
      { text: "AI voorspellingen", included: false },
      { text: "Stripe betalingen", included: false },
    ],
    cta: "Gratis Starten",
    ctaVariant: "outline" as const,
  },
  {
    name: "Pro",
    description: "Voor serieuze competitie",
    price: "€9",
    period: "eenmalig per poule",
    icon: Sparkles,
    featured: true,
    features: [
      { text: "Onbeperkt poules", included: true },
      { text: "Tot 100 deelnemers", included: true },
      { text: "Live ranglijst", included: true },
      { text: "Uitgebreide statistieken", included: true },
      { text: "Push notificaties", included: true },
      { text: "AI voorspellingen", included: true },
      { text: "Stripe betalingen", included: true },
    ],
    cta: "Kies Pro",
    ctaVariant: "hero" as const,
  },
  {
    name: "Zakelijk",
    description: "Voor bedrijven en grote groepen",
    price: "€29",
    period: "per poule",
    icon: Crown,
    featured: false,
    features: [
      { text: "Onbeperkt poules", included: true },
      { text: "Onbeperkt deelnemers", included: true },
      { text: "Eigen branding", included: true },
      { text: "API toegang", included: true },
      { text: "Dedicated support", included: true },
      { text: "Custom integraties", included: true },
      { text: "Factuur betaling", included: true },
    ],
    cta: "Contact Opnemen",
    ctaVariant: "outline" as const,
  },
];

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">
            Prijzen
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-6">
            Simpel, transparant, eerlijk
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Geen verborgen kosten. Geen maandelijkse abonnementen. Betaal alleen voor wat je nodig hebt.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl p-6 transition-all duration-300",
                plan.featured
                  ? "bg-gradient-to-b from-primary/10 to-primary/5 border-2 border-primary shadow-xl shadow-primary/10 scale-105 z-10"
                  : "glass-card hover:border-primary/30"
              )}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  Meest gekozen
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4",
                    plan.featured ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                  )}
                >
                  <plan.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-display text-4xl font-bold">{plan.price}</span>
                </div>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        feature.included ? "text-foreground" : "text-muted-foreground/50"
                      )}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.ctaVariant}
                className="w-full"
                onClick={() => navigate("/auth?returnUrl=/create-poule")}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm mb-4">Vertrouwd door</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            <span className="font-display font-bold text-lg">ING</span>
            <span className="font-display font-bold text-lg">Philips</span>
            <span className="font-display font-bold text-lg">ASML</span>
            <span className="font-display font-bold text-lg">Rabobank</span>
            <span className="font-display font-bold text-lg">KLM</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
