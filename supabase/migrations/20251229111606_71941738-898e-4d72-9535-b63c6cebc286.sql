-- Remove unused flag columns since all flags are now fetched from flagcdn.com via FlagImage component

-- Remove home_flag and away_flag from matches table
ALTER TABLE public.matches DROP COLUMN IF EXISTS home_flag;
ALTER TABLE public.matches DROP COLUMN IF EXISTS away_flag;

-- Remove country_flag from players table
ALTER TABLE public.players DROP COLUMN IF EXISTS country_flag;

-- Remove country_flag from winner_predictions table
ALTER TABLE public.winner_predictions DROP COLUMN IF EXISTS country_flag;

-- Remove country_flag from wk_players table
ALTER TABLE public.wk_players DROP COLUMN IF EXISTS country_flag;