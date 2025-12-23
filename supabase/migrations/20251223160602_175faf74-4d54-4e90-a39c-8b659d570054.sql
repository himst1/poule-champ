-- Create wk_players table for manual player entry
CREATE TABLE public.wk_players (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    country text NOT NULL,
    country_flag text,
    position text NOT NULL CHECK (position IN ('Keeper', 'Verdediger', 'Middenvelder', 'Aanvaller')),
    age integer NOT NULL CHECK (age > 0 AND age < 100),
    international_caps integer NOT NULL DEFAULT 0 CHECK (international_caps >= 0),
    goals integer NOT NULL DEFAULT 0 CHECK (goals >= 0),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on wk_players
ALTER TABLE public.wk_players ENABLE ROW LEVEL SECURITY;

-- RLS policies for wk_players
CREATE POLICY "Anyone can view wk_players"
ON public.wk_players
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert wk_players"
ON public.wk_players
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update wk_players"
ON public.wk_players
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete wk_players"
ON public.wk_players
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_wk_players_updated_at
BEFORE UPDATE ON public.wk_players
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();