
-- 1. Restrict access to phone column on profiles (sensitive PII)
-- Owners can still read their own phone via the edge function or own-row queries; PostgREST will reject phone reads from non-owners.
REVOKE SELECT (phone) ON public.profiles FROM anon, authenticated;
-- Admins still need it; grant via admin role check is not column-aware in PostgREST, so admin reads of phone should go through service role / edge function.

-- 2. Add explicit admin-only UPDATE/DELETE policies on referrals
CREATE POLICY "Admins can update referrals"
ON public.referrals
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete referrals"
ON public.referrals
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
