import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Users, CreditCard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const CreatePoule = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    entryFee: 5,
    maxMembers: 50,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Back Button */}
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug
          </button>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  s <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`flex-1 h-1 rounded-full ${
                  s < step ? "bg-primary" : "bg-secondary"
                }`} />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="glass-card rounded-2xl p-6 sm:p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="font-display text-2xl font-bold mb-2">Maak je Poule</h1>
                  <p className="text-muted-foreground">Geef je poule een naam en beschrijving.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Poule Naam *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="bijv. Kantoor Poule 2026"
                      className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Beschrijving</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Vertel iets over je poule..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none resize-none"
                    />
                  </div>
                </div>

                <Button 
                  variant="hero" 
                  className="w-full" 
                  size="lg"
                  onClick={() => setStep(2)}
                  disabled={!formData.name}
                >
                  Volgende
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-gold" />
                  </div>
                  <h1 className="font-display text-2xl font-bold mb-2">Inschrijfgeld</h1>
                  <p className="text-muted-foreground">Stel het inschrijfgeld in voor deelnemers.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Inschrijfgeld (€)</label>
                    <div className="flex gap-3">
                      {[0, 5, 10, 20, 50].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setFormData({ ...formData, entryFee: amount })}
                          className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                            formData.entryFee === amount
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {amount === 0 ? "Gratis" : `€${amount}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Maximum deelnemers</label>
                    <input
                      type="number"
                      name="maxMembers"
                      value={formData.maxMembers}
                      onChange={handleInputChange}
                      min={2}
                      max={500}
                      className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="glass" className="flex-1" size="lg" onClick={() => setStep(1)}>
                    Terug
                  </Button>
                  <Button variant="hero" className="flex-1" size="lg" onClick={() => setStep(3)}>
                    Volgende
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="font-display text-2xl font-bold mb-2">Bevestig je Poule</h1>
                  <p className="text-muted-foreground">Controleer de instellingen en maak je poule aan.</p>
                </div>

                {/* Summary */}
                <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Naam</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inschrijfgeld</span>
                    <span className="font-medium">{formData.entryFee === 0 ? "Gratis" : `€${formData.entryFee}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max deelnemers</span>
                    <span className="font-medium">{formData.maxMembers}</span>
                  </div>
                  {formData.entryFee > 0 && (
                    <div className="flex justify-between pt-3 border-t border-border">
                      <span className="text-muted-foreground">Potentiële pot</span>
                      <span className="font-display font-bold text-primary">€{formData.entryFee * formData.maxMembers}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button variant="glass" className="flex-1" size="lg" onClick={() => setStep(2)}>
                    Terug
                  </Button>
                  <Button variant="gold" className="flex-1" size="lg" onClick={() => navigate("/dashboard")}>
                    <Trophy className="w-5 h-5" />
                    Maak Poule Aan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreatePoule;
