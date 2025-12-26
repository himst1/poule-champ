import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, Users, Trophy, Settings, Loader2, ArrowLeft, Medal, BarChart3 } from "lucide-react";
import AdminPouleApproval from "@/components/admin/AdminPouleApproval";
import AdminMatchesTab from "@/components/admin/AdminMatchesTab";
import AdminWKPlayers from "@/components/admin/AdminWKPlayers";
import AdminGlobalSettings from "@/components/admin/AdminGlobalSettings";
import AdminWKResults from "@/components/admin/AdminWKResults";
import AdminAnalytics from "@/components/admin/AdminAnalytics";

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertTitle>Niet ingelogd</AlertTitle>
            <AlertDescription>Je moet ingelogd zijn om deze pagina te bekijken.</AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
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
            <AlertDescription>Je hebt geen admin rechten.</AlertDescription>
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
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Beheer poules, wedstrijden, spelers en instellingen</p>
        </div>

        <Tabs defaultValue="poules" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="poules" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Poules</span>
            </TabsTrigger>
            <TabsTrigger value="matches" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Wedstrijden</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <Medal className="w-4 h-4" />
              <span className="hidden sm:inline">WK Resultaten</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="players" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Spelers</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Instellingen</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="poules">
            <AdminPouleApproval />
          </TabsContent>
          <TabsContent value="matches">
            <AdminMatchesTab />
          </TabsContent>
          <TabsContent value="results">
            <AdminWKResults />
          </TabsContent>
          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>
          <TabsContent value="players">
            <AdminWKPlayers />
          </TabsContent>
          <TabsContent value="settings">
            <AdminGlobalSettings />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
