import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Hoe maak ik een poule aan?",
    answer:
      "Na registratie kun je direct een poule aanmaken. Kies een naam, stel optioneel een inlegbedrag in, en deel de uitnodigingslink of QR-code met je vrienden. Het duurt letterlijk minder dan een minuut!",
  },
  {
    question: "Is het gratis om mee te doen?",
    answer:
      "Ja! Je kunt gratis een poule aanmaken met tot 10 deelnemers. Voor grotere poules of extra features zoals AI voorspellingen en Stripe betalingen kun je upgraden naar Pro.",
  },
  {
    question: "Hoe werkt het puntensysteem?",
    answer:
      "Je verdient punten voor correcte voorspellingen: 3 punten voor de exacte uitslag, 1 punt voor de juiste winnaar/gelijkspel. Bonuspunten zijn te verdienen met topscorer- en toernooiwinnaar-voorspellingen.",
  },
  {
    question: "Kan ik meerdere poules tegelijk spelen?",
    answer:
      "Absoluut! Je kunt lid zijn van zoveel poules als je wilt. Ideaal als je wilt meedoen met collega's, vrienden én familie. Elke poule heeft z'n eigen ranglijst en prijzenpot.",
  },
  {
    question: "Hoe veilig zijn de betalingen?",
    answer:
      "Alle betalingen worden verwerkt via Stripe, de industriestandaard voor online betalingen. We slaan nooit creditcardgegevens op en alle transacties zijn versleuteld met SSL.",
  },
  {
    question: "Kan ik voorspellingen wijzigen?",
    answer:
      "Je kunt voorspellingen aanpassen tot de wedstrijd begint. Zodra de aftrap is geweest, worden voorspellingen vergrendeld. Dit zorgt voor eerlijke competitie.",
  },
  {
    question: "Wat gebeurt er met de prijzenpot?",
    answer:
      "De organisator bepaalt de verdeling (bijv. 60/30/10 voor top 3). Na afloop van het toernooi wordt de pot automatisch berekend en kunnen winnaars worden uitbetaald.",
  },
  {
    question: "Werkt de app ook op mobiel?",
    answer:
      "Ja, de app is volledig responsive en werkt perfect op telefoon, tablet en desktop. Je krijgt zelfs push notificaties voor wedstrijdupdates als je die aanzet!",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">
            FAQ
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-6">
            Veelgestelde vragen
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Alles wat je wilt weten over onze WK poule app.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="glass-card rounded-xl px-6 border-border/50 data-[state=open]:border-primary/30 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <HelpCircle className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold">{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pl-12 pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Still have questions */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            Nog vragen? We helpen je graag!
          </p>
          <a
            href="mailto:support@poulemeister.nl"
            className="text-primary hover:underline font-medium"
          >
            support@poulemeister.nl
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
