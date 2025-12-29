import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Edit, Trash2, Goal, Search, Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FlagImage } from "@/components/FlagImage";

interface Player {
  id: string;
  name: string;
  country: string;
  position: string;
  date_of_birth: string | null;
  goals: number;
  club: string | null;
  jersey_number: number | null;
}

interface PlayerFormData {
  name: string;
  country: string;
  position: string;
  date_of_birth: string;
  goals: number;
  club: string;
  jersey_number: number | null;
}

const emptyFormData: PlayerFormData = {
  name: "",
  country: "",
  position: "Aanvaller",
  date_of_birth: "",
  goals: 0,
  club: "",
  jersey_number: null,
};

const AdminPlayers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState<PlayerFormData>(emptyFormData);

  // Check if user is admin
  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: players, isLoading } = useQuery({
    queryKey: ["admin-players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("country")
        .order("name");
      if (error) throw error;
      return data as Player[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PlayerFormData) => {
      const { error } = await supabase.from("players").insert({
        name: data.name,
        country: data.country,
        position: data.position,
        date_of_birth: data.date_of_birth || null,
        goals: data.goals,
        club: data.club || null,
        jersey_number: data.jersey_number,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-players"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
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
        .from("players")
        .update({
          name: data.name,
          country: data.country,
          position: data.position,
          date_of_birth: data.date_of_birth || null,
          goals: data.goals,
          club: data.club || null,
          jersey_number: data.jersey_number,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-players"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
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
      const { error } = await supabase.from("players").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-players"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
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

  const handleOpenEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      country: player.country,
      position: player.position,
      date_of_birth: player.date_of_birth || "",
      goals: player.goals,
      club: player.club || "",
      jersey_number: player.jersey_number,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlayer) {
      updateMutation.mutate({ id: editingPlayer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredPlayers = players?.filter(
    (player) =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (player.club?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Niet ingelogd</AlertTitle>
            <AlertDescription>
              Je moet ingelogd zijn om deze pagina te bekijken.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertTitle>Geen toegang</AlertTitle>
            <AlertDescription>
              Je hebt geen admin rechten om deze pagina te bekijken.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold font-display mb-2">
                Spelers Beheer
              </h1>
              <p className="text-muted-foreground">
                Beheer alle WK spelers
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
                    {editingPlayer ? "Speler bewerken" : "Nieuwe speler"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name">Naam *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Land *</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                        placeholder="Nederland"
                        required
                      />
                    </div>
                    <div>
                      <Label>Vlag preview</Label>
                      <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/50">
                        <FlagImage teamName={formData.country} size="sm" />
                        <span className="text-sm text-muted-foreground">
                          {formData.country ? `Vlag voor ${formData.country}` : "Selecteer een land"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="position">Positie *</Label>
                      <Select
                        value={formData.position}
                        onValueChange={(value) =>
                          setFormData({ ...formData, position: value })
                        }
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
                      <Label htmlFor="jersey_number">Rugnummer</Label>
                      <Input
                        id="jersey_number"
                        type="number"
                        value={formData.jersey_number ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            jersey_number: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="date_of_birth">Geboortedatum</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) =>
                          setFormData({ ...formData, date_of_birth: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="goals">Doelpunten</Label>
                      <Input
                        id="goals"
                        type="number"
                        min="0"
                        value={formData.goals}
                        onChange={(e) =>
                          setFormData({ ...formData, goals: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="club">Club</Label>
                      <Input
                        id="club"
                        value={formData.club}
                        onChange={(e) =>
                          setFormData({ ...formData, club: e.target.value })
                        }
                        placeholder="FC Barcelona"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Annuleren
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingPlayer ? "Opslaan" : "Toevoegen"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoek speler, land of club..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Players Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Speler</TableHead>
                    <TableHead>Land</TableHead>
                    <TableHead>Positie</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead className="text-center">Goals</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredPlayers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Geen spelers gevonden
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlayers?.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {player.jersey_number && (
                              <span className="text-xs font-bold text-primary">
                                #{player.jersey_number}
                              </span>
                            )}
                            <span className="font-medium">{player.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FlagImage teamName={player.country} size="sm" />
                            {player.country}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{player.position}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {player.club || "-"}
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
                              onClick={() => {
                                if (confirm("Weet je zeker dat je deze speler wilt verwijderen?")) {
                                  deleteMutation.mutate(player.id);
                                }
                              }}
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
      </main>

      <Footer />
    </div>
  );
};

export default AdminPlayers;