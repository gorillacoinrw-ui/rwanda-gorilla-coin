-- Allow admins to view all mining sessions
CREATE POLICY "Admins can view all mining sessions"
ON public.mining_sessions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all referrals
CREATE POLICY "Admins can view all referrals"
ON public.referrals
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));