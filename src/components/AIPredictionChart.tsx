import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

interface AIPredictionChartProps {
  pouleId?: string;
}

type PredictionWithMatch = {
  id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points_earned: number | null;
  is_ai_generated: boolean;
  matches: {
    id: string;
    home_score: number | null;
    away_score: number | null;
    status: string;
    kickoff_time: string;
    home_team: string;
    away_team: string;
  } | null;
};

export const AIPredictionChart = ({ pouleId }: AIPredictionChartProps) => {
  const { user } = useAuth();

  // Fetch predictions with match results
  const { data: predictions } = useQuery({
    queryKey: ["ai-prediction-chart", user?.id, pouleId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("predictions")
        .select(`
          id,
          match_id,
          predicted_home_score,
          predicted_away_score,
          points_earned,
          is_ai_generated,
          matches (
            id,
            home_score,
            away_score,
            status,
            kickoff_time,
            home_team,
            away_team
          )
        `)
        .eq("user_id", user.id);
      
      if (pouleId) {
        query = query.eq("poule_id", pouleId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PredictionWithMatch[];
    },
    enabled: !!user,
  });

  const chartData = useMemo(() => {
    if (!predictions) return [];

    // Filter finished matches only and sort by kickoff time
    const finishedPredictions = predictions
      .filter(p => p.matches?.status === "finished" && p.matches?.home_score !== null)
      .sort((a, b) => {
        const dateA = new Date(a.matches!.kickoff_time);
        const dateB = new Date(b.matches!.kickoff_time);
        return dateA.getTime() - dateB.getTime();
      });

    if (finishedPredictions.length === 0) return [];

    // Group by date and calculate cumulative points
    const dateGroups: Record<string, { 
      date: string; 
      aiPoints: number; 
      manualPoints: number;
      aiCount: number;
      manualCount: number;
      cumulativeAI: number;
      cumulativeManual: number;
    }> = {};

    let cumulativeAI = 0;
    let cumulativeManual = 0;

    finishedPredictions.forEach(p => {
      const dateKey = format(parseISO(p.matches!.kickoff_time), "yyyy-MM-dd");
      const displayDate = format(parseISO(p.matches!.kickoff_time), "d MMM", { locale: nl });
      
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = {
          date: displayDate,
          aiPoints: 0,
          manualPoints: 0,
          aiCount: 0,
          manualCount: 0,
          cumulativeAI: 0,
          cumulativeManual: 0,
        };
      }

      const points = p.points_earned || 0;
      
      if (p.is_ai_generated) {
        dateGroups[dateKey].aiPoints += points;
        dateGroups[dateKey].aiCount += 1;
        cumulativeAI += points;
      } else {
        dateGroups[dateKey].manualPoints += points;
        dateGroups[dateKey].manualCount += 1;
        cumulativeManual += points;
      }
      
      dateGroups[dateKey].cumulativeAI = cumulativeAI;
      dateGroups[dateKey].cumulativeManual = cumulativeManual;
    });

    return Object.values(dateGroups);
  }, [predictions]);

  // Check if we have any AI predictions
  const hasAIPredictions = useMemo(() => {
    return predictions?.some(p => p.is_ai_generated && p.matches?.status === "finished");
  }, [predictions]);

  if (!chartData.length || !hasAIPredictions) {
    return null;
  }

  return (
    <Card className="glass-card rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">Punten Over Tijd</h3>
          <p className="text-sm text-muted-foreground">Cumulatieve score AI vs handmatige voorspellingen</p>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorManual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
              formatter={(value: number, name: string) => {
                const label = name === 'cumulativeAI' ? 'AI Voorspellingen' : 'Handmatig';
                return [value + ' pts', label];
              }}
            />
            <Legend 
              formatter={(value) => {
                if (value === 'cumulativeAI') return <span className="text-sm">AI Voorspellingen</span>;
                return <span className="text-sm">Handmatig</span>;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="cumulativeAI" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAI)"
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
            />
            <Area 
              type="monotone" 
              dataKey="cumulativeManual" 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorManual)"
              dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary below chart */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <div>
            <p className="text-sm font-medium">AI Voorspellingen</p>
            <p className="text-xs text-muted-foreground">
              Totaal: {chartData.length > 0 ? chartData[chartData.length - 1].cumulativeAI : 0} punten
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Handmatig</p>
            <p className="text-xs text-muted-foreground">
              Totaal: {chartData.length > 0 ? chartData[chartData.length - 1].cumulativeManual : 0} punten
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
