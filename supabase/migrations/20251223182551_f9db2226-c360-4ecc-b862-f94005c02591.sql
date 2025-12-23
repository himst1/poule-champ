-- Add approval_status enum type
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Add approval_status column to poules table
ALTER TABLE public.poules 
ADD COLUMN approval_status approval_status NOT NULL DEFAULT 'pending';

-- Update existing poules to be approved
UPDATE public.poules SET approval_status = 'approved';

-- Create winner_predictions table for WK winner predictions
CREATE TABLE public.winner_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  poule_id UUID NOT NULL REFERENCES public.poules(id) ON DELETE CASCADE,
  country TEXT NOT NULL,
  country_flag TEXT,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, poule_id)
);

-- Enable RLS on winner_predictions
ALTER TABLE public.winner_predictions ENABLE ROW LEVEL SECURITY;

-- RLS policies for winner_predictions
CREATE POLICY "Members can view predictions in their poules"
ON public.winner_predictions
FOR SELECT
USING (is_poule_member(auth.uid(), poule_id) OR is_poule_creator(auth.uid(), poule_id));

CREATE POLICY "Users can create their own predictions"
ON public.winner_predictions
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_poule_member(auth.uid(), poule_id));

CREATE POLICY "Users can update their own predictions"
ON public.winner_predictions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own predictions"
ON public.winner_predictions
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at on winner_predictions
CREATE TRIGGER update_winner_predictions_updated_at
BEFORE UPDATE ON public.winner_predictions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create global_settings table for admin settings
CREATE TABLE public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on global_settings
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for global_settings - admins can manage, everyone can read
CREATE POLICY "Anyone can view global settings"
ON public.global_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert global settings"
ON public.global_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update global settings"
ON public.global_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete global settings"
ON public.global_settings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at on global_settings
CREATE TRIGGER update_global_settings_updated_at
BEFORE UPDATE ON public.global_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default scoring settings
INSERT INTO public.global_settings (setting_key, setting_value)
VALUES (
  'default_scoring_rules',
  '{
    "correct_score": 5,
    "correct_result": 2,
    "topscorer_correct": 10,
    "topscorer_in_top3": 3,
    "wk_winner_correct": 15,
    "wk_winner_finalist": 5,
    "extra_time_counts": false
  }'::jsonb
);

-- Add admin-only policy for updating poule approval status
CREATE POLICY "Admins can update any poule"
ON public.poules
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));