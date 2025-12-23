import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, X, Clock, Users, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

interface Poule {
  id: string;
  name: string;
  description: string | null;
  entry_fee: number;
  max_members: number;
  approval_status: "pending" | "approved" | "rejected";
  status: "open" | "closed" | "finished";
  created_at: string;
  creator_id: string;
  profiles?: { display_name: string | null; email: string | null };
  member_count?: number;
}

const AdminPouleApproval = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; pouleId: string | null }>({
    open: false,
    pouleId: null,
  });

  const { data: poules, isLoading } = useQuery({
    queryKey: ["admin-poules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poules")
        .select(`
          *,
          profiles:creator_id (display_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get member counts
      const pouleIds = data.map((p) => p.id);
      const { data: memberCounts } = await supabase
        .from("poule_members")
        .select("poule_id")
        .in("poule_id", pouleIds);

      const countMap = memberCounts?.reduce((acc, m) => {
        acc[m.poule_id] = (acc[m.poule_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return data.map((p) => ({
        ...p,
        member_count: countMap[p.id] || 0,
      })) as Poule[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (pouleId: string) => {
      const { error } = await supabase
        .from("poules")
        .update({ approval_status: "approved", status: "open" })
        .eq("id", pouleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-poules"] });
      toast.success("Poule goedgekeurd");
    },
    onError: (error) => {
      toast.error("Fout: " + error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (pouleId: string) => {
      const { error } = await supabase
        .from("poules")
        .update({ approval_status: "rejected" })
        .eq("id", pouleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-poules"] });
      toast.success("Poule afgewezen");
      setRejectDialog({ open: false, pouleId: null });
    },
    onError: (error) => {
      toast.error("Fout: " + error.message);
    },
  });

  const filteredPoules = poules?.filter(
    (poule) =>
      poule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poule.profiles?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poule.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = poules?.filter((p) => p.approval_status === "pending").length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />In afwachting</Badge>;
      case "approved":
        return <Badge className="gap-1 bg-primary/20 text-primary border-primary/30"><Check className="w-3 h-3" />Goedgekeurd</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><X className="w-3 h-3" />Afgewezen</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">In afwachting</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {poules?.filter((p) => p.approval_status === "approved").length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Goedgekeurd</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <X className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {poules?.filter((p) => p.approval_status === "rejected").length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Afgewezen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Zoek poule of maker..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Poule</TableHead>
                <TableHead>Maker</TableHead>
                <TableHead>Inschrijfgeld</TableHead>
                <TableHead className="text-center">Leden</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aangemaakt</TableHead>
                <TableHead className="w-[150px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredPoules?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Geen poules gevonden
                  </TableCell>
                </TableRow>
              ) : (
                filteredPoules?.map((poule) => (
                  <TableRow key={poule.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{poule.name}</p>
                        {poule.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {poule.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{poule.profiles?.display_name || "Onbekend"}</p>
                        <p className="text-sm text-muted-foreground">{poule.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {poule.entry_fee === 0 ? (
                        <span className="text-muted-foreground">Gratis</span>
                      ) : (
                        <span className="font-medium">€{poule.entry_fee}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {poule.member_count}/{poule.max_members}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(poule.approval_status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(parseISO(poule.created_at), "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell>
                      {poule.approval_status === "pending" && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => approveMutation.mutate(poule.id)}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="w-4 h-4" />
                            Goedkeuren
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setRejectDialog({ open: true, pouleId: poule.id })}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, pouleId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Poule afwijzen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze poule wilt afwijzen? De maker ontvangt een notificatie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => rejectDialog.pouleId && rejectMutation.mutate(rejectDialog.pouleId)}
            >
              Afwijzen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPouleApproval;
