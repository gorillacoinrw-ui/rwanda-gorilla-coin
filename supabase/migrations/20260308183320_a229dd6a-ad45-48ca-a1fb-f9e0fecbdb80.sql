
-- Ads table
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  ad_type TEXT NOT NULL DEFAULT 'image', -- 'image', 'video', 'text_image'
  image_url TEXT,
  video_url TEXT,
  link_url TEXT,
  coin_reward INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Ad views tracking
CREATE TABLE public.ad_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, ad_id)
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;

-- Ads RLS: anyone can view active ads, admins can manage
CREATE POLICY "Anyone can view active ads" ON public.ads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage ads" ON public.ads
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ad views RLS
CREATE POLICY "Users can view own ad views" ON public.ad_views
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ad views" ON public.ad_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all ad views" ON public.ad_views
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for ad images
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-images', 'ad-images', true);

-- Storage policies for ad images
CREATE POLICY "Anyone can view ad images" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'ad-images');

CREATE POLICY "Admins can upload ad images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ad-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ad images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'ad-images' AND has_role(auth.uid(), 'admin'::app_role));
