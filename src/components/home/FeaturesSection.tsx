import { Trophy, Users, CreditCard, Bell, BarChart3, Smartphone } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Poule Beheer",
    description: "Maak onbeperkt poules aan, nodig vrienden uit via link of QR-code, en beheer alles vanuit één dashboard.",
    color: "primary",
  },
  {
    icon: Trophy,
    title: "Live Leaderboard",
    description: "Real-time ranglijst die automatisch updatet zodra wedstrijden eindigen. Zie direct wie er wint.",
    color: "gold",
  },
  {
    icon: CreditCard,
    title: "Stripe Betalingen",
    description: "Veilig inschrijfgeld innen via Stripe. Automatische pot-berekening en eenvoudige uitbetaling.",
    color: "primary",
  },
  {
    icon: BarChart3,
    title: "Slimme Statistieken",
    description: "Bekijk je accuraatheid, beste voorspellingen, en vergelijk jezelf met andere spelers.",
    color: "gold",
  },
  {
    icon: Bell,
    title: "Push Notificaties",
    description: "Ontvang alerts voor wedstrijd-starts, einduitslagen, en ranglijst-veranderingen.",
    color: "primary",
  },
  {
    icon: Smartphone,
    title: "Mobile-First",
    description: "Volledig responsive design. Voorspel onderweg, bekijk scores overal.",
    color: "gold",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Features</span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-6">
            Alles wat je nodig hebt
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Van poule-creatie tot prijzenpot-verdeling. Wij regelen de techniek, jij focust op voorspellen.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group glass-card rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                feature.color === "primary" 
                  ? "bg-primary/10 text-primary" 
                  : "bg-gold/10 text-gold"
              }`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
