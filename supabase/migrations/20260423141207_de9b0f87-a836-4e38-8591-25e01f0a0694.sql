-- Track inactivity reminder emails sent to users
CREATE TABLE public.inactivity_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reminder_count INTEGER NOT NULL DEFAULT 1,
  last_mining_date TIMESTAMPTZ,
  email_status TEXT NOT NULL DEFAULT 'sent'
);

CREATE INDEX idx_inactivity_reminders_user ON public.inactivity_reminders(user_id, sent_at DESC);

ALTER TABLE public.inactivity_reminders ENABLE ROW LEVEL SECURITY;

-- Only admins can view; edge function uses service role
CREATE POLICY "Admins can view inactivity reminders"
ON public.inactivity_reminders
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));