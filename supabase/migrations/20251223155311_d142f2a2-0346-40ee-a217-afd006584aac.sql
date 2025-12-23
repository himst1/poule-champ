-- Create app_role enum for admin functionality
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for admin access control
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create players table
CREATE TABLE public.players (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    country text NOT NULL,
    country_flag text,
    position text NOT NULL CHECK (position IN ('Keeper', 'Verdediger', 'Middenvelder', 'Aanvaller')),
    date_of_birth date,
    goals integer NOT NULL DEFAULT 0,
    club text,
    jersey_number integer,
    image_url text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on players
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- RLS policies for players
CREATE POLICY "Anyone can view players"
ON public.players
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert players"
ON public.players
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update players"
ON public.players
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete players"
ON public.players
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create topscorer_predictions table
CREATE TABLE public.topscorer_predictions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    poule_id uuid NOT NULL REFERENCES public.poules(id) ON DELETE CASCADE,
    player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    points_earned integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, poule_id)
);

-- Enable RLS on topscorer_predictions
ALTER TABLE public.topscorer_predictions ENABLE ROW LEVEL SECURITY;

-- RLS policies for topscorer_predictions
CREATE POLICY "Poule members can view predictions"
ON public.topscorer_predictions
FOR SELECT
USING (is_poule_member(auth.uid(), poule_id) OR is_poule_creator(auth.uid(), poule_id));

CREATE POLICY "Users can create their own predictions"
ON public.topscorer_predictions
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_poule_member(auth.uid(), poule_id));

CREATE POLICY "Users can update their own predictions"
ON public.topscorer_predictions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own predictions"
ON public.topscorer_predictions
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at on players
CREATE TRIGGER update_players_updated_at
BEFORE UPDATE ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for updated_at on topscorer_predictions
CREATE TRIGGER update_topscorer_predictions_updated_at
BEFORE UPDATE ON public.topscorer_predictions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();