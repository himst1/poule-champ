-- Create prediction_comments table
CREATE TABLE public.prediction_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prediction_comments ENABLE ROW LEVEL SECURITY;

-- Poule members can view comments on predictions in their poules
CREATE POLICY "Poule members can view prediction comments"
ON public.prediction_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.predictions p
    JOIN public.poule_members pm ON pm.poule_id = p.poule_id
    WHERE p.id = prediction_id AND pm.user_id = auth.uid()
  )
);

-- Users can create comments on predictions in poules they're members of
CREATE POLICY "Users can create comments"
ON public.prediction_comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.predictions p
    JOIN public.poule_members pm ON pm.poule_id = p.poule_id
    WHERE p.id = prediction_id AND pm.user_id = auth.uid()
  )
);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.prediction_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.prediction_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_prediction_comments_updated_at
BEFORE UPDATE ON public.prediction_comments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.prediction_comments;