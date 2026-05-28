CREATE OR REPLACE FUNCTION public.claim_admin(_code text, _admin_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _code IS NULL OR _code <> 'PENFLEX-ADMIN-2026' THEN
    RAISE EXCEPTION 'Invalid administrator access code';
  END IF;
  IF _admin_id IS NULL OR length(trim(_admin_id)) < 3 THEN
    RAISE EXCEPTION 'Administrator ID must be at least 3 characters';
  END IF;

  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  IF _email IS NULL OR _email NOT ILIKE '%@penflex.org.za' THEN
    RAISE EXCEPTION 'Administrator email must end with @penflex.org.za';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'An administrator already exists for this organization';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE admin_id = _admin_id) THEN
    RAISE EXCEPTION 'That Administrator ID is already in use';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = auth.uid() AND role = 'worker';
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin');
  UPDATE public.profiles SET admin_id = _admin_id WHERE id = auth.uid();

  RETURN TRUE;
END;
$function$;

DROP FUNCTION IF EXISTS public.claim_admin(text);

CREATE OR REPLACE FUNCTION public.verify_admin_id(_admin_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles r ON r.user_id = p.id
    WHERE p.id = auth.uid() AND r.role = 'admin' AND p.admin_id = _admin_id
  );
$$;