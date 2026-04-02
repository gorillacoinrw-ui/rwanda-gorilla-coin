
-- Add unique constraint on phone in profiles (only for non-null phones)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique ON public.profiles (phone) WHERE phone IS NOT NULL;

-- Add unique constraint on user_id in profiles (if not already)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique ON public.profiles (user_id);
