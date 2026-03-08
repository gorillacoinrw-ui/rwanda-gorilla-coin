
-- Social tasks table (admin-defined tasks)
CREATE TABLE public.social_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL DEFAULT 'follow', -- follow, subscribe, share
  platform TEXT NOT NULL, -- youtube, facebook, instagram, whatsapp, tiktok, twitter
  url TEXT, -- link to visit
  coin_reward INTEGER NOT NULL DEFAULT 5,
  icon TEXT, -- icon name
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User task completions
CREATE TABLE public.user_task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.social_tasks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  coins_credited BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, task_id)
);

-- RLS for social_tasks
ALTER TABLE public.social_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tasks" ON public.social_tasks
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage tasks" ON public.social_tasks
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for user_task_completions
ALTER TABLE public.user_task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions" ON public.user_task_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can submit completions" ON public.user_task_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all completions" ON public.user_task_completions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update completions" ON public.user_task_completions
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default tasks
INSERT INTO public.social_tasks (title, description, task_type, platform, url, coin_reward, icon) VALUES
  ('Subscribe to YouTube', 'Subscribe to @GorillaCoin on YouTube', 'subscribe', 'youtube', 'https://www.youtube.com/@GorillaCoin', 10, 'Youtube'),
  ('Follow on Facebook', 'Follow GoRwanda Coin on Facebook', 'follow', 'facebook', 'https://www.facebook.com/GoRwandaCoin', 5, 'Facebook'),
  ('Follow on Instagram', 'Follow @GorillaCoin on Instagram', 'follow', 'instagram', 'https://www.instagram.com/gorillacoin', 5, 'Instagram'),
  ('Follow on TikTok', 'Follow @GorillaCoin on TikTok', 'follow', 'tiktok', 'https://www.tiktok.com/@gorillacoin', 5, 'Music2'),
  ('Follow on X (Twitter)', 'Follow @GorillaCoin on X', 'follow', 'twitter', 'https://x.com/gorillacoin', 5, 'Twitter'),
  ('Share on WhatsApp', 'Share Gorilla Coin with friends on WhatsApp', 'share', 'whatsapp', NULL, 5, 'MessageCircle'),
  ('Share on Facebook', 'Share Gorilla Coin on your Facebook', 'share', 'facebook', NULL, 3, 'Facebook'),
  ('Share on Instagram', 'Share Gorilla Coin on your Instagram story', 'share', 'instagram', NULL, 3, 'Instagram');
