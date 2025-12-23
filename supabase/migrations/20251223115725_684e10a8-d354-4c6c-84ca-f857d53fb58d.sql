-- Create enums for status types
CREATE TYPE public.poule_status AS ENUM ('open', 'closed', 'finished');
CREATE TYPE public.match_status AS ENUM ('pending', 'live', 'finished');
CREATE TYPE public.payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poules table
CREATE TABLE public.poules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  entry_fee DECIMAL(8, 2) NOT NULL DEFAULT 0,
  max_members INT DEFAULT 50,
  prize_distribution JSONB DEFAULT '{"1st": 50, "2nd": 30, "3rd": 20}'::jsonb,
  scoring_rules JSONB DEFAULT '{"correct_result": 2, "correct_score": 5}'::jsonb,
  status poule_status NOT NULL DEFAULT 'open',
  invite_code TEXT UNIQUE DEFAULT substring(gen_random_uuid()::text from 1 for 8),
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poule_members table (join table)
CREATE TABLE public.poule_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poule_id UUID NOT NULL REFERENCES public.poules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  points INT NOT NULL DEFAULT 0,
  rank INT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poule_id, user_id)
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id INT, -- For Sportmonks API sync
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_flag TEXT,
  away_flag TEXT,
  home_score INT,
  away_score INT,
  status match_status NOT NULL DEFAULT 'pending',
  phase TEXT, -- e.g., "Groep A", "Achtste finale"
  kickoff_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create predictions table
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  poule_id UUID NOT NULL REFERENCES public.poules(id) ON DELETE CASCADE,
  predicted_home_score INT NOT NULL,
  predicted_away_score INT NOT NULL,
  points_earned INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(match_id, user_id, poule_id)
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  poule_id UUID NOT NULL REFERENCES public.poules(id) ON DELETE CASCADE,
  amount DECIMAL(8, 2) NOT NULL,
  stripe_payment_intent_id TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_poules_updated_at
  BEFORE UPDATE ON public.poules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poule_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is member of a poule
CREATE OR REPLACE FUNCTION public.is_poule_member(_user_id UUID, _poule_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.poule_members
    WHERE user_id = _user_id AND poule_id = _poule_id
  )
$$;

-- Helper function to check if user is poule creator
CREATE OR REPLACE FUNCTION public.is_poule_creator(_user_id UUID, _poule_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.poules
    WHERE id = _poule_id AND creator_id = _user_id
  )
$$;

-- PROFILES RLS Policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- POULES RLS Policies
CREATE POLICY "Anyone can view open poules"
  ON public.poules FOR SELECT
  TO authenticated
  USING (status = 'open' OR public.is_poule_member(auth.uid(), id) OR creator_id = auth.uid());

CREATE POLICY "Authenticated users can create poules"
  ON public.poules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their poules"
  ON public.poules FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their poules"
  ON public.poules FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- POULE_MEMBERS RLS Policies
CREATE POLICY "Members can view poule members"
  ON public.poule_members FOR SELECT
  TO authenticated
  USING (public.is_poule_member(auth.uid(), poule_id) OR public.is_poule_creator(auth.uid(), poule_id));

CREATE POLICY "Users can join poules"
  ON public.poule_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership"
  ON public.poule_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_poule_creator(auth.uid(), poule_id));

CREATE POLICY "Users can leave poules"
  ON public.poule_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_poule_creator(auth.uid(), poule_id));

-- MATCHES RLS Policies (read-only for users, managed by system)
CREATE POLICY "Anyone can view matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (true);

-- PREDICTIONS RLS Policies
CREATE POLICY "Members can view predictions in their poules"
  ON public.predictions FOR SELECT
  TO authenticated
  USING (public.is_poule_member(auth.uid(), poule_id));

CREATE POLICY "Users can create their own predictions"
  ON public.predictions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_poule_member(auth.uid(), poule_id));

CREATE POLICY "Users can update their own predictions"
  ON public.predictions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own predictions"
  ON public.predictions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- PAYMENTS RLS Policies
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Creators can view payments for their poules
CREATE POLICY "Creators can view poule payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (public.is_poule_creator(auth.uid(), poule_id));

-- Create indexes for performance
CREATE INDEX idx_poule_members_poule_id ON public.poule_members(poule_id);
CREATE INDEX idx_poule_members_user_id ON public.poule_members(user_id);
CREATE INDEX idx_predictions_match_id ON public.predictions(match_id);
CREATE INDEX idx_predictions_user_id ON public.predictions(user_id);
CREATE INDEX idx_predictions_poule_id ON public.predictions(poule_id);
CREATE INDEX idx_matches_kickoff_time ON public.matches(kickoff_time);
CREATE INDEX idx_poules_invite_code ON public.poules(invite_code);
CREATE INDEX idx_poules_status ON public.poules(status);