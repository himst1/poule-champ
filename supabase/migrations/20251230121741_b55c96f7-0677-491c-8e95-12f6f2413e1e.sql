-- Create enum for poule plan types
CREATE TYPE public.poule_plan AS ENUM ('free', 'pro', 'business');

-- Add plan_type column to poules table with default 'free'
ALTER TABLE public.poules 
ADD COLUMN plan_type public.poule_plan NOT NULL DEFAULT 'free';

-- Add max_members constraint based on plan (handled in application logic)
-- Free: max 10, Pro: max 100, Business: unlimited

-- Add comment explaining the column
COMMENT ON COLUMN public.poules.plan_type IS 'The subscription plan for this poule: free (limited features), pro (full features), business (enterprise features)';