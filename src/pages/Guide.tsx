import { 
  Trophy, UserPlus, Users, Target, Award, BarChart3, Settings, Bell, 
  HelpCircle, ChevronRight, CheckCircle, QrCode, Share2, Calendar,
  Lock, Zap, ArrowUp, Medal, ListOrdered, Goal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollIndicator from "@/components/ScrollIndicator";
import { useState, useEffect } from "react";

const sections = [
  { id: "welkom", title: "Welkom", icon: Trophy },
  { id: "account", title: "Account Aanmaken", icon: UserPlus },
  { id: "poule-maken", title: "Poule Maken", icon: Users },
  { id: "deelnemen", title: "Deelnemen", icon: ChevronRight },
  { id: "voorspellingen", title: "Voorspellingen", icon: Target },
  { id: "punten", title: "Puntensysteem", icon: Award },
  { id: "ranglijst", title: "Ranglijst", icon: BarChart3 },
  { id: "beheer", title: "Poule Beheer", icon: Settings },
  { id: "notificaties", title: "Notificaties", icon: Bell },
  { id: "faq", title: "FAQ", icon: HelpCircle },
];

const faqItems = [
  {
    question: "Kan ik mijn voorspelling wijzigen?",
    answer: "Ja, je kunt je voorspelling aanpassen tot aan de aftrap van de wedstrijd. Zodra de wedstrijd begint, wordt je voorspelling vergrendeld."
  },
  {
    question: "Wat gebeurt er als ik een wedstrijd mis?",
    answer: "Als je geen voorspelling doet voor een wedstrijd, krijg je 0 punten voor die wedstrijd. Zorg ervoor dat je op tijd je voorspellingen invult!"
  },
  {
    question: "Hoe win ik de pot?",
    answer: "De speler met de meeste punten aan het einde van het toernooi wint de pot. Bij gelijke stand wordt gekeken naar het aantal exacte scores."
  },
  {
    question: "Kan ik aan meerdere poules meedoen?",
    answer: "Ja, je kunt aan zoveel poules meedoen als je wilt. Je punten worden per poule bijgehouden."
  },
  {
    question: "Is mijn betaling veilig?",
    answer: "Absoluut! Alle betalingen worden veilig verwerkt via Stripe. Wij slaan geen betalingsgegevens op."
  },
  {
    question: "Kan ik een gratis poule maken?",
    answer: "Ja, je kunt het inschrijfgeld op €0 zetten om een gratis poule te maken. Perfect voor vrienden die alleen voor de eer spelen!"
  },
  {
    question: "Hoe werkt de QR-code uitnodiging?",
    answer: "Na het aanmaken van je poule ontvang je een unieke QR-code. Vrienden kunnen deze scannen om direct naar je poule te gaan en zich in te schrijven."
  },
  {
    question: "Wanneer worden de punten bijgewerkt?",
    answer: "Punten worden automatisch bijgewerkt zodra een wedstrijd is afgelopen en de officiële eindstand bekend is."
  },
];

const Guide = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ScrollIndicator />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-16">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Handleiding</span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mt-4 mb-6">
              Alles wat je moet weten over <span className="gradient-text">PouleMeister</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Van account aanmaken tot prijzen winnen - hier vind je alle informatie om succesvol mee te doen aan WK 2026 voorspellingen.
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant="outline"
                size="sm"
                onClick={() => scrollToSection(section.id)}
                className="gap-2"
              >
                <section.icon className="w-4 h-4" />
                {section.title}
              </Button>
            ))}
          </div>
        </section>

        {/* Section 1: Welkom */}
        <section id="welkom" className="py-16 scroll-mt-24">
          <div className="container mx-auto px-4">
            <Card className="glass-card max-w-4xl mx-auto">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-primary text-sm font-semibold">Sectie 1</span>
                    <CardTitle className="text-2xl">Welkom bij PouleMeister</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  PouleMeister is dé app voor WK 2026 voorspellingen. Organiseer je eigen poule met vrienden, familie of collega's 
                  en strijd om de pot door wedstrijduitslagen te voorspellen.
                </p>
                <div className="grid sm:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50 text-center">
                    <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h4 className="font-semibold mb-1">Snel Opzetten</h4>
                    <p className="text-sm text-muted-foreground">In 2 minuten je poule klaar</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50 text-center">
                    <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h4 className="font-semibold mb-1">Veilige Betalingen</h4>
                    <p className="text-sm text-muted-foreground">Via Stripe verwerkt</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50 text-center">
                    <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h4 className="font-semibold mb-1">Live Ranglijst</h4>
                    <p className="text-sm text-muted-foreground">Realtime scores bijgehouden</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 2: Account Aanmaken */}
        <section id="account" className="py-16 bg-secondary/30 scroll-mt-24">
          <div className="container mx-auto px-4">
            <Card className="glass-card max-w-4xl mx-auto">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-primary text-sm font-semibold">Sectie 2</span>
                    <CardTitle className="text-2xl">Account Aanmaken & Inloggen</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Registreren</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">1</div>
                      <div>
                        <p className="font-medium">Klik op "Start Gratis" of "Registreren"</p>
                        <p className="text-sm text-muted-foreground">Je vindt deze knoppen rechtsboven in de header</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">2</div>
                      <div>
                        <p className="font-medium">Vul je e-mailadres en wachtwoord in</p>
                        <p className="text-sm text-muted-foreground">Kies een sterk wachtwoord van minimaal 6 tekens</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">3</div>
                      <div>
                        <p className="font-medium">Voeg optioneel een weergavenaam toe</p>
                        <p className="text-sm text-muted-foreground">Deze naam wordt getoond in de ranglijst</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Tip</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Na registratie word je automatisch ingelogd en doorgestuurd naar je dashboard.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 3: Poule Maken */}
        <section id="poule-maken" className="py-16 scroll-mt-24">
          <div className="container mx-auto px-4">
            <Card className="glass-card max-w-4xl mx-auto">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-primary text-sm font-semibold">Sectie 3</span>
                    <CardTitle className="text-2xl">Poule Maken (voor Organisatoren)</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  Als organisator kun je eenvoudig een nieuwe poule aanmaken en vrienden uitnodigen.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">1</div>
                    <div>
                      <p className="font-medium">Ga naar Dashboard → "Nieuwe Poule"</p>
                      <p className="text-sm text-muted-foreground">Of klik op "Start Gratis" op de homepage</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">2</div>
                    <div>
                      <p className="font-medium">Kies een naam voor je poule</p>
                      <p className="text-sm text-muted-foreground">Bijv. "Kantoor WK 2026" of "Familie Poule"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">3</div>
                    <div>
                      <p className="font-medium">Stel het inschrijfgeld in (€0 - €50)</p>
                      <p className="text-sm text-muted-foreground">€0 voor gratis poules, of een bedrag naar keuze</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">4</div>
                    <div>
                      <p className="font-medium">Bepaal het maximum aantal deelnemers</p>
                      <p className="text-sm text-muted-foreground">Laat leeg voor onbeperkt aantal deelnemers</p>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <QrCode className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold">QR-code</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Na het aanmaken ontvang je een QR-code die je kunt delen of downloaden.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Share2 className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold">Deel via socials</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Deel je uitnodiging via WhatsApp, email, Facebook of Twitter.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 4: Deelnemen */}
        <section id="deelnemen" className="py-16 bg-secondary/30 scroll-mt-24">
          <div className="container mx-auto px-4">
            <Card className="glass-card max-w-4xl mx-auto">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <ChevronRight className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-primary text-sm font-semibold">Sectie 4</span>
                    <CardTitle className="text-2xl">Deelnemen aan een Poule</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  Er zijn drie manieren om deel te nemen aan een bestaande poule:
                </p>
                
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <h4 className="font-semibold mb-2">Via Uitnodigingscode</h4>
                    <p className="text-sm text-muted-foreground">
                      Vraag de organisator om de code en voer deze in op je Dashboard.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <span className="font-bold text-primary">2</span>
                    </div>
                    <h4 className="font-semibold mb-2">Via QR-code</h4>
                    <p className="text-sm text-muted-foreground">
                      Scan de QR-code van de organisator met je telefoon.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <span className="font-bold text-primary">3</span>
                    </div>
                    <h4 className="font-semibold mb-2">Via Directe Link</h4>
                    <p className="text-sm text-muted-foreground">
                      Klik op de link die je via WhatsApp of email hebt ontvangen.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Let op</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bij poules met inschrijfgeld moet je eerst betalen voordat je kunt deelnemen. 
                    Dit gaat veilig via Stripe.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 5: Voorspellingen */}
        <section id="voorspellingen" className="py-16 scroll-mt-24">
          <div className="container mx-auto px-4">
            <Card className="glass-card max-w-4xl mx-auto">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-primary text-sm font-semibold">Sectie 5</span>
                    <CardTitle className="text-2xl">Voorspellingen Doen</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">1</div>
                    <div>
                      <p className="font-medium">Ga naar "Wedstrijden" in het menu</p>
                      <p className="text-sm text-muted-foreground">Hier zie je alle WK-wedstrijden op chronologische volgorde</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">2</div>
                    <div>
                      <p className="font-medium">Filter op fase of datum</p>
                      <p className="text-sm text-muted-foreground">Gebruik de filters om specifieke wedstrijden te vinden</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">3</div>
                    <div>
                      <p className="font-medium">Vul je voorspelling in</p>
                      <p className="text-sm text-muted-foreground">Voer de thuisscore en uitscore in die jij verwacht</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">4</div>
                    <div>
                      <p className="font-medium">Sla je voorspelling op</p>
                      <p className="text-sm text-muted-foreground">Klik op "Opslaan" - je kunt tot aftrap wijzigen</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-semibold">Deadline</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Voorspellingen moeten ingevoerd zijn <strong>vóór de aftrap</strong> van de wedstrijd. 
                    Daarna worden ze automatisch vergrendeld.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 6: Puntensysteem */}
        <section id="punten" className="py-16 bg-secondary/30 scroll-mt-24">
          <div className="container mx-auto px-4">
            <Card className="glass-card max-w-4xl mx-auto">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-primary text-sm font-semibold">Sectie 6</span>
                    <CardTitle className="text-2xl">Puntensysteem</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <p className="text-muted-foreground">
                  Verzamel punten door wedstrijden, groepseindstanden, de topscorer en de WK winnaar correct te voorspellen.
                </p>

                {/* Wedstrijdvoorspellingen */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg">Wedstrijdvoorspellingen</h3>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-6 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 text-center">
                      <div className="text-4xl font-display font-bold text-primary mb-2">5</div>
                      <h4 className="font-semibold mb-1">Exacte Score</h4>
                      <p className="text-sm text-muted-foreground">Je voorspelt precies de juiste uitslag</p>
                    </div>
                    <div className="p-6 rounded-lg bg-secondary/50 border border-border/50 text-center">
                      <div className="text-4xl font-display font-bold mb-2">2</div>
                      <h4 className="font-semibold mb-1">Juist Resultaat</h4>
                      <p className="text-sm text-muted-foreground">Winnaar of gelijkspel correct</p>
                    </div>
                    <div className="p-6 rounded-lg bg-secondary/50 border border-border/50 text-center">
                      <div className="text-4xl font-display font-bold mb-2">3</div>
                      <h4 className="font-semibold mb-1">Penalty Winnaar</h4>
                      <p className="text-sm text-muted-foreground">Correcte winnaar bij strafschoppen (knock-out)</p>
                    </div>
                  </div>
                </div>

                {/* Groepseindstanden */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg">Groepseindstanden</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-6 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 text-center">
                      <div className="text-4xl font-display font-bold text-blue-500 mb-2">3</div>
                      <h4 className="font-semibold mb-1">Per Correcte Positie</h4>
                      <p className="text-sm text-muted-foreground">Voor elk team op de juiste plek in de groep</p>
                    </div>
                    <div className="p-6 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 text-center">
                      <div className="text-4xl font-display font-bold text-green-500 mb-2">+10</div>
                      <h4 className="font-semibold mb-1">Bonus Alle Correct</h4>
                      <p className="text-sm text-muted-foreground">Extra bonus als alle 4 posities kloppen</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary border border-border">
                    <p className="text-sm text-muted-foreground">
                      <strong>Maximum per groep:</strong> 3×4 + 10 = <strong className="text-foreground">22 punten</strong> 
                      <span className="mx-2">|</span>
                      <strong>Totaal 8 groepen:</strong> 8×22 = <strong className="text-foreground">176 punten mogelijk</strong>
                    </p>
                  </div>
                </div>

                {/* Topscorer */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Goal className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg">Topscorer Voorspelling</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-6 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 text-center">
                      <div className="text-4xl font-display font-bold text-amber-500 mb-2">15</div>
                      <h4 className="font-semibold mb-1">Exacte Topscorer</h4>
                      <p className="text-sm text-muted-foreground">Je voorspelde speler wordt topscorer</p>
                    </div>
                    <div className="p-6 rounded-lg bg-secondary/50 border border-border/50 text-center">
                      <div className="text-4xl font-display font-bold mb-2">3</div>
                      <h4 className="font-semibold mb-1">Speler in Top 3</h4>
                      <p className="text-sm text-muted-foreground">Je voorspelde speler eindigt in top 3 scorers</p>
                    </div>
                  </div>
                </div>

                {/* WK Winnaar */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-semibold text-lg">WK Winnaar Voorspelling</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-6 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/30 text-center">
                      <div className="text-4xl font-display font-bold text-yellow-500 mb-2">25</div>
                      <h4 className="font-semibold mb-1">Juiste Winnaar</h4>
                      <p className="text-sm text-muted-foreground">Je voorspelde land wint het WK</p>
                    </div>
                    <div className="p-6 rounded-lg bg-secondary/50 border border-border/50 text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Medal className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="text-4xl font-display font-bold mb-2">5</div>
                      <h4 className="font-semibold mb-1">Finalist</h4>
                      <p className="text-sm text-muted-foreground">Je voorspelde land haalt de finale</p>
                    </div>
                  </div>
                </div>

                {/* Samenvatting */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Punten Samenvatting
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span>Exacte score</span>
                      <span className="font-bold">5 punten</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span>Juist resultaat</span>
                      <span className="font-bold">2 punten</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span>Penalty winnaar (knock-out)</span>
                      <span className="font-bold">3 punten</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span>Groep positie correct</span>
                      <span className="font-bold">3 punten</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span>Groep alle 4 correct</span>
                      <span className="font-bold">+10 bonus</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span>Exacte topscorer</span>
                      <span className="font-bold">15 punten</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span>Topscorer in top 3</span>
                      <span className="font-bold">3 punten</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/30">
                      <span>WK winnaar correct</span>
                      <span className="font-bold text-yellow-500">25 punten</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Finalist (haalt finale)</span>
                      <span className="font-bold">5 punten</span>
                    </div>
                  </div>
                </div>

                {/* Voorbeelden */}
                <div className="p-4 rounded-lg bg-secondary border border-border">
                  <h4 className="font-semibold mb-3">Voorbeelden Wedstrijdvoorspellingen</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span>Wedstrijd: <strong>Nederland 2-1 Duitsland</strong></span>
                      <span className="text-muted-foreground">Uitslag</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span>Voorspelling: 2-1</span>
                      <span className="font-bold text-primary">5 punten (exact)</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span>Voorspelling: 3-2</span>
                      <span className="font-bold">2 punten (juist resultaat)</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span>Voorspelling: 1-0</span>
                      <span className="font-bold">2 punten (juist resultaat)</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span>Voorspelling: 0-1</span>
                      <span className="text-muted-foreground">0 punten</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 7: Ranglijst */}
        <section id="ranglijst" className="py-16 scroll-mt-24">
          <div className="container mx-auto px-4">
            <Card className="glass-card max-w-4xl mx-auto">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-primary text-sm font-semibold">Sectie 7</span>
                    <CardTitle className="text-2xl">Ranglijst & Statistieken</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  Volg je voortgang en vergelijk jezelf met andere deelnemers in je poule.
                </p>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <h4 className="font-semibold mb-2">Live Ranglijst</h4>
                    <p className="text-sm text-muted-foreground">
                      Bekijk de actuele stand in je poule. De ranglijst wordt automatisch bijgewerkt na elke wedstrijd.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <h4 className="font-semibold mb-2">Persoonlijke Statistieken</h4>
                    <p className="text-sm text-muted-foreground">
                      Zie hoeveel exacte scores je hebt, je gemiddelde punten per wedstrijd, en je beste prestaties.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <h4 className="font-semibold mb-2">Meerdere Poules</h4>
                    <p className="text-sm text-muted-foreground">
                      Neem je deel aan meerdere poules? Je punten en ranking worden per poule apart bijgehouden.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 8: Beheer */}
        <section id="beheer" className="py-16 bg-secondary/30 scroll-mt-24">
          <div className="container mx-auto px-4">
            <Card className="glass-card max-w-4xl mx-auto">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-primary text-sm font-semibold">Sectie 8</span>
                    <CardTitle className="text-2xl">Poule Beheren (voor Eigenaren)</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  Als eigenaar van een poule heb je extra mogelijkheden om je poule te beheren.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Leden bekijken</p>
                      <p className="text-sm text-muted-foreground">Zie alle deelnemers, hun punten en betalingsstatus</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Leden verwijderen</p>
                      <p className="text-sm text-muted-foreground">Verwijder indien nodig deelnemers uit je poule</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Uitnodigingslink delen</p>
                      <p className="text-sm text-muted-foreground">Deel je QR-code of link via sociale media</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Poule verwijderen</p>
                      <p className="text-sm text-muted-foreground">Sluit en verwijder je poule permanent</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Settings className="w-5 h-5" />
                    <span className="font-semibold">Poule Beheer</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ga naar <strong>Poule Beheer</strong> in het hoofdmenu om al je poules te beheren.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 9: Notificaties */}
        <section id="notificaties" className="py-16 scroll-mt-24">
          <div className="container mx-auto px-4">
            <Card className="glass-card max-w-4xl mx-auto">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-primary text-sm font-semibold">Sectie 9</span>
                    <CardTitle className="text-2xl">Notificaties</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  Mis nooit meer een wedstrijd met onze slimme notificaties.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <h4 className="font-semibold mb-2">⏰ Wedstrijd Herinnering</h4>
                    <p className="text-sm text-muted-foreground">
                      Ontvang een melding 5 minuten voor de aftrap als je nog geen voorspelling hebt gedaan.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <h4 className="font-semibold mb-2">📊 Score Updates</h4>
                    <p className="text-sm text-muted-foreground">
                      Word geïnformeerd wanneer wedstrijden zijn afgelopen en je punten zijn bijgewerkt.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-secondary border border-border">
                  <h4 className="font-semibold mb-3">Notificaties Beheren</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Je kunt notificaties in- en uitschakelen via je browserinstellingen of in de app-instellingen.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Let op:</strong> Zorg dat je browsernotificaties toestaat voor de beste ervaring.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 10: FAQ */}
        <section id="faq" className="py-16 bg-secondary/30 scroll-mt-24">
          <div className="container mx-auto px-4">
            <Card className="glass-card max-w-4xl mx-auto">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-primary text-sm font-semibold">Sectie 10</span>
                    <CardTitle className="text-2xl">Veelgestelde Vragen (FAQ)</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Card className="glass-card max-w-4xl mx-auto text-center p-8">
              <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="font-display text-3xl font-bold mb-4">
                Klaar om te beginnen?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Start nu je eigen WK 2026 poule en nodig je vrienden uit. In minder dan 2 minuten ben je klaar!
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="hero" size="lg" onClick={() => window.location.href = "/auth"}>
                  Start Gratis
                </Button>
                <Button variant="outline" size="lg" onClick={() => window.location.href = "/matches"}>
                  Bekijk Wedstrijden
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
          aria-label="Scroll naar boven"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      <Footer />
    </div>
  );
};

export default Guide;
