import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Users, CreditCard, ChevronRight, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import InviteQRCode from "@/components/InviteQRCode";

const CreatePoule = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [createdPoule, setCreatedPoule] = useState<{ id: string; invite_code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    entryFee: 0,
    maxMembers: 50,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreatePoule = async () => {
    if (!user) {
      toast({
        title: "Niet ingelogd",
        description: "Log in om een poule aan te maken",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsCreating(true);
    try {
      // Create the poule
      const { data: poule, error: pouleError } = await supabase
        .from("poules")
        .insert({
          name: formData.name,
          description: formData.description || null,
          entry_fee: formData.entryFee,
          max_members: formData.maxMembers,
          creator_id: user.id,
        })
        .select()
        .single();

      if (pouleError) throw pouleError;

      // Add creator as member
      const { error: memberError } = await supabase
        .from("poule_members")
        .insert({
          poule_id: poule.id,
          user_id: user.id,
          payment_status: formData.entryFee === 0 ? "succeeded" : "pending",
        });

      if (memberError) throw memberError;

      setCreatedPoule({ id: poule.id, invite_code: poule.invite_code || "" });
      setStep(4); // Success step
      
      toast({
        title: "Poule aangemaakt!",
        description: "Deel de uitnodigingscode met je vrienden",
      });
    } catch (error: any) {
      toast({
        title: "Fout bij aanmaken",
        description: error.message || "Probeer het opnieuw",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyInviteCode = () => {
    if (createdPoule?.invite_code) {
      navigator.clipboard.writeText(createdPoule.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Gekopieerd!",
        description: "Deel deze code met je vrienden",
      });
    }
  };

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Log in om een poule aan te maken</h1>
            <p className="text-muted-foreground mb-6">Je moet ingelogd zijn om een poule te kunnen aanmaken.</p>
            <Button variant="hero" onClick={() => navigate("/auth")}>
              Inloggen / Registreren
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
          {step < 4 && (
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
          )}

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
                  disabled={!formData.name.trim()}
                >
                  Volgende
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-accent" />
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
                  <Button variant="outline" className="flex-1" size="lg" onClick={() => setStep(1)}>
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
                  <Button variant="outline" className="flex-1" size="lg" onClick={() => setStep(2)}>
                    Terug
                  </Button>
                  <Button 
                    variant="hero" 
                    className="flex-1" 
                    size="lg" 
                    onClick={handleCreatePoule}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Aanmaken...
                      </>
                    ) : (
                      <>
                        <Trophy className="w-5 h-5" />
                        Maak Poule Aan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && createdPoule && (
              <div className="space-y-6 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold">Poule Aangemaakt!</h1>
                <p className="text-muted-foreground">
                  Deel de QR-code of uitnodigingscode met je vrienden zodat ze kunnen deelnemen.
                </p>

                {/* QR Code */}
                <div className="flex justify-center">
                  <InviteQRCode 
                    inviteCode={createdPoule.invite_code} 
                    pouleName={formData.name}
                    showButton={false} 
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" size="lg" onClick={() => navigate("/dashboard")}>
                    Naar Dashboard
                  </Button>
                  <Button variant="hero" className="flex-1" size="lg" onClick={() => navigate(`/poule/${createdPoule.id}`)}>
                    Bekijk Poule
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
