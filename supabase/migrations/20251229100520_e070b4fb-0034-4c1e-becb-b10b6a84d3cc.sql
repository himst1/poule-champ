-- Verwijder de oude onveilige policies voor wk_players
DROP POLICY IF EXISTS "Authenticated users can insert wk_players" ON wk_players;
DROP POLICY IF EXISTS "Authenticated users can update wk_players" ON wk_players;
DROP POLICY IF EXISTS "Authenticated users can delete wk_players" ON wk_players;

-- Maak nieuwe admin-only policies voor wk_players
CREATE POLICY "Admins can insert wk_players" 
ON wk_players FOR INSERT 
TO authenticated 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update wk_players" 
ON wk_players FOR UPDATE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete wk_players" 
ON wk_players FOR DELETE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Voeg admin-only policies toe voor matches
CREATE POLICY "Admins can insert matches" 
ON matches FOR INSERT 
TO authenticated 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update matches" 
ON matches FOR UPDATE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete matches" 
ON matches FOR DELETE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));