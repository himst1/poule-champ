import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Brain, TrendingUp, Target, Loader2, Sparkles, AlertTriangle, CheckCircle } from "lucide-react";

interface AIPrediction {
  predicted_home_score: number;
  predicted_away_score: number;
  home_win_probability: number;
  draw_probability: number;
  away_win_probability: number;
  confidence: "Low" | "Medium" | "High";
  key_insights: string[];
}

interface AIPredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeTeam: string;
  awayTeam: string;
  phase: string | null;
  kickoffTime: string;
  onApplyPrediction?: (homeScore: number, awayScore: number) => void;
}

// Flag image component
const FlagImage = ({ teamName }: { teamName: string }) => {
  const COUNTRY_CODES: Record<string, string> = {
    "Verenigde Staten": "us", "VS": "us", "USA": "us",
    "Mexico": "mx", "Canada": "ca",
    "Nederland": "nl", "Duitsland": "de", "Frankrijk": "fr", "Spanje": "es",
    "Engeland": "gb-eng", "Italië": "it", "Portugal": "pt", "België": "be",
    "Kroatië": "hr", "Zwitserland": "ch", "Denemarken": "dk", "Polen": "pl",
    "Servië": "rs", "Oekraïne": "ua", "Oostenrijk": "at", "Tsjechië": "cz",
    "Wales": "gb-wls", "Schotland": "gb-sct", "Zweden": "se", "Noorwegen": "no",
    "Griekenland": "gr", "Turkije": "tr", "Roemenië": "ro", "Hongarije": "hu",
    "Slowakije": "sk", "Slovenië": "si", "Finland": "fi", "Ierland": "ie",
    "Brazilië": "br", "Argentinië": "ar", "Uruguay": "uy", "Colombia": "co",
    "Chili": "cl", "Ecuador": "ec", "Peru": "pe", "Paraguay": "py",
    "Venezuela": "ve", "Bolivia": "bo",
    "Marokko": "ma", "Senegal": "sn", "Ghana": "gh", "Kameroen": "cm",
    "Nigeria": "ng", "Tunesië": "tn", "Egypte": "eg", "Algerije": "dz",
    "Zuid-Afrika": "za", "Ivoorkust": "ci", "Mali": "ml",
    "Japan": "jp", "Zuid-Korea": "kr", "Australië": "au", "Saoedi-Arabië": "sa",
    "Iran": "ir", "Qatar": "qa", "China": "cn", "Indonesië": "id",
    "Bahrein": "bh", "Irak": "iq", "VAE": "ae", "Oman": "om", "Jordanië": "jo",
    "Oezbekistan": "uz", "Thailand": "th", "Vietnam": "vn", "India": "in",
    "Costa Rica": "cr", "Jamaica": "jm", "Honduras": "hn", "Panama": "pa",
    "El Salvador": "sv", "Guatemala": "gt", "Trinidad en Tobago": "tt",
    "Nieuw-Zeeland": "nz",
  };

  const code = COUNTRY_CODES[teamName];
  if (!code) return null;

  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt={teamName}
      className="w-10 h-7 object-cover rounded shadow-sm"
    />
  );
};

