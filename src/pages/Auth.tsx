import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trophy, Mail, Lock, User, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Voer een geldig e-mailadres in");
const passwordSchema = z.string().min(6, "Wachtwoord moet minimaal 6 tekens zijn");
const displayNameSchema = z.string().min(2, "Naam moet minimaal 2 tekens zijn");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate("/matches");
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (!isLogin) {
      const nameResult = displayNameSchema.safeParse(displayName);
      if (!nameResult.success) {
        newErrors.displayName = nameResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login")) {
            toast({
              title: "Inloggen mislukt",
              description: "E-mail of wachtwoord is onjuist",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Fout",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welkom terug!",
            description: "Je bent succesvol ingelogd",
          });
          navigate("/matches");
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account bestaat al",
              description: "Er bestaat al een account met dit e-mailadres",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Fout",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Account aangemaakt!",
            description: "Je kunt nu inloggen en voorspellingen doen",
          });
          navigate("/matches");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md p-8 glass-card">
          {/* Logo */}
          <a href="/" className="flex items-center justify-center gap-2 mb-8">
            <Trophy className="w-10 h-10 text-primary" />
            <span className="font-display font-bold text-2xl">
              Poule<span className="text-primary">Meister</span>
            </span>
          </a>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold mb-2">
              {isLogin ? "Welkom terug!" : "Account aanmaken"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? "Log in om je voorspellingen te beheren"
                : "Maak een account om mee te doen met poules"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Naam</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Jouw naam"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                {errors.displayName && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.displayName}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="jouw@email.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="hero"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? "Inloggen..." : "Account aanmaken..."}
                </>
              ) : (
                isLogin ? "Inloggen" : "Account aanmaken"
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {isLogin ? "Nog geen account?" : "Al een account?"}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="ml-2 text-primary hover:underline font-medium"
              >
                {isLogin ? "Registreren" : "Inloggen"}
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
