-- Create chat messages table for poule conversations
CREATE TABLE public.poule_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poule_id UUID NOT NULL REFERENCES public.poules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.poule_chat_messages ENABLE ROW LEVEL SECURITY;

-- Only poule members can view messages
CREATE POLICY "Poule members can view chat messages"
ON public.poule_chat_messages
FOR SELECT
TO authenticated
USING (public.is_poule_member(auth.uid(), poule_id));

-- Only poule members can send messages
CREATE POLICY "Poule members can send chat messages"
ON public.poule_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  public.is_poule_member(auth.uid(), poule_id)
);

-- Users can delete their own messages
CREATE POLICY "Users can delete own chat messages"
ON public.poule_chat_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.poule_chat_messages;

-- Create index for faster queries
CREATE INDEX idx_poule_chat_messages_poule_id ON public.poule_chat_messages(poule_id);
CREATE INDEX idx_poule_chat_messages_created_at ON public.poule_chat_messages(created_at DESC);