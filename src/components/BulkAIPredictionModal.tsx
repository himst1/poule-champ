import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Brain, Loader2, Sparkles, CheckCircle, XCircle, Play, Pause, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FlagImage } from "@/components/FlagImage";

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  phase: string | null;
  kickoff_time: string;
}

interface PredictionResult {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  predicted_home_score: number;
  predicted_away_score: number;
  confidence: string;
  status: "success" | "error";
  error?: string;
}

interface BulkAIPredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  onApplyPredictions?: (predictions: { matchId: string; homeScore: number; awayScore: number }[]) => void;
}

export const BulkAIPredictionModal = ({
  isOpen,
  onClose,
  matches,
  onApplyPredictions,
}: BulkAIPredictionModalProps) => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const { toast } = useToast();

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchSinglePrediction = async (match: Match): Promise<PredictionResult> => {
    try {
      const { data, error } = await supabase.functions.invoke("predict-match", {
        body: {
          homeTeam: match.home_team,
          awayTeam: match.away_team,
          phase: match.phase,
          kickoffTime: match.kickoff_time,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      return {
        matchId: match.id,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        predicted_home_score: data.prediction.predicted_home_score,
        predicted_away_score: data.prediction.predicted_away_score,
        confidence: data.prediction.confidence,
        status: "success",
      };
    } catch (err: any) {
      return {
        matchId: match.id,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        predicted_home_score: 0,
        predicted_away_score: 0,
        confidence: "Low",
        status: "error",
        error: err.message || "Onbekende fout",
      };
    }
  };

  const startBulkPrediction = useCallback(async () => {
    setIsRunning(true);
    setIsPaused(false);
    const controller = new AbortController();
    setAbortController(controller);

    const startFrom = currentIndex;
    
    for (let i = startFrom; i < matches.length; i++) {
      if (controller.signal.aborted) break;

      setCurrentIndex(i);
      
      const result = await fetchSinglePrediction(matches[i]);
      
      setPredictions(prev => {
        const existing = prev.findIndex(p => p.matchId === result.matchId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = result;
          return updated;
        }
        return [...prev, result];
      });

      // Add delay between requests to avoid rate limiting (1.5 seconds)
      if (i < matches.length - 1 && !controller.signal.aborted) {
        await delay(1500);
      }
    }

    setIsRunning(false);
    setAbortController(null);
  }, [matches, currentIndex]);

  const pausePrediction = () => {
    setIsPaused(true);
    setIsRunning(false);
    abortController?.abort();
  };

  const resetPredictions = () => {
    setPredictions([]);
    setCurrentIndex(0);
    setIsRunning(false);
    setIsPaused(false);
    abortController?.abort();
  };

  const handleApplyAll = () => {
    if (!onApplyPredictions) return;

    const successfulPredictions = predictions
      .filter(p => p.status === "success")
      .map(p => ({
        matchId: p.matchId,
        homeScore: p.predicted_home_score,
        awayScore: p.predicted_away_score,
      }));

    onApplyPredictions(successfulPredictions);
    
    toast({
      title: "Voorspellingen toegepast!",
      description: `${successfulPredictions.length} wedstrijden bijgewerkt`,
    });
    
    onClose();
  };

  const successCount = predictions.filter(p => p.status === "success").length;
  const errorCount = predictions.filter(p => p.status === "error").length;
  const progress = matches.length > 0 ? (predictions.length / matches.length) * 100 : 0;

  const handleClose = () => {
    abortController?.abort();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Bulk AI Voorspellingen
          </DialogTitle>
          <DialogDescription>
            Laat AI alle {matches.length} wedstrijden analyseren en voorspellen
          </DialogDescription>
        </DialogHeader>

        {/* Progress Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Voortgang: {predictions.length} / {matches.length}
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-green-500">
                <CheckCircle className="w-4 h-4" />
                {successCount}
              </span>
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <XCircle className="w-4 h-4" />
                  {errorCount}
                </span>
              )}
            </div>
          </div>
          
          <Progress value={progress} className="h-2" />

          {/* Control Buttons */}
          <div className="flex gap-2">
            {!isRunning && predictions.length === 0 && (
              <Button onClick={startBulkPrediction} variant="hero" className="flex-1">
                <Sparkles className="w-4 h-4 mr-2" />
                Start AI Analyse
              </Button>
            )}
            
            {isRunning && (
              <Button onClick={pausePrediction} variant="outline" className="flex-1">
                <Pause className="w-4 h-4 mr-2" />
                Pauzeren
              </Button>
            )}
            
            {isPaused && predictions.length < matches.length && (
              <Button onClick={startBulkPrediction} variant="default" className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Hervatten
              </Button>
            )}
            
            {predictions.length > 0 && !isRunning && (
              <Button onClick={resetPredictions} variant="outline" size="icon">
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Current Match Being Processed */}
          {isRunning && currentIndex < matches.length && (
            <div className="flex items-center justify-center gap-3 py-3 bg-primary/5 rounded-lg border border-primary/20">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <div className="flex items-center gap-2">
                <FlagImage teamName={matches[currentIndex].home_team} />
                <span className="text-sm font-medium">{matches[currentIndex].home_team}</span>
                <span className="text-muted-foreground">vs</span>
                <span className="text-sm font-medium">{matches[currentIndex].away_team}</span>
                <FlagImage teamName={matches[currentIndex].away_team} />
              </div>
            </div>
          )}
        </div>

        {/* Results List */}
        {predictions.length > 0 && (
          <ScrollArea className="flex-1 min-h-0 max-h-[300px] border rounded-lg">
            <div className="p-2 space-y-1">
              {predictions.map((pred) => (
                <div
                  key={pred.matchId}
                  className={`flex items-center justify-between p-2 rounded text-sm ${
                    pred.status === "success" 
                      ? "bg-green-500/5 border border-green-500/20" 
                      : "bg-destructive/5 border border-destructive/20"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FlagImage teamName={pred.homeTeam} />
                    <span className="truncate">{pred.homeTeam}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="truncate">{pred.awayTeam}</span>
                    <FlagImage teamName={pred.awayTeam} />
                  </div>
                  
                  {pred.status === "success" ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-primary">
                        {pred.predicted_home_score} - {pred.predicted_away_score}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        pred.confidence === "High" 
                          ? "bg-green-500/20 text-green-600" 
                          : pred.confidence === "Medium"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-red-500/20 text-red-600"
                      }`}>
                        {pred.confidence === "High" ? "Hoog" : pred.confidence === "Medium" ? "Gem" : "Laag"}
                      </span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-destructive truncate max-w-[100px]">
                        {pred.error}
                      </span>
                      <XCircle className="w-4 h-4 text-destructive" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Apply All Button */}
        {successCount > 0 && !isRunning && onApplyPredictions && (
          <Button onClick={handleApplyAll} variant="hero" className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Pas {successCount} voorspellingen toe
          </Button>
        )}

        {/* Info Text */}
        {predictions.length === 0 && !isRunning && (
          <p className="text-xs text-muted-foreground text-center">
            Er wordt 1.5 seconde gewacht tussen elke analyse om rate limiting te voorkomen.
            Dit kan enkele minuten duren voor alle wedstrijden.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
