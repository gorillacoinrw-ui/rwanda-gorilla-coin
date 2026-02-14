
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_status_check;

ALTER TABLE public.trades ADD CONSTRAINT trades_status_check 
  CHECK (status IN ('open', 'escrow', 'completed', 'cancelled', 'expired'));
