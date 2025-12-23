import { Trophy, Menu, X, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Trophy className="w-8 h-8 text-primary transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              Poule<span className="text-primary">Meister</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="/matches" className="text-muted-foreground hover:text-foreground transition-colors">
              Wedstrijden
            </a>
            {user && (
              <>
                <a href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </a>
                <a href="/poule-management" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Settings className="w-4 h-4" />
                  Poule Beheer
                </a>
              </>
            )}
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              Hoe werkt het
            </a>
            <a href="/handleiding" className="text-muted-foreground hover:text-foreground transition-colors">
              Handleiding
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? null : user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{user.user_metadata?.display_name || user.email?.split("@")[0]}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Uitloggen
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                  Inloggen
                </Button>
                <Button variant="hero" size="sm" onClick={() => navigate("/auth")}>
                  Start Gratis
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <nav className="flex flex-col gap-4">
              <a href="/matches" className="text-muted-foreground hover:text-foreground transition-colors">
                Wedstrijden
              </a>
              {user && (
                <>
                  <a href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                  </a>
                  <a href="/poule-management" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                    <Settings className="w-4 h-4" />
                    Poule Beheer
                  </a>
                </>
              )}
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                Hoe werkt het
              </a>
              <a href="/handleiding" className="text-muted-foreground hover:text-foreground transition-colors">
                Handleiding
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{user.user_metadata?.display_name || user.email?.split("@")[0]}</span>
                    </div>
                    <Button variant="ghost" className="w-full justify-center" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Uitloggen
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="w-full justify-center" onClick={() => navigate("/auth")}>
                      Inloggen
                    </Button>
                    <Button variant="hero" className="w-full justify-center" onClick={() => navigate("/auth")}>
                      Start Gratis
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
