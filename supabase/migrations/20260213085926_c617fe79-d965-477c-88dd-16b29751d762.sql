
-- Add new columns to trades table for P2P marketplace
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS trade_type text NOT NULL DEFAULT 'sell';
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'mtn';
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS min_amount integer NOT NULL DEFAULT 1;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS max_amount integer NOT NULL DEFAULT 1000;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS escrow_started_at timestamp with time zone;

-- Update status to have more states: open, escrow, completed, cancelled, expired
-- (status is already text so no change needed)

-- Enable realtime for trades table
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
