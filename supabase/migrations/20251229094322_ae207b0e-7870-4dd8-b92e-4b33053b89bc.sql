-- Add image_url column to wk_players table for player photos
ALTER TABLE public.wk_players ADD COLUMN IF NOT EXISTS image_url TEXT;