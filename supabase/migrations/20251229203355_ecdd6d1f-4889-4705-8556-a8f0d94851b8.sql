-- Remove email column from profiles table to prevent exposure
-- Email is already stored securely in auth.users and shouldn't be public
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;