
-- 1) Notifications: remove user-driven INSERT; service-role/edge functions handle creation
DROP POLICY IF EXISTS "Authenticated can insert own notifications" ON public.notifications;

-- 2) user_roles: split ALL policy so INSERT/UPDATE have WITH CHECK
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) signup_attempts: remove broad anon/authenticated INSERT; only service-role (edge function) can write
DROP POLICY IF EXISTS "Anyone can insert signup attempts" ON public.signup_attempts;
REVOKE INSERT ON public.signup_attempts FROM anon, authenticated;
