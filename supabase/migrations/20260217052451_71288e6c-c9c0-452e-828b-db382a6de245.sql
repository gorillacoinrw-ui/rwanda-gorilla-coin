
-- Create trade messages table
CREATE TABLE public.trade_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trade_messages ENABLE ROW LEVEL SECURITY;

-- Only trade participants can view messages
CREATE POLICY "Trade participants can view messages"
ON public.trade_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trades
    WHERE trades.id = trade_messages.trade_id
    AND (trades.seller_id = auth.uid() OR trades.buyer_id = auth.uid())
  )
);

-- Only trade participants can send messages
CREATE POLICY "Trade participants can insert messages"
ON public.trade_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.trades
    WHERE trades.id = trade_messages.trade_id
    AND (trades.seller_id = auth.uid() OR trades.buyer_id = auth.uid())
  )
);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON public.trade_messages FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_messages;
