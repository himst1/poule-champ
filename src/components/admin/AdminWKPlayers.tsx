import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Goal, Search, Loader2, Image, User, Globe, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { FlagImage } from "@/components/FlagImage";
import { fetchAndUpdatePlayerImages } from "@/lib/api/player-images";
interface WKPlayer {
  id: string;
  name: string;
  country: string;
  position: string;
  age: number;
  international_caps: number;
  goals: number;
  image_url: string | null;
}

interface PlayerFormData {
  name: string;
  country: string;
  position: string;
  age: number;
  international_caps: number;
  goals: number;
}

const emptyFormData: PlayerFormData = {
  name: "",
  country: "",
  position: "Aanvaller",
  age: 25,
  international_caps: 0,
  goals: 0,
};

// Common WK countries
const countries = [
  { name: "Nederland", code: "nl" },
  { name: "Duitsland", code: "de" },
  { name: "Frankrijk", code: "fr" },
  { name: "Spanje", code: "es" },
  { name: "Engeland", code: "gb-eng" },
  { name: "Italië", code: "it" },
  { name: "Portugal", code: "pt" },
  { name: "België", code: "be" },
  { name: "Brazilië", code: "br" },
  { name: "Argentinië", code: "ar" },
  { name: "Verenigde Staten", code: "us" },
  { name: "Mexico", code: "mx" },
  { name: "Canada", code: "ca" },
];

const AdminWKPlayers = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<WKPlayer | null>(null);
  const [formData, setFormData] = useState<PlayerFormData>(emptyFormData);
  const [isFetchingImages, setIsFetchingImages] = useState(false);
  const [isFetchingAllMissing, setIsFetchingAllMissing] = useState(false);
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0, found: 0 });
  const [isScrapingFifa, setIsScrapingFifa] = useState(false);
  const [scrapingCountry, setScrapingCountry] = useState<string | null>(null);

  // FIFA supported countries
  const fifaCountries = [
    "België", "Nederland", "Duitsland", "Frankrijk", "Spanje", 
    "Engeland", "Portugal", "Brazilië", "Argentinië"
  ];

  const { data: players, isLoading } = useQuery({
    queryKey: ["admin-wk-players"],
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

  const createMutation = useMutation({
    mutationFn: async (data: PlayerFormData) => {
      const { error } = await supabase.from("wk_players").insert({
        name: data.name,
        country: data.country,
        position: data.position,
        age: data.age,
        international_caps: data.international_caps,
        goals: data.goals,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-wk-players"] });
      queryClient.invalidateQueries({ queryKey: ["wk-players-for-voting"] });
      toast.success("Speler toegevoegd");
      setIsDialogOpen(false);
      setFormData(emptyFormData);
    },
    onError: (error) => {
      toast.error("Fout bij toevoegen: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PlayerFormData }) => {
      const { error } = await supabase
        .from("wk_players")
        .update({
          name: data.name,
          country: data.country,
          position: data.position,
          age: data.age,
          international_caps: data.international_caps,
          goals: data.goals,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-wk-players"] });
      queryClient.invalidateQueries({ queryKey: ["wk-players-for-voting"] });
      toast.success("Speler bijgewerkt");
      setIsDialogOpen(false);
      setEditingPlayer(null);
      setFormData(emptyFormData);
    },
    onError: (error) => {
      toast.error("Fout bij bijwerken: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wk_players").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-wk-players"] });
      queryClient.invalidateQueries({ queryKey: ["wk-players-for-voting"] });
      toast.success("Speler verwijderd");
    },
    onError: (error) => {
      toast.error("Fout bij verwijderen: " + error.message);
    },
  });

  const handleOpenCreate = () => {
    setEditingPlayer(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (player: WKPlayer) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      country: player.country,
      position: player.position,
      age: player.age,
      international_caps: player.international_caps,
      goals: player.goals,
    });
    setIsDialogOpen(true);
  };

  const handleCountrySelect = (country: typeof countries[0]) => {
    setFormData({
      ...formData,
      country: country.name,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlayer) {
      updateMutation.mutate({ id: editingPlayer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredPlayers = players?.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = selectedCountry === "all" || player.country === selectedCountry;
    return matchesSearch && matchesCountry;
  });

  const uniqueCountries = [...new Set(players?.map((p) => p.country) || [])].sort();

  // Filter players for a specific country that don't have images
  const getPlayersWithoutImages = (country: string) => {
    return players?.filter((p) => p.country === country && !p.image_url) || [];
  };

  // Get all players without images
  const getAllPlayersWithoutImages = () => {
    return players?.filter((p) => !p.image_url) || [];
  };

  const totalMissingPhotos = getAllPlayersWithoutImages().length;

  // Handle fetching all missing images
  const handleFetchAllMissingImages = async () => {
    const playersToFetch = getAllPlayersWithoutImages();
    
    if (playersToFetch.length === 0) {
      toast.info("Alle spelers hebben al een foto");
      return;
    }

    setIsFetchingAllMissing(true);
    setFetchProgress({ current: 0, total: playersToFetch.length, found: 0 });

    try {
      // Process in batches of 5 to avoid timeouts
      const batchSize = 5;
      let totalUpdated = 0;
      let totalErrors: string[] = [];

      for (let i = 0; i < playersToFetch.length; i += batchSize) {
        const batch = playersToFetch.slice(i, i + batchSize);
        
        const result = await fetchAndUpdatePlayerImages(
          batch.map((p) => ({
            id: p.id,
            name: p.name,
            country: p.country,
          }))
        );

        if (result.success) {
          totalUpdated += result.updated;
        } else {
          totalErrors = [...totalErrors, ...result.errors];
        }

        // Update progress
        const processed = Math.min(i + batchSize, playersToFetch.length);
        setFetchProgress({ current: processed, total: playersToFetch.length, found: totalUpdated });
      }

      if (totalUpdated > 0) {
        toast.success(`${totalUpdated} foto's succesvol opgehaald`);
        queryClient.invalidateQueries({ queryKey: ["admin-wk-players"] });
        queryClient.invalidateQueries({ queryKey: ["wk-players-for-voting"] });
      }
      
      if (totalErrors.length > 0) {
        toast.error(`${totalErrors.length} fouten: ${totalErrors.slice(0, 3).join(", ")}${totalErrors.length > 3 ? '...' : ''}`);
      }
    } catch (error) {
      console.error("Error fetching all images:", error);
      toast.error("Fout bij ophalen van foto's");
    } finally {
      setIsFetchingAllMissing(false);
      setFetchProgress({ current: 0, total: 0, found: 0 });
    }
  };

  // Handle fetching images for a country
  const handleFetchImagesForCountry = async (country: string) => {
    const playersToFetch = getPlayersWithoutImages(country);
    
    if (playersToFetch.length === 0) {
      toast.info(`Alle spelers van ${country} hebben al een foto`);
      return;
    }

    setIsFetchingImages(true);
    toast.info(`Foto's ophalen voor ${playersToFetch.length} spelers van ${country}...`);

    try {
      const result = await fetchAndUpdatePlayerImages(
        playersToFetch.map((p) => ({
          id: p.id,
          name: p.name,
          country: p.country,
        }))
      );

      if (result.success) {
        toast.success(`${result.updated} foto's opgehaald voor ${country}`);
        queryClient.invalidateQueries({ queryKey: ["admin-wk-players"] });
        queryClient.invalidateQueries({ queryKey: ["wk-players-for-voting"] });
      } else {
        toast.error(`Fout bij ophalen foto's: ${result.errors.join(", ")}`);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      toast.error("Fout bij ophalen van foto's");
    } finally {
      setIsFetchingImages(false);
    }
  };

  // Handle scraping FIFA for players of a specific country
  const handleScrapeFifaPlayers = async (country: string) => {
    setIsScrapingFifa(true);
    setScrapingCountry(country);
    toast.info(`${country} spelers ophalen van FIFA website...`);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-fifa-players', {
        body: { country },
      });

      if (error) {
        console.error('Error scraping FIFA:', error);
        toast.error(`Fout bij scrapen: ${error.message}`);
        return;
      }

      if (data.success) {
        toast.success(`${country}: ${data.newPlayersAdded} nieuwe spelers toegevoegd, ${data.existingPlayersUpdated} bijgewerkt`);
        queryClient.invalidateQueries({ queryKey: ["admin-wk-players"] });
        queryClient.invalidateQueries({ queryKey: ["wk-players-for-voting"] });
      } else {
        toast.error(`Fout: ${data.error}`);
      }
    } catch (error) {
      console.error("Error scraping FIFA:", error);
      toast.error("Fout bij ophalen van spelers");
    } finally {
      setIsScrapingFifa(false);
      setScrapingCountry(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">WK Spelers Beheer</h2>
          <p className="text-muted-foreground">
            {players?.length || 0} spelers uit {uniqueCountries.length} landen
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Button to fetch all missing images */}
          <Button
            variant="outline"
            onClick={handleFetchAllMissingImages}
            disabled={isFetchingAllMissing || isFetchingImages || totalMissingPhotos === 0}
          >
            {isFetchingAllMissing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Bezig...
              </>
            ) : (
              <>
                <ImagePlus className="w-4 h-4 mr-2" />
                Ontbrekende foto's ({totalMissingPhotos})
              </>
            )}
          </Button>

          {/* Dropdown to scrape FIFA for players by country */}
          <Select
            value=""
            onValueChange={(country) => {
              if (country) handleScrapeFifaPlayers(country);
            }}
            disabled={isScrapingFifa}
          >
            <SelectTrigger className="w-[180px]">
              {isScrapingFifa ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {scrapingCountry}...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  FIFA Spelers
                </div>
              )}
            </SelectTrigger>
            <SelectContent>
              {fifaCountries.map((country) => (
                <SelectItem key={country} value={country}>
                  <div className="flex items-center gap-2">
                    <FlagImage teamName={country} size="xs" />
                    {country}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Dropdown for fetching images per country */}
          <Select
            value=""
            onValueChange={(country) => {
              if (country) handleFetchImagesForCountry(country);
            }}
            disabled={isFetchingImages}
          >
            <SelectTrigger className="w-[200px]">
              {isFetchingImages ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Bezig...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Foto's ophalen
                </div>
              )}
            </SelectTrigger>
            <SelectContent>
              {uniqueCountries.map((country) => {
                const missingCount = getPlayersWithoutImages(country).length;
                return (
                  <SelectItem key={country} value={country} disabled={missingCount === 0}>
                    <div className="flex items-center gap-2">
                      <FlagImage teamName={country} size="xs" />
                      {country}
                      {missingCount > 0 && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {missingCount} ontbreekt
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Progress bar during photo fetching */}
      {isFetchingAllMissing && fetchProgress.total > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Foto's ophalen...</span>
                <span className="text-muted-foreground">
                  {fetchProgress.current}/{fetchProgress.total} ({Math.round((fetchProgress.current / fetchProgress.total) * 100)}%)
                </span>
              </div>
              <Progress value={(fetchProgress.current / fetchProgress.total) * 100} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{fetchProgress.found} foto's gevonden</span>
                <span>{fetchProgress.total - fetchProgress.current} resterend</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Zoek speler..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter op land" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle landen</SelectItem>
            {uniqueCountries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Speler toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingPlayer ? "Speler bewerken" : "Nieuwe WK speler"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Naam *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Country quick select */}
                <div className="col-span-2">
                  <Label>Snel land selecteren</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {countries.map((country) => (
                      <Button
                        key={country.name}
                        type="button"
                        variant={formData.country === country.name ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCountrySelect(country)}
                        className="gap-1"
                      >
                        <FlagImage teamName={country.name} size="xs" />
                        {country.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="country">Land *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="position">Positie *</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => setFormData({ ...formData, position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Keeper">Keeper</SelectItem>
                      <SelectItem value="Verdediger">Verdediger</SelectItem>
                      <SelectItem value="Middenvelder">Middenvelder</SelectItem>
                      <SelectItem value="Aanvaller">Aanvaller</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="age">Leeftijd *</Label>
                  <Input
                    id="age"
                    type="number"
                    min="16"
                    max="50"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 25 })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="international_caps">Interlands</Label>
                  <Input
                    id="international_caps"
                    type="number"
                    min="0"
                    value={formData.international_caps}
                    onChange={(e) => setFormData({ ...formData, international_caps: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="goals">Doelpunten (WK)</Label>
                  <Input
                    id="goals"
                    type="number"
                    min="0"
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingPlayer ? "Opslaan" : "Toevoegen"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Foto</TableHead>
                <TableHead>Speler</TableHead>
                <TableHead>Land</TableHead>
                <TableHead>Positie</TableHead>
                <TableHead className="text-center">Leeftijd</TableHead>
                <TableHead className="text-center">Interlands</TableHead>
                <TableHead className="text-center">Goals</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredPlayers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Geen spelers gevonden
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlayers?.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                        {player.image_url ? (
                          <img 
                            src={player.image_url} 
                            alt={player.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FlagImage teamName={player.country} size="xs" />
                        {player.country}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{player.position}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{player.age}</TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {player.international_caps}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-primary font-bold">
                        <Goal className="w-4 h-4" />
                        {player.goals}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(player)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(player.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWKPlayers;
