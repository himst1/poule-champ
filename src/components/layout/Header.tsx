import { Trophy, Menu, X, LogOut, User, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          <a href="/" className="flex items-center gap-2 group shrink-0">
            <div className="relative">
              <Trophy className="w-7 h-7 text-primary transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              Poule<span className="text-primary">Meister</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <a 
              href="/matches" 
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all"
            >
              Wedstrijden
            </a>
            
            {user && (
              <>
                <a 
                  href="/dashboard" 
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all"
                >
                  Dashboard
                </a>
                <a 
                  href="/poule-management" 
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Beheer
                </a>
              </>
            )}

            {/* Info Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all flex items-center gap-1">
                  Info
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem asChild>
                  <a href="#features" className="cursor-pointer">Features</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#how-it-works" className="cursor-pointer">Hoe werkt het</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/handleiding" className="cursor-pointer">Handleiding</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Desktop Right Section */}
          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle />
            
            {loading ? null : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/80 border border-border hover:bg-secondary transition-colors">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium max-w-[120px] truncate">
                      {user.user_metadata?.display_name || user.email?.split("@")[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <a href="/dashboard" className="cursor-pointer flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Mijn Dashboard
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="cursor-pointer flex items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    Uitloggen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                  Inloggen
                </Button>
                <Button variant="default" size="sm" onClick={() => navigate("/auth")}>
                  Start Gratis
                </Button>
              </div>
            )}
          </div>

          {/* Mobile/Tablet Controls */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            <button
              className="p-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Menu sluiten" : "Menu openen"}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile/Tablet Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border/50 animate-fade-in">
            <nav className="flex flex-col gap-1">
              <a 
                href="/matches" 
                className="px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Wedstrijden
              </a>
              {user && (
                <>
                  <a 
                    href="/dashboard" 
                    className="px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </a>
                  <a 
                    href="/poule-management" 
                    className="px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Poule Beheer
                  </a>
                </>
              )}
              
              <div className="h-px bg-border/50 my-2" />
              
              <a 
                href="#features" 
                className="px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                className="px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Hoe werkt het
              </a>
              <a 
                href="/handleiding" 
                className="px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Handleiding
              </a>
              
              <div className="h-px bg-border/50 my-2" />
              
              {user ? (
                <div className="space-y-2 px-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{user.user_metadata?.display_name || user.email?.split("@")[0]}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" 
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Uitloggen
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-2">
                  <Button variant="ghost" className="w-full justify-center" onClick={() => navigate("/auth")}>
                    Inloggen
                  </Button>
                  <Button variant="default" className="w-full justify-center" onClick={() => navigate("/auth")}>
                    Start Gratis
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
