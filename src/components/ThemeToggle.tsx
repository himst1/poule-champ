import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "light" || (!savedTheme && !prefersDark)) {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    } else {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="w-9 h-9 relative overflow-hidden"
      aria-label={isDark ? "Schakel naar lichte modus" : "Schakel naar donkere modus"}
    >
      <Sun 
        className={`w-5 h-5 absolute transition-all duration-300 ${
          isDark 
            ? "rotate-0 scale-100 opacity-100" 
            : "rotate-90 scale-0 opacity-0"
        }`} 
      />
      <Moon 
        className={`w-5 h-5 absolute transition-all duration-300 ${
          isDark 
            ? "-rotate-90 scale-0 opacity-0" 
            : "rotate-0 scale-100 opacity-100"
        }`} 
      />
    </Button>
  );
};

export default ThemeToggle;
