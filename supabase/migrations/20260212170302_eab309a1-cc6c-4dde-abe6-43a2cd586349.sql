
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  code TEXT;
BEGIN
  code := 'GOR-' || upper(substr(md5(random()::text), 1, 6));
  RETURN code;
END;
$$;
