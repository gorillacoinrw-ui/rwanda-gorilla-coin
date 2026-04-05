
CREATE TABLE public.app_install_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  coins_earned integer NOT NULL DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.app_install_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own install reward" ON public.app_install_rewards
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can claim install reward" ON public.app_install_rewards
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
