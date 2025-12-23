import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Users, Goal, Shield, Shirt, User, Plus, Trash2, FileJson, LayoutGrid, List, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { z } from "zod";

// WK 2026 landen met vlaggen
const WK_2026_COUNTRIES = [
  { name: "Argentinië", flag: "🇦🇷" },
  { name: "Australië", flag: "🇦🇺" },
  { name: "België", flag: "🇧🇪" },
  { name: "Brazilië", flag: "🇧🇷" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Chili", flag: "🇨🇱" },
  { name: "Colombia", flag: "🇨🇴" },
  { name: "Costa Rica", flag: "🇨🇷" },
  { name: "Denemarken", flag: "🇩🇰" },
  { name: "Duitsland", flag: "🇩🇪" },
  { name: "Ecuador", flag: "🇪🇨" },
  { name: "Engeland", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Frankrijk", flag: "🇫🇷" },
  { name: "Ghana", flag: "🇬🇭" },
  { name: "Iran", flag: "🇮🇷" },
  { name: "Italië", flag: "🇮🇹" },
  { name: "Japan", flag: "🇯🇵" },
  { name: "Kameroen", flag: "🇨🇲" },
  { name: "Kroatië", flag: "🇭🇷" },
  { name: "Marokko", flag: "🇲🇦" },
  { name: "Mexico", flag: "🇲🇽" },
  { name: "Nederland", flag: "🇳🇱" },
  { name: "Nigeria", flag: "🇳🇬" },
  { name: "Oekraïne", flag: "🇺🇦" },
  { name: "Paraguay", flag: "🇵🇾" },
  { name: "Peru", flag: "🇵🇪" },
  { name: "Polen", flag: "🇵🇱" },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "Qatar", flag: "🇶🇦" },
  { name: "Saoedi-Arabië", flag: "🇸🇦" },
  { name: "Senegal", flag: "🇸🇳" },
  { name: "Servië", flag: "🇷🇸" },
  { name: "Spanje", flag: "🇪🇸" },
  { name: "Tunesië", flag: "🇹🇳" },
  { name: "Turkije", flag: "🇹🇷" },
  { name: "Uruguay", flag: "🇺🇾" },
  { name: "Verenigde Staten", flag: "🇺🇸" },
  { name: "Wales", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { name: "Zuid-Korea", flag: "🇰🇷" },
  { name: "Zweden", flag: "🇸🇪" },
  { name: "Zwitserland", flag: "🇨🇭" },
];

// Land code mapping voor bulk import
const COUNTRY_CODE_MAP: Record<string, string> = {
  "AR": "Argentinië", "AU": "Australië", "BE": "België", "BR": "Brazilië",
  "CA": "Canada", "CL": "Chili", "CO": "Colombia", "CR": "Costa Rica",
  "DK": "Denemarken", "DE": "Duitsland", "EC": "Ecuador", "EN": "Engeland",
  "FR": "Frankrijk", "GH": "Ghana", "IR": "Iran", "IT": "Italië",
  "JP": "Japan", "CM": "Kameroen", "HR": "Kroatië", "MA": "Marokko",
  "MX": "Mexico", "NL": "Nederland", "NG": "Nigeria", "UA": "Oekraïne",
  "PY": "Paraguay", "PE": "Peru", "PL": "Polen", "PT": "Portugal",
  "QA": "Qatar", "SA": "Saoedi-Arabië", "SN": "Senegal", "RS": "Servië",
  "ES": "Spanje", "TN": "Tunesië", "TR": "Turkije", "UY": "Uruguay",
  "US": "Verenigde Staten", "WA": "Wales", "KR": "Zuid-Korea", "SE": "Zweden",
  "CH": "Zwitserland",
};

// Bulk import schema
const bulkPlayerSchema = z.object({
  land: z.string().min(2).max(50),
  naam: z.string().min(2).max(100),
  leeftijd: z.number().int().min(15).max(50),
  positie: z.enum(["Keeper", "Verdediger", "Middenvelder", "Aanvaller"]),
  interlands: z.number().int().min(0).max(300),
  doelpunten: z.number().int().min(0).max(200),
});

// Validation schema
const playerSchema = z.object({
  name: z.string().trim().min(2, "Naam moet minimaal 2 karakters zijn").max(100, "Naam mag maximaal 100 karakters zijn"),
  country: z.string().min(1, "Selecteer een land"),
  position: z.enum(["Keeper", "Verdediger", "Middenvelder", "Aanvaller"], { required_error: "Selecteer een positie" }),
  age: z.number().int().min(15, "Leeftijd moet minimaal 15 zijn").max(50, "Leeftijd mag maximaal 50 zijn"),
  international_caps: z.number().int().min(0, "Interlands kan niet negatief zijn").max(300, "Maximum 300 interlands"),
  goals: z.number().int().min(0, "Doelpunten kan niet negatief zijn").max(200, "Maximum 200 doelpunten"),
});

interface WKPlayer {
  id: string;
  name: string;
  country: string;
  country_flag: string | null;
  position: string;
  age: number;
  international_caps: number;
  goals: number;
}

const positionIcon = (position: string) => {
  switch (position) {
    case "Keeper":
      return <Shield className="w-4 h-4" />;
    case "Verdediger":
      return <Shield className="w-4 h-4" />;
    case "Middenvelder":
      return <Shirt className="w-4 h-4" />;
    case "Aanvaller":
      return <Goal className="w-4 h-4" />;
    default:
      return <User className="w-4 h-4" />;
  }
};

const positionColor = (position: string) => {
  switch (position) {
    case "Keeper":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "Verdediger":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "Middenvelder":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "Aanvaller":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    default:
      return "bg-secondary text-muted-foreground";
  }
};

const PlayerCard = ({ player, onDelete }: { player: WKPlayer; onDelete?: () => void }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl shrink-0">
            {player.country_flag || "⚽"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{player.name}</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={positionColor(player.position)}>
                {positionIcon(player.position)}
                <span className="ml-1">{player.position}</span>
              </Badge>
              <span className="text-xs text-muted-foreground">{player.age} jaar</span>
              <span className="text-xs text-muted-foreground">{player.international_caps} caps</span>
            </div>
          </div>
          <div className="text-right shrink-0 flex items-center gap-2">
            <div>
              <div className="flex items-center gap-1 text-primary font-bold">
                <Goal className="w-4 h-4" />
                <span>{player.goals}</span>
              </div>
              <span className="text-xs text-muted-foreground">goals</span>
            </div>
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PlayerRow = ({ player, onDelete }: { player: WKPlayer; onDelete?: () => void }) => {
  return (
    <div className="flex items-center gap-3 p-3 border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors">
      <span className="text-xl w-8 text-center shrink-0">{player.country_flag || "⚽"}</span>
      <span className="font-medium flex-1 min-w-0 truncate">{player.name}</span>
      <Badge variant="outline" className={`${positionColor(player.position)} shrink-0`}>
        {positionIcon(player.position)}
        <span className="ml-1 hidden sm:inline">{player.position}</span>
      </Badge>
      <span className="text-sm text-muted-foreground w-16 text-center shrink-0 hidden md:block">{player.age} jr</span>
      <span className="text-sm text-muted-foreground w-16 text-center shrink-0 hidden lg:block">{player.international_caps} caps</span>
      <div className="flex items-center gap-1 text-primary font-bold w-12 shrink-0 justify-end">
        <Goal className="w-4 h-4" />
        {player.goals}
      </div>
      {onDelete && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onDelete} 
          className="text-destructive hover:text-destructive shrink-0 h-8 w-8"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

const Players = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [sortBy, setSortBy] = useState<"name" | "age" | "goals" | "international_caps">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 20;
  
  const [bulkJsonInput, setBulkJsonInput] = useState("");
  const [bulkImportError, setBulkImportError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    position: "",
    age: "",
    international_caps: "",
    goals: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: players, isLoading } = useQuery({
    queryKey: ["wk-players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wk_players")
        .select("*")
        .order("country")
        .order("name");
      
      if (error) throw error;
      return data as WKPlayer[];
    },
  });

  const addPlayerMutation = useMutation({
    mutationFn: async (playerData: z.infer<typeof playerSchema>) => {
      const countryInfo = WK_2026_COUNTRIES.find(c => c.name === playerData.country);
      const { error } = await supabase.from("wk_players").insert({
        name: playerData.name,
        country: playerData.country,
        country_flag: countryInfo?.flag || null,
        position: playerData.position,
        age: playerData.age,
        international_caps: playerData.international_caps,
        goals: playerData.goals,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wk-players"] });
      toast.success("Speler toegevoegd!");
      setFormData({
        name: "",
        country: "",
        position: "",
        age: "",
        international_caps: "",
        goals: "",
      });
      setFormErrors({});
    },
    onError: (error) => {
      toast.error("Fout bij toevoegen: " + error.message);
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wk_players").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wk-players"] });
      toast.success("Speler verwijderd");
    },
    onError: (error) => {
      toast.error("Fout bij verwijderen: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = playerSchema.safeParse({
      name: formData.name,
      country: formData.country,
      position: formData.position,
      age: formData.age ? parseInt(formData.age) : 0,
      international_caps: formData.international_caps ? parseInt(formData.international_caps) : 0,
      goals: formData.goals ? parseInt(formData.goals) : 0,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    addPlayerMutation.mutate(result.data);
  };

  // Bulk import handler
  const handleBulkImport = async () => {
    setBulkImportError("");
    setIsImporting(true);

    try {
      // Parse JSON
      let parsedData: unknown[];
      try {
        parsedData = JSON.parse(bulkJsonInput);
      } catch {
        throw new Error("Ongeldige JSON. Controleer de syntax.");
      }

      if (!Array.isArray(parsedData)) {
        throw new Error("Data moet een array zijn.");
      }

      if (parsedData.length === 0) {
        throw new Error("Array is leeg.");
      }

      if (parsedData.length > 100) {
        throw new Error("Maximum 100 spelers per keer.");
      }

      // Validate and transform each player
      const playersToInsert: Array<{
        name: string;
        country: string;
        country_flag: string | null;
        position: string;
        age: number;
        international_caps: number;
        goals: number;
      }> = [];

      const errors: string[] = [];

      parsedData.forEach((item, index) => {
        const result = bulkPlayerSchema.safeParse(item);
        if (!result.success) {
          errors.push(`Rij ${index + 1}: ${result.error.errors.map(e => e.message).join(", ")}`);
          return;
        }

        const data = result.data;
        
        // Map country code to full name
        let countryName = COUNTRY_CODE_MAP[data.land.toUpperCase()];
        if (!countryName) {
          // Check if it's already a full country name
          const foundCountry = WK_2026_COUNTRIES.find(
            c => c.name.toLowerCase() === data.land.toLowerCase()
          );
          countryName = foundCountry?.name;
        }

        if (!countryName) {
          errors.push(`Rij ${index + 1}: Onbekend land "${data.land}"`);
          return;
        }

        const countryInfo = WK_2026_COUNTRIES.find(c => c.name === countryName);

        playersToInsert.push({
          name: data.naam,
          country: countryName,
          country_flag: countryInfo?.flag || null,
          position: data.positie,
          age: data.leeftijd,
          international_caps: data.interlands,
          goals: data.doelpunten,
        });
      });

      if (errors.length > 0) {
        throw new Error(`Validatiefouten:\n${errors.slice(0, 5).join("\n")}${errors.length > 5 ? `\n...en ${errors.length - 5} meer` : ""}`);
      }

      // Insert all players
      const { error: insertError } = await supabase
        .from("wk_players")
        .insert(playersToInsert);

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["wk-players"] });
      toast.success(`${playersToInsert.length} spelers succesvol geïmporteerd!`);
      setBulkJsonInput("");
      
    } catch (error) {
      const message = error instanceof Error ? error.message : "Onbekende fout";
      setBulkImportError(message);
    } finally {
      setIsImporting(false);
    }
  };

  // Get unique countries from players
  const countriesWithPlayers = players 
    ? [...new Set(players.map(p => p.country))].sort()
    : [];

  // Filter and sort players
  const filteredPlayers = players?.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = selectedCountry === "all" || player.country === selectedCountry;
    return matchesSearch && matchesCountry;
  }).sort((a, b) => {
    const multiplier = sortOrder === "asc" ? 1 : -1;
    if (sortBy === "name") {
      return multiplier * a.name.localeCompare(b.name);
    }
    return multiplier * (a[sortBy] - b[sortBy]);
  });

  // Pagination
  const totalPages = Math.ceil((filteredPlayers?.length || 0) / playersPerPage);
  const paginatedPlayers = filteredPlayers?.slice(
    (currentPage - 1) * playersPerPage,
    currentPage * playersPerPage
  );

  // Reset page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Group players by country (for "all" view, use paginated players)
  const playersByCountry = paginatedPlayers?.reduce((acc, player) => {
    if (!acc[player.country]) {
      acc[player.country] = [];
    }
    acc[player.country].push(player);
    return acc;
  }, {} as Record<string, WKPlayer[]>) || {};

  const handleSort = (field: "name" | "age" | "goals" | "international_caps") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(field === "name" ? "asc" : "desc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    return sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(pageNum)}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground ml-2">
          {(currentPage - 1) * playersPerPage + 1}-{Math.min(currentPage * playersPerPage, filteredPlayers?.length || 0)} van {filteredPlayers?.length || 0}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold font-display mb-2">
              WK 2026 Spelers
            </h1>
            <p className="text-muted-foreground">
              Voeg spelers toe en bekijk het overzicht per land
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add Player Form */}
            {user && (
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Speler Toevoegen
                    </CardTitle>
                    <CardDescription>
                      Voeg een nieuwe WK speler toe
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="country">Land *</Label>
                        <Select
                          value={formData.country}
                          onValueChange={(value) => setFormData({ ...formData, country: value })}
                        >
                          <SelectTrigger className={formErrors.country ? "border-destructive" : ""}>
                            <SelectValue placeholder="Selecteer een land" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {WK_2026_COUNTRIES.map((country) => (
                              <SelectItem key={country.name} value={country.name}>
                                {country.flag} {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.country && (
                          <p className="text-xs text-destructive">{formErrors.country}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name">Naam speler *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Bijv. Virgil van Dijk"
                          className={formErrors.name ? "border-destructive" : ""}
                        />
                        {formErrors.name && (
                          <p className="text-xs text-destructive">{formErrors.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="age">Leeftijd *</Label>
                        <Input
                          id="age"
                          type="number"
                          min="15"
                          max="50"
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                          placeholder="Bijv. 32"
                          className={formErrors.age ? "border-destructive" : ""}
                        />
                        {formErrors.age && (
                          <p className="text-xs text-destructive">{formErrors.age}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="position">Positie *</Label>
                        <Select
                          value={formData.position}
                          onValueChange={(value) => setFormData({ ...formData, position: value })}
                        >
                          <SelectTrigger className={formErrors.position ? "border-destructive" : ""}>
                            <SelectValue placeholder="Selecteer positie" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Keeper">Keeper</SelectItem>
                            <SelectItem value="Verdediger">Verdediger</SelectItem>
                            <SelectItem value="Middenvelder">Middenvelder</SelectItem>
                            <SelectItem value="Aanvaller">Aanvaller</SelectItem>
                          </SelectContent>
                        </Select>
                        {formErrors.position && (
                          <p className="text-xs text-destructive">{formErrors.position}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="international_caps">Aantal interlands</Label>
                        <Input
                          id="international_caps"
                          type="number"
                          min="0"
                          max="300"
                          value={formData.international_caps}
                          onChange={(e) => setFormData({ ...formData, international_caps: e.target.value })}
                          placeholder="Bijv. 65"
                          className={formErrors.international_caps ? "border-destructive" : ""}
                        />
                        {formErrors.international_caps && (
                          <p className="text-xs text-destructive">{formErrors.international_caps}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="goals">Aantal doelpunten</Label>
                        <Input
                          id="goals"
                          type="number"
                          min="0"
                          max="200"
                          value={formData.goals}
                          onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                          placeholder="Bijv. 8"
                          className={formErrors.goals ? "border-destructive" : ""}
                        />
                        {formErrors.goals && (
                          <p className="text-xs text-destructive">{formErrors.goals}</p>
                        )}
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={addPlayerMutation.isPending}
                      >
                        {addPlayerMutation.isPending ? "Bezig..." : "Speler toevoegen"}
                      </Button>
                    </form>

                    {/* Bulk Import Section - Always visible */}
                    <div className="mt-6 pt-6 border-t space-y-4">
                      <div className="flex items-center gap-2">
                        <FileJson className="w-5 h-5 text-primary" />
                        <h4 className="font-medium">Bulk Import</h4>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <p className="mb-1">Formaat:</p>
                        <pre className="bg-secondary/50 p-2 rounded text-[10px] overflow-x-auto">
{`[{"land":"BR","naam":"...","leeftijd":25,"positie":"...","interlands":10,"doelpunten":5}]`}
                        </pre>
                      </div>

                      <div className="space-y-2">
                        <Textarea
                          placeholder="Plak hier je JSON data..."
                          value={bulkJsonInput}
                          onChange={(e) => {
                            setBulkJsonInput(e.target.value);
                            setBulkImportError("");
                          }}
                          className="min-h-[120px] font-mono text-xs"
                        />
                        {bulkImportError && (
                          <p className="text-xs text-destructive whitespace-pre-wrap">{bulkImportError}</p>
                        )}
                      </div>

                      <Button 
                        onClick={handleBulkImport}
                        disabled={isImporting || !bulkJsonInput.trim()}
                        className="w-full"
                      >
                        {isImporting ? "Importeren..." : "Importeer Spelers"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Players List */}
            <div className={user ? "lg:col-span-2" : "lg:col-span-3"}>
              {/* Search, View Toggle and Stats */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Zoek speler of land..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "cards" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("cards")}
                    className="h-9 w-9"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className="h-9 w-9"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{players?.length || 0} spelers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Goal className="w-4 h-4" />
                    <span>{players?.reduce((sum, p) => sum + p.goals, 0) || 0} goals</span>
                  </div>
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm text-muted-foreground self-center mr-1">Sorteer op:</span>
                <Button
                  variant={sortBy === "name" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSort("name")}
                  className="h-8 gap-1"
                >
                  Naam <SortIcon field="name" />
                </Button>
                <Button
                  variant={sortBy === "age" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSort("age")}
                  className="h-8 gap-1"
                >
                  Leeftijd <SortIcon field="age" />
                </Button>
                <Button
                  variant={sortBy === "goals" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSort("goals")}
                  className="h-8 gap-1"
                >
                  Goals <SortIcon field="goals" />
                </Button>
                <Button
                  variant={sortBy === "international_caps" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSort("international_caps")}
                  className="h-8 gap-1"
                >
                  Interlands <SortIcon field="international_caps" />
                </Button>
              </div>

              {/* Country Tabs */}
              <Tabs value={selectedCountry} onValueChange={setSelectedCountry} className="w-full">
                <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-transparent p-0 mb-6">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Alle landen ({players?.length || 0})
                  </TabsTrigger>
                  {countriesWithPlayers.map((country) => {
                    const countryPlayers = players?.filter(p => p.country === country) || [];
                    const flag = countryPlayers[0]?.country_flag || "";
                    return (
                      <TabsTrigger 
                        key={country} 
                        value={country}
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        {flag} {country} ({countryPlayers.length})
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <TabsContent value={selectedCountry} className="mt-0">
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <Skeleton className="w-12 h-12 rounded-full" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : selectedCountry === "all" ? (
                    <div className="space-y-8">
                      {Object.entries(playersByCountry).map(([country, countryPlayers]) => (
                        <div key={country}>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">{countryPlayers[0]?.country_flag}</span>
                            <h2 className="text-xl font-semibold">{country}</h2>
                            <Badge variant="secondary">{countryPlayers.length} spelers</Badge>
                          </div>
                          {viewMode === "cards" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {countryPlayers.map((player) => (
                                <PlayerCard 
                                  key={player.id} 
                                  player={player}
                                  onDelete={user ? () => deletePlayerMutation.mutate(player.id) : undefined}
                                />
                              ))}
                            </div>
                          ) : (
                            <Card>
                              <CardContent className="p-0">
                                {countryPlayers.map((player) => (
                                  <PlayerRow 
                                    key={player.id} 
                                    player={player}
                                    onDelete={user ? () => deletePlayerMutation.mutate(player.id) : undefined}
                                  />
                                ))}
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : viewMode === "cards" ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paginatedPlayers?.map((player) => (
                          <PlayerCard 
                            key={player.id} 
                            player={player}
                            onDelete={user ? () => deletePlayerMutation.mutate(player.id) : undefined}
                          />
                        ))}
                      </div>
                      <PaginationControls />
                    </>
                  ) : (
                    <>
                      <Card>
                        <CardContent className="p-0">
                          {paginatedPlayers?.map((player) => (
                            <PlayerRow 
                              key={player.id} 
                              player={player}
                              onDelete={user ? () => deletePlayerMutation.mutate(player.id) : undefined}
                            />
                          ))}
                        </CardContent>
                      </Card>
                      <PaginationControls />
                    </>
                  )}

                  {!isLoading && (!filteredPlayers || filteredPlayers.length === 0) && (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Geen spelers gevonden</h3>
                        <p className="text-muted-foreground">
                          {searchQuery 
                            ? "Probeer een andere zoekterm"
                            : user 
                              ? "Voeg je eerste speler toe via het formulier"
                              : "Log in om spelers toe te voegen"}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Players;