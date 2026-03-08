
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ref_code TEXT;
  referrer_user_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name, referral_code)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Gorilla Miner'), public.generate_referral_code());

  -- Create default role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  -- Process referral
  ref_code := NEW.raw_user_meta_data->>'referral_code_used';
  IF ref_code IS NOT NULL AND ref_code != '' THEN
    SELECT user_id INTO referrer_user_id
    FROM public.profiles
    WHERE referral_code = ref_code;

    IF referrer_user_id IS NOT NULL AND referrer_user_id != NEW.id THEN
      INSERT INTO public.referrals (referrer_id, referred_id, bonus_credited)
      VALUES (referrer_user_id, NEW.id, true);

      UPDATE public.profiles
      SET coin_balance = coin_balance + 15
      WHERE user_id = referrer_user_id;

      UPDATE public.profiles
      SET coin_balance = coin_balance + 10, referred_by = referrer_user_id
      WHERE user_id = NEW.id;

      -- Notify referrer about new signup
      INSERT INTO public.notifications (user_id, title, message, type, action_url)
      VALUES (referrer_user_id, 'New Referral! 🦍', 'Someone signed up using your referral code! You earned 15 GOR coins.', 'referral', '/profile');
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
