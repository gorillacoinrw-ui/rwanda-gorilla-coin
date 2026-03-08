
-- Create investments table
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  interest_rate NUMERIC NOT NULL DEFAULT 0.12,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  matures_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  status TEXT NOT NULL DEFAULT 'active',
  coins_earned INTEGER NOT NULL DEFAULT 0,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Users can view own investments
CREATE POLICY "Users can view own investments"
  ON public.investments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own investments
CREATE POLICY "Users can insert own investments"
  ON public.investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own investments (for claiming)
CREATE POLICY "Users can update own investments"
  ON public.investments FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all investments"
  ON public.investments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