export const AIPredictionModal = ({
  isOpen,
  onClose,
  homeTeam,
  awayTeam,
  phase,
  kickoffTime,
  onApplyPrediction,
}: AIPredictionModalProps) => {
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPrediction = async () => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("predict-match", {
        body: { homeTeam, awayTeam, phase, kickoffTime },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.prediction) {
        setPrediction(data.prediction);
      }
    } catch (err: any) {
      console.error("Prediction error:", err);
      setError(err.message || "Er ging iets mis bij het ophalen van de voorspelling");
      toast({
        title: "Fout",
        description: err.message || "Kon geen voorspelling ophalen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (prediction && onApplyPrediction) {
      onApplyPrediction(prediction.predicted_home_score, prediction.predicted_away_score);
      toast({
        title: "Voorspelling toegepast!",
        description: `${homeTeam} ${prediction.predicted_home_score} - ${prediction.predicted_away_score} ${awayTeam}`,
      });
      onClose();
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "High":
        return "text-green-500 bg-green-500/10";
      case "Medium":
        return "text-yellow-500 bg-yellow-500/10";
      default:
        return "text-red-500 bg-red-500/10";
    }
  };

  const getConfidenceLabel = (confidence: string) => {
    switch (confidence) {
      case "High":
        return "Hoog";
      case "Medium":
        return "Gemiddeld";
      default:
        return "Laag";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI Wedstrijdvoorspelling
          </DialogTitle>
          <DialogDescription>
            Gebaseerd op historische WK data en team statistieken
          </DialogDescription>
        </DialogHeader>

        {/* Match Info */}
        <div className="flex items-center justify-center gap-4 py-4 bg-secondary/30 rounded-lg">
          <div className="flex items-center gap-2">
            <FlagImage teamName={homeTeam} />
            <span className="font-semibold">{homeTeam}</span>
          </div>
          <span className="text-muted-foreground text-lg font-bold">vs</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{awayTeam}</span>
            <FlagImage teamName={awayTeam} />
          </div>
        </div>

        {phase && (
          <div className="text-center text-sm text-muted-foreground">
            {phase}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative">
              <Brain className="w-12 h-12 text-primary animate-pulse" />
              <Sparkles className="w-4 h-4 text-accent absolute -top-1 -right-1 animate-bounce" />
            </div>
            <div className="text-center">
              <p className="font-medium">AI analyseert de wedstrijd...</p>
              <p className="text-sm text-muted-foreground">
                Historische data en team statistieken worden verwerkt
              </p>
            </div>
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center gap-4 py-6">
            <AlertTriangle className="w-10 h-10 text-destructive" />
            <p className="text-destructive text-center">{error}</p>
            <Button onClick={fetchPrediction} variant="outline">
              Opnieuw proberen
            </Button>
          </div>
        )}

        {/* Prediction Result */}
        {prediction && !isLoading && (
          <div className="space-y-4">
            {/* Score Prediction */}
            <div className="text-center py-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                Voorspelde uitslag
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <FlagImage teamName={homeTeam} />
                  <p className="text-sm mt-1">{homeTeam}</p>
                </div>
                <div className="flex items-center gap-2 px-4">
                  <span className="text-4xl font-bold text-primary">
                    {prediction.predicted_home_score}
                  </span>
                  <span className="text-2xl text-muted-foreground">-</span>
                  <span className="text-4xl font-bold text-primary">
                    {prediction.predicted_away_score}
                  </span>
                </div>
                <div className="text-center">
                  <FlagImage teamName={awayTeam} />
                  <p className="text-sm mt-1">{awayTeam}</p>
                </div>
              </div>
            </div>

            {/* Probabilities */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-3 bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {prediction.home_win_probability}%
                </p>
                <p className="text-xs text-muted-foreground">Winst {homeTeam}</p>
              </div>
              <div className="text-center p-3 bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold">
                  {prediction.draw_probability}%
                </p>
                <p className="text-xs text-muted-foreground">Gelijkspel</p>
              </div>
              <div className="text-center p-3 bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold text-accent">
                  {prediction.away_win_probability}%
                </p>
                <p className="text-xs text-muted-foreground">Winst {awayTeam}</p>
              </div>
            </div>

            {/* Confidence */}
            <div className="flex items-center justify-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Betrouwbaarheid:</span>
              <span className={`px-2 py-0.5 rounded text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                {getConfidenceLabel(prediction.confidence)}
              </span>
            </div>

            {/* Key Insights */}
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Belangrijkste inzichten
              </p>
              <ul className="space-y-1">
                {prediction.key_insights.map((insight, index) => (
                  <li
                    key={index}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <CheckCircle className="w-3 h-3 text-primary mt-1 flex-shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            {/* Apply Button */}
            {onApplyPrediction && (
              <Button onClick={handleApply} className="w-full" variant="hero">
                <Sparkles className="w-4 h-4 mr-2" />
                Gebruik deze voorspelling
              </Button>
            )}
          </div>
        )}

        {/* Initial State - Fetch Button */}
        {!prediction && !isLoading && !error && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="text-center">
              <p className="text-muted-foreground">
                Laat AI een voorspelling maken op basis van historische WK data,
                ELO ratings en recente prestaties.
              </p>
            </div>
            <Button onClick={fetchPrediction} variant="hero" size="lg">
              <Brain className="w-5 h-5 mr-2" />
              Genereer AI Voorspelling
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
