
-- Collections table
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sentences table
CREATE TABLE public.sentences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  reminder_time TIME,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentences ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user owns a collection
CREATE OR REPLACE FUNCTION public.is_collection_owner(_collection_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.collections
    WHERE id = _collection_id AND user_id = auth.uid()
  )
$$;

-- Collections RLS
CREATE POLICY "Users can view own collections" ON public.collections FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own collections" ON public.collections FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own collections" ON public.collections FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own collections" ON public.collections FOR DELETE USING (user_id = auth.uid());

-- Sentences RLS
CREATE POLICY "Users can view own sentences" ON public.sentences FOR SELECT USING (public.is_collection_owner(collection_id));
CREATE POLICY "Users can create sentences in own collections" ON public.sentences FOR INSERT WITH CHECK (public.is_collection_owner(collection_id));
CREATE POLICY "Users can update own sentences" ON public.sentences FOR UPDATE USING (public.is_collection_owner(collection_id));
CREATE POLICY "Users can delete own sentences" ON public.sentences FOR DELETE USING (public.is_collection_owner(collection_id));

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sentences_updated_at BEFORE UPDATE ON public.sentences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
