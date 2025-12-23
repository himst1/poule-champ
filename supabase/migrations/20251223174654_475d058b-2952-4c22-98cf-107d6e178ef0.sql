-- Drop existing foreign key constraint if exists
ALTER TABLE public.topscorer_predictions 
DROP CONSTRAINT IF EXISTS topscorer_predictions_player_id_fkey;

-- Add new foreign key constraint to wk_players
ALTER TABLE public.topscorer_predictions 
ADD CONSTRAINT topscorer_predictions_player_id_fkey 
FOREIGN KEY (player_id) REFERENCES public.wk_players(id) ON DELETE CASCADE;