
-- Device fingerprints table
CREATE TABLE public.device_fingerprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT device_fingerprints_fingerprint_unique UNIQUE (fingerprint)
);

ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own device fingerprints"
  ON public.device_fingerprints FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own device fingerprints"
  ON public.device_fingerprints FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Signup attempts table
CREATE TABLE public.signup_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  ip_address TEXT,
  fingerprint TEXT,
  blocked BOOLEAN NOT NULL DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view signup attempts"
  ON public.signup_attempts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert signup attempts"
  ON public.signup_attempts FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Check uniqueness function
CREATE OR REPLACE FUNCTION public.check_signup_uniqueness(
  _email TEXT,
  _phone TEXT,
  _fingerprint TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  phone_exists BOOLEAN := false;
  device_exists BOOLEAN := false;
BEGIN
  IF _phone IS NOT NULL AND _phone != '' THEN
    SELECT EXISTS(SELECT 1 FROM profiles WHERE phone = _phone) INTO phone_exists;
  END IF;

  IF _fingerprint IS NOT NULL AND _fingerprint != '' THEN
    SELECT EXISTS(SELECT 1 FROM device_fingerprints WHERE fingerprint = _fingerprint) INTO device_exists;
  END IF;

  result := json_build_object(
    'phone_exists', phone_exists,
    'device_exists', device_exists,
    'allowed', NOT (phone_exists OR device_exists)
  );

  RETURN result;
END;
$$;
