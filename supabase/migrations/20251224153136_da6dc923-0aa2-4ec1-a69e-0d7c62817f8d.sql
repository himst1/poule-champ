-- Create groups table for WK groups
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- e.g., 'A', 'B', 'C', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Anyone can view groups
CREATE POLICY "Anyone can view groups" ON public.groups
  FOR SELECT USING (true);

-- Admins can manage groups
CREATE POLICY "Admins can manage groups" ON public.groups
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create group standings predictions table
CREATE TABLE public.group_standings_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  poule_id UUID NOT NULL REFERENCES public.poules(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL, -- e.g., 'A', 'B', 'C'
  predicted_standings JSONB NOT NULL, -- Array of country codes in predicted order [1st, 2nd, 3rd, 4th]
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, poule_id, group_name)
);

-- Enable RLS
ALTER TABLE public.group_standings_predictions ENABLE ROW LEVEL SECURITY;

-- Members can view predictions in their poules
CREATE POLICY "Members can view group predictions" ON public.group_standings_predictions
  FOR SELECT USING (is_poule_member(auth.uid(), poule_id) OR is_poule_creator(auth.uid(), poule_id));

-- Users can create their own predictions
CREATE POLICY "Users can create group predictions" ON public.group_standings_predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_poule_member(auth.uid(), poule_id));

-- Users can update their own predictions
CREATE POLICY "Users can update group predictions" ON public.group_standings_predictions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own predictions
CREATE POLICY "Users can delete group predictions" ON public.group_standings_predictions
  FOR DELETE USING (auth.uid() = user_id);

-- Add penalty_winner column to predictions table for knockout matches
ALTER TABLE public.predictions
  ADD COLUMN predicted_penalty_winner TEXT; -- 'home' or 'away' - only used when predicting a draw in knockout

-- Add actual_penalty_winner column to matches table
ALTER TABLE public.matches
  ADD COLUMN penalty_winner TEXT; -- 'home' or 'away' - set when match goes to penalties

-- Add is_knockout column to matches table to distinguish knockout matches
ALTER TABLE public.matches
  ADD COLUMN is_knockout BOOLEAN NOT NULL DEFAULT false;

-- Create actual group standings table (to be filled by admin after group stage)
CREATE TABLE public.actual_group_standings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name TEXT NOT NULL UNIQUE,
  standings JSONB NOT NULL, -- Array of country codes in actual order [1st, 2nd, 3rd, 4th]
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.actual_group_standings ENABLE ROW LEVEL SECURITY;

-- Anyone can view actual standings
CREATE POLICY "Anyone can view actual group standings" ON public.actual_group_standings
  FOR SELECT USING (true);

-- Admins can manage actual standings
CREATE POLICY "Admins can manage actual group standings" ON public.actual_group_standings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Update global_settings to include new scoring rules
UPDATE public.global_settings 
SET setting_value = setting_value || 
  '{"group_position_correct": 3, "group_all_correct": 10, "penalty_correct": 3}'::jsonb
WHERE setting_key = 'default_scoring_rules';