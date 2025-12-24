-- Add stadium and city columns to matches table
ALTER TABLE public.matches
ADD COLUMN stadium TEXT,
ADD COLUMN city TEXT;