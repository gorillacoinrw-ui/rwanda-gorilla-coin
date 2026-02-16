
-- Add proof_url column to trades
ALTER TABLE public.trades ADD COLUMN proof_url text NULL;

-- Create storage bucket for trade proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('trade-proofs', 'trade-proofs', true);

-- Anyone can view trade proofs
CREATE POLICY "Trade proofs are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'trade-proofs');

-- Authenticated users can upload proofs to their own folder
CREATE POLICY "Users can upload trade proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'trade-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own proofs
CREATE POLICY "Users can update own trade proofs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'trade-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
