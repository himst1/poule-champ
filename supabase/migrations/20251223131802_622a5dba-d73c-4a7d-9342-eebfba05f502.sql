-- Add column to track AI-generated predictions
ALTER TABLE public.predictions 
ADD COLUMN is_ai_generated BOOLEAN NOT NULL DEFAULT false;