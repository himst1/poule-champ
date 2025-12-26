-- Create result audit log table for change history
CREATE TABLE public.result_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'wk_results', 'group_standings', 'match'
  entity_id TEXT NOT NULL,   -- ID or setting_key
  action TEXT NOT NULL,      -- 'created', 'updated', 'locked', 'unlocked', 'finalized'
  old_value JSONB,
  new_value JSONB,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on result_audit_log
ALTER TABLE public.result_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can manage audit logs
CREATE POLICY "Admins can view audit logs"
ON public.result_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert audit logs"
ON public.result_audit_log
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create tournaments table for historical tracking
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,           -- 'WK 2026', 'EK 2028'
  year INTEGER NOT NULL,
  type TEXT DEFAULT 'world_cup',
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on tournaments
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Anyone can view tournaments
CREATE POLICY "Anyone can view tournaments"
ON public.tournaments
FOR SELECT
USING (true);

-- Admins can manage tournaments
CREATE POLICY "Admins can manage tournaments"
ON public.tournaments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create user all-time stats table
CREATE TABLE public.user_all_time_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  total_tournaments INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  correct_scores INTEGER DEFAULT 0,
  correct_results INTEGER DEFAULT 0,
  best_finish INTEGER,           -- Best final position (1, 2, 3...)
  tournament_wins INTEGER DEFAULT 0,
  podium_finishes INTEGER DEFAULT 0,
  avg_points_per_tournament NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_all_time_stats
ALTER TABLE public.user_all_time_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can view all-time stats
CREATE POLICY "Anyone can view all-time stats"
ON public.user_all_time_stats
FOR SELECT
USING (true);

-- Admins can manage all-time stats
CREATE POLICY "Admins can manage all-time stats"
ON public.user_all_time_stats
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add tournament_id to poules for historical tracking
ALTER TABLE public.poules ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES public.tournaments(id);

-- Add status columns to global_settings for result workflow
ALTER TABLE public.global_settings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'locked'));
ALTER TABLE public.global_settings ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE public.global_settings ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id);

-- Add status to actual_group_standings
ALTER TABLE public.actual_group_standings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'locked'));
ALTER TABLE public.actual_group_standings ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE public.actual_group_standings ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id);

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_tournaments_updated_at
BEFORE UPDATE ON public.tournaments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_all_time_stats_updated_at
BEFORE UPDATE ON public.user_all_time_stats
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default tournament for current WK
INSERT INTO public.tournaments (name, year, type, status)
VALUES ('WK 2026', 2026, 'world_cup', 'active')
ON CONFLICT DO NOTHING;