
DROP POLICY "Service can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
