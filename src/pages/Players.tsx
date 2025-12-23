import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, Goal, Shield, Shirt, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Player {
  id: string;
  name: string;
  country: string;
  country_flag: string | null;
  position: string;
  date_of_birth: string | null;
  goals: number;
  club: string | null;
  jersey_number: number | null;
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

const calculateAge = (dateOfBirth: string | null): number | null => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const PlayerCard = ({ player }: { player: Player }) => {
  const age = calculateAge(player.date_of_birth);
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl shrink-0">
            {player.country_flag || "⚽"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {player.jersey_number && (
                <span className="text-xs font-bold text-primary">#{player.jersey_number}</span>
              )}
              <h3 className="font-semibold text-foreground truncate">{player.name}</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={positionColor(player.position)}>
                {positionIcon(player.position)}
                <span className="ml-1">{player.position}</span>
              </Badge>
              {age && (
                <span className="text-xs text-muted-foreground">{age} jaar</span>
              )}
            </div>
            {player.club && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{player.club}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-primary font-bold">
              <Goal className="w-4 h-4" />
              <span>{player.goals}</span>
            </div>
            <span className="text-xs text-muted-foreground">goals</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Players = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");

  const { data: players, isLoading } = useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("goals", { ascending: false });
      
      if (error) throw error;
      return data as Player[];
    },
  });

  // Get unique countries
  const countries = players 
    ? [...new Set(players.map(p => p.country))].sort()
    : [];

  // Filter players
  const filteredPlayers = players?.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (player.club?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCountry = selectedCountry === "all" || player.country === selectedCountry;
    return matchesSearch && matchesCountry;
  });

  // Group players by country
  const playersByCountry = filteredPlayers?.reduce((acc, player) => {
    if (!acc[player.country]) {
      acc[player.country] = [];
    }
    acc[player.country].push(player);
    return acc;
  }, {} as Record<string, Player[]>) || {};

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold font-display mb-2">
              WK Spelers
            </h1>
            <p className="text-muted-foreground">
              Overzicht van alle spelers per land met statistieken
            </p>
          </div>

          {/* Search and Stats */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Zoek speler, land of club..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
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

          {/* Country Tabs */}
          <Tabs value={selectedCountry} onValueChange={setSelectedCountry} className="w-full">
            <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-transparent p-0 mb-6">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Alle landen
              </TabsTrigger>
              {countries.map((country) => {
                const countryPlayers = players?.filter(p => p.country === country) || [];
                const flag = countryPlayers[0]?.country_flag || "";
                return (
                  <TabsTrigger 
                    key={country} 
                    value={country}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {flag} {country}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={selectedCountry} className="mt-0">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {countryPlayers.map((player) => (
                          <PlayerCard key={player.id} player={player} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlayers?.map((player) => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              )}

              {!isLoading && (!filteredPlayers || filteredPlayers.length === 0) && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Geen spelers gevonden</h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? "Probeer een andere zoekterm"
                        : "Er zijn nog geen spelers toegevoegd"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Players;