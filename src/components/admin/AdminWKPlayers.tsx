import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Edit, Trash2, Goal, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FlagImage } from "@/components/FlagImage";

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

interface PlayerFormData {
  name: string;
  country: string;
  country_flag: string;
  position: string;
  age: number;
  international_caps: number;
  goals: number;
}

const emptyFormData: PlayerFormData = {
  name: "",
  country: "",
  country_flag: "",
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
        country_flag: data.country_flag || null,
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
          country_flag: data.country_flag || null,
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
      country_flag: player.country_flag || "",
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
      country_flag: "", // No longer storing emoji flags
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
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredPlayers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Geen spelers gevonden
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlayers?.map((player) => (
                  <TableRow key={player.id}>
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
