import { useState } from "react";
import { Users, Settings, Crown, Trophy, ArrowLeft, Plus, Trash2, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import InviteQRCode from "@/components/InviteQRCode";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type PouleWithDetails = {
  id: string;
  name: string;
  description: string | null;
  entry_fee: number;
  max_members: number | null;
  status: "open" | "closed" | "finished";
  invite_code: string | null;
  creator_id: string;
  member_count: number;
  user_points: number;
  user_rank: number | null;
  is_owner: boolean;
};

type PouleMembers = {
  id: string;
  user_id: string;
  points: number;
  rank: number | null;
  joined_at: string;
  profile: {
    display_name: string | null;
    email: string | null;
  } | null;
};

const PouleManagement = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("my-poules");
  const [selectedPoule, setSelectedPoule] = useState<string | null>(null);

  // Fetch poules where user is owner
  const { data: ownedPoules, isLoading: loadingOwned } = useQuery({
    queryKey: ["owned-poules", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: poules, error } = await supabase
        .from("poules")
        .select("*")
        .eq("creator_id", user.id);

      if (error) throw error;

      // Get member counts
      const pouleIds = poules?.map((p) => p.id) || [];
      if (pouleIds.length === 0) return [];

      const { data: memberCounts } = await supabase
        .from("poule_members")
        .select("poule_id")
        .in("poule_id", pouleIds);

      const countMap: Record<string, number> = {};
      memberCounts?.forEach((m) => {
        countMap[m.poule_id] = (countMap[m.poule_id] || 0) + 1;
      });

      return poules?.map((p) => ({
        ...p,
        member_count: countMap[p.id] || 0,
        is_owner: true,
        user_points: 0,
        user_rank: null,
      })) as PouleWithDetails[];
    },
    enabled: !!user,
  });

  // Fetch poules where user is a member (but not owner)
  const { data: memberPoules, isLoading: loadingMember } = useQuery({
    queryKey: ["member-poules", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: memberships, error } = await supabase
        .from("poule_members")
        .select(
          `
          poule_id,
          points,
          rank,
          poules (*)
        `
        )
        .eq("user_id", user.id);

      if (error) throw error;

      const filtered = memberships?.filter(
        (m) => (m.poules as any)?.creator_id !== user.id
      );

      // Get member counts
      const pouleIds = filtered?.map((m) => m.poule_id) || [];
      if (pouleIds.length === 0) return [];

      const { data: memberCounts } = await supabase
        .from("poule_members")
        .select("poule_id")
        .in("poule_id", pouleIds);

      const countMap: Record<string, number> = {};
      memberCounts?.forEach((m) => {
        countMap[m.poule_id] = (countMap[m.poule_id] || 0) + 1;
      });

      return filtered?.map((m) => ({
        ...(m.poules as any),
        member_count: countMap[m.poule_id] || 1,
        user_points: m.points,
        user_rank: m.rank,
        is_owner: false,
      })) as PouleWithDetails[];
    },
    enabled: !!user,
  });

  // Fetch members for selected poule
  const { data: pouleMembers, isLoading: loadingMembers } = useQuery({
    queryKey: ["poule-members", selectedPoule],
    queryFn: async () => {
      if (!selectedPoule) return [];

      const { data, error } = await supabase
        .from("poule_members")
        .select(
          `
          id,
          user_id,
          points,
          rank,
          joined_at,
          profiles (display_name, email)
        `
        )
        .eq("poule_id", selectedPoule)
        .order("rank", { ascending: true, nullsFirst: false });

      if (error) throw error;

      return data?.map((m) => ({
        ...m,
        profile: m.profiles as any,
      })) as PouleMembers[];
    },
    enabled: !!selectedPoule,
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({
      memberId,
      userId,
    }: {
      memberId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from("poule_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Lid verwijderd",
        description: "Het lid is succesvol verwijderd uit de poule",
      });
      queryClient.invalidateQueries({ queryKey: ["poule-members", selectedPoule] });
      queryClient.invalidateQueries({ queryKey: ["owned-poules"] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Kon lid niet verwijderen",
        variant: "destructive",
      });
    },
  });

  // Leave poule mutation
  const leavePouleMutation = useMutation({
    mutationFn: async (pouleId: string) => {
      const { error } = await supabase
        .from("poule_members")
        .delete()
        .eq("poule_id", pouleId)
        .eq("user_id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Poule verlaten",
        description: "Je bent niet langer lid van deze poule",
      });
      queryClient.invalidateQueries({ queryKey: ["member-poules"] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Kon poule niet verlaten",
        variant: "destructive",
      });
    },
  });

  // Delete poule mutation
  const deletePouleMutation = useMutation({
    mutationFn: async (pouleId: string) => {
      const { error } = await supabase.from("poules").delete().eq("id", pouleId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Poule verwijderd",
        description: "De poule is succesvol verwijderd",
      });
      setSelectedPoule(null);
      queryClient.invalidateQueries({ queryKey: ["owned-poules"] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Kon poule niet verwijderen",
        variant: "destructive",
      });
    },
  });

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Gekopieerd!",
      description: "De uitnodigingscode is gekopieerd naar je klembord",
    });
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">
              Log in om je poules te beheren
            </h1>
            <p className="text-muted-foreground mb-6">
              Je moet ingelogd zijn om je poules te beheren.
            </p>
            <Button variant="hero" onClick={() => navigate("/auth")}>
              Inloggen / Registreren
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const selectedPouleData =
    ownedPoules?.find((p) => p.id === selectedPoule) ||
    memberPoules?.find((p) => p.id === selectedPoule);
  const isOwner = selectedPouleData?.is_owner;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (selectedPoule ? setSelectedPoule(null) : navigate("/dashboard"))}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold">
                {selectedPoule ? selectedPouleData?.name : "Poule Beheer"}
              </h1>
              <p className="text-muted-foreground">
                {selectedPoule
                  ? isOwner
                    ? "Beheer je poule en leden"
                    : "Bekijk je deelname"
                  : "Beheer je poules en bekijk waar je meespeelt"}
              </p>
            </div>
          </div>

          {selectedPoule ? (
            // Poule Detail View
            <div className="space-y-6">
              {/* Poule Info Card */}
              <Card className="glass-card rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                      {isOwner ? (
                        <Crown className="w-7 h-7 text-primary" />
                      ) : (
                        <Users className="w-7 h-7 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isOwner
                              ? "bg-primary/20 text-primary"
                              : "bg-accent/20 text-accent"
                          }`}
                        >
                          {isOwner ? "Eigenaar" : "Deelnemer"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            selectedPouleData?.status === "open"
                              ? "bg-primary/20 text-primary"
                              : selectedPouleData?.status === "closed"
                              ? "bg-accent/20 text-accent"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {selectedPouleData?.status === "open"
                            ? "Open"
                            : selectedPouleData?.status === "closed"
                            ? "Bezig"
                            : "Afgelopen"}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">
                        {selectedPouleData?.member_count} deelnemers •{" "}
                        {selectedPouleData?.entry_fee === 0
                          ? "Gratis"
                          : `€${selectedPouleData?.entry_fee}`}
                      </p>
                    </div>
                  </div>

                  {isOwner && selectedPouleData?.invite_code && (
                    <InviteQRCode 
                      inviteCode={selectedPouleData.invite_code} 
                      pouleName={selectedPouleData.name}
                    />
                  )}
                </div>
              </Card>

              {/* Stats */}
              {!isOwner && (
                <div className="grid grid-cols-2 gap-4">
                  <Card className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-display font-bold">
                          {selectedPouleData?.user_rank
                            ? `#${selectedPouleData.user_rank}`
                            : "-"}
                        </p>
                        <p className="text-sm text-muted-foreground">Jouw Plek</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-2xl font-display font-bold">
                          {selectedPouleData?.user_points || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Punten</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Members List (for owners) */}
              {isOwner && (
                <Card className="glass-card rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-display font-semibold text-lg">Leden</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {loadingMembers ? (
                      <div className="p-8 text-center text-muted-foreground">
                        Laden...
                      </div>
                    ) : pouleMembers && pouleMembers.length > 0 ? (
                      pouleMembers.map((member, index) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                              {member.rank || index + 1}
                            </div>
                            <div>
                              <p className="font-medium">
                                {member.profile?.display_name || "Onbekend"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {member.points} punten
                              </p>
                            </div>
                          </div>
                          {member.user_id !== user?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Lid verwijderen?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Weet je zeker dat je{" "}
                                    {member.profile?.display_name || "dit lid"} wilt
                                    verwijderen uit de poule?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      removeMemberMutation.mutate({
                                        memberId: member.id,
                                        userId: member.user_id,
                                      })
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Verwijderen
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        Nog geen leden
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/poule/${selectedPoule}`)}
                >
                  Bekijk Poule Details
                </Button>
                {isOwner ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="flex-1 gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Poule Verwijderen
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Poule verwijderen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Dit verwijdert de poule en alle bijbehorende gegevens
                          permanent. Dit kan niet ongedaan worden gemaakt.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuleren</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePouleMutation.mutate(selectedPoule)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Verwijderen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="flex-1 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                        <UserMinus className="w-4 h-4" />
                        Poule Verlaten
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Poule verlaten?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Weet je zeker dat je deze poule wilt verlaten? Je
                          voorspellingen en punten gaan verloren.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuleren</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => leavePouleMutation.mutate(selectedPoule)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Verlaten
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ) : (
            // Poule List View
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="my-poules" className="gap-2">
                  <Crown className="w-4 h-4" />
                  Mijn Poules ({ownedPoules?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="participating" className="gap-2">
                  <Users className="w-4 h-4" />
                  Deelnames ({memberPoules?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my-poules" className="space-y-4">
                <div className="flex justify-end mb-4">
                  <Button variant="hero" onClick={() => navigate("/create-poule")}>
                    <Plus className="w-4 h-4" />
                    Nieuwe Poule
                  </Button>
                </div>

                {loadingOwned ? (
                  <div className="grid gap-4">
                    {[...Array(2)].map((_, i) => (
                      <Card key={i} className="p-6 animate-pulse bg-card">
                        <div className="h-20 bg-muted rounded" />
                      </Card>
                    ))}
                  </div>
                ) : ownedPoules && ownedPoules.length > 0 ? (
                  <div className="grid gap-4">
                    {ownedPoules.map((poule) => (
                      <Card
                        key={poule.id}
                        className="glass-card rounded-2xl p-6 hover:border-primary/50 transition-all cursor-pointer"
                        onClick={() => setSelectedPoule(poule.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                              <Crown className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-display font-bold text-lg">
                                {poule.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {poule.member_count} leden •{" "}
                                {poule.entry_fee === 0
                                  ? "Gratis"
                                  : `€${poule.entry_fee}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                poule.status === "open"
                                  ? "bg-primary/20 text-primary"
                                  : poule.status === "closed"
                                  ? "bg-accent/20 text-accent"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {poule.status === "open"
                                ? "Open"
                                : poule.status === "closed"
                                ? "Bezig"
                                : "Afgelopen"}
                            </span>
                            <Settings className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="glass-card rounded-2xl p-12 text-center">
                    <Crown className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      Je hebt nog geen poules aangemaakt
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Maak je eerste poule aan en nodig vrienden uit
                    </p>
                    <Button variant="hero" onClick={() => navigate("/create-poule")}>
                      <Plus className="w-4 h-4" />
                      Maak je eerste poule
                    </Button>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="participating" className="space-y-4">
                {loadingMember ? (
                  <div className="grid gap-4">
                    {[...Array(2)].map((_, i) => (
                      <Card key={i} className="p-6 animate-pulse bg-card">
                        <div className="h-20 bg-muted rounded" />
                      </Card>
                    ))}
                  </div>
                ) : memberPoules && memberPoules.length > 0 ? (
                  <div className="grid gap-4">
                    {memberPoules.map((poule) => (
                      <Card
                        key={poule.id}
                        className="glass-card rounded-2xl p-6 hover:border-primary/50 transition-all cursor-pointer"
                        onClick={() => setSelectedPoule(poule.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                              <Users className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                              <h3 className="font-display font-bold text-lg">
                                {poule.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {poule.member_count} leden •{" "}
                                {poule.entry_fee === 0
                                  ? "Gratis"
                                  : `€${poule.entry_fee}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-display font-bold">
                                {poule.user_rank ? `#${poule.user_rank}` : "-"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {poule.user_points} punten
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                poule.status === "open"
                                  ? "bg-primary/20 text-primary"
                                  : poule.status === "closed"
                                  ? "bg-accent/20 text-accent"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {poule.status === "open"
                                ? "Open"
                                : poule.status === "closed"
                                ? "Bezig"
                                : "Afgelopen"}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="glass-card rounded-2xl p-12 text-center">
                    <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      Je speelt nog nergens mee
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Vraag een uitnodigingscode aan een vriend of maak zelf een
                      poule aan
                    </p>
                    <Button variant="outline" onClick={() => navigate("/dashboard")}>
                      Naar Dashboard
                    </Button>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PouleManagement;
