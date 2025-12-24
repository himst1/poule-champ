-- Enable realtime for poule_members table so the live leaderboard updates automatically
ALTER TABLE public.poule_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poule_members;