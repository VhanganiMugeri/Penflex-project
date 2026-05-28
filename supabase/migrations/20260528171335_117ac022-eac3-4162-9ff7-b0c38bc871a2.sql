
-- Only one admin allowed
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_one_admin
  ON public.user_roles ((role))
  WHERE role = 'admin';

-- Claim admin role: validates email domain, secret code, and single-admin rule
CREATE OR REPLACE FUNCTION public.claim_admin(_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _code IS NULL OR _code <> 'PENFLEX-ADMIN-2026' THEN
    RAISE EXCEPTION 'Invalid administrator access code';
  END IF;

  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  IF _email IS NULL OR _email NOT ILIKE '%@penflex.org.za' THEN
    RAISE EXCEPTION 'Administrator email must end with @penflex.org.za';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'An administrator already exists for this organization';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = auth.uid() AND role = 'worker';
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin');

  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_admin(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin(TEXT) TO authenticated;
