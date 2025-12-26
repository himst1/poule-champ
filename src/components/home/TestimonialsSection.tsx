import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sophie de Vries",
    role: "HR Manager",
    company: "Tech Startup Amsterdam",
    avatar: "S",
    rating: 5,
    quote:
      "Eindelijk een WK-pool app die gewoon werkt! Vorig jaar gebruikten we Excel en dat was een ramp. Nu doet de app alles automatisch.",
  },
  {
    name: "Mark Jansen",
    role: "Team Lead",
    company: "Consultancy Bureau",
    avatar: "M",
    rating: 5,
    quote:
      "De Stripe integratie is perfect. Iedereen betaalt via de app, geen gedoe meer met Tikkies. En de live ranglijst is echt verslavend!",
  },
  {
    name: "Lisa van den Berg",
    role: "Kantoormanager",
    company: "Advocatenkantoor",
    avatar: "L",
    rating: 5,
    quote:
      "Onze hele kantoor doet mee. 45 collega's en alles loopt soepel. De notificaties bij doelpunten zijn geweldig!",
  },
  {
    name: "Tom Bakker",
    role: "Ondernemer",
    company: "E-commerce",
    avatar: "T",
    rating: 5,
    quote:
      "Al 3 toernooien gebruikt. EK 2024, Champions League, en nu klaar voor WK 2026. Beste poule-app die er is.",
  },
  {
    name: "Emma Visser",
    role: "Marketing",
    company: "Mediabureau",
    avatar: "E",
    rating: 5,
    quote:
      "De AI voorspellingen zijn verrassend goed! En de statistieken laten precies zien waar ik punten verlies. Super handig.",
  },
  {
    name: "Pieter de Groot",
    role: "Sales Director",
    company: "Multinational",
    avatar: "P",
    rating: 5,
    quote:
      "We hebben 3 poules: management, sales team en de hele afdeling. Alles overzichtelijk in één dashboard. Aanrader!",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">
            Reviews
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-6">
            Wat anderen zeggen
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Duizenden tevreden gebruikers gingen je voor. Dit is wat ze te zeggen hebben.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-primary/20 mb-4 group-hover:text-primary/40 transition-colors" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground mb-6 leading-relaxed">"{testimonial.quote}"</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role} • {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-16 glass-card rounded-2xl p-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-primary mb-1">4.9/5</div>
              <p className="text-sm text-muted-foreground">Gemiddelde beoordeling</p>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-primary mb-1">50,000+</div>
              <p className="text-sm text-muted-foreground">Actieve spelers</p>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-primary mb-1">2,500+</div>
              <p className="text-sm text-muted-foreground">Poules aangemaakt</p>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-primary mb-1">€100k+</div>
              <p className="text-sm text-muted-foreground">Uitgekeerd aan winnaars</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
