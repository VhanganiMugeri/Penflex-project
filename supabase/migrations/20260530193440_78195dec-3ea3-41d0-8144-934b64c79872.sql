CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, employee_id, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'employee_id', ''),
    NULLIF(NEW.raw_user_meta_data->>'department', '')::public.department_type
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    employee_id = EXCLUDED.employee_id,
    department = EXCLUDED.department,
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'worker')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_admin(_code text, _admin_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _email TEXT;
  _metadata JSONB;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _code IS NULL OR _code <> 'PENFLEX-ADMIN-2026' THEN
    RAISE EXCEPTION 'Invalid administrator access code';
  END IF;
  IF _admin_id IS NULL OR length(trim(_admin_id)) < 3 THEN
    RAISE EXCEPTION 'Administrator ID must be at least 3 characters';
  END IF;

  SELECT email, raw_user_meta_data INTO _email, _metadata FROM auth.users WHERE id = auth.uid();
  IF _email IS NULL OR _email NOT ILIKE '%@penflex.org.za' THEN
    RAISE EXCEPTION 'Administrator email must end with @penflex.org.za';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'An administrator already exists for this organization';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE admin_id = trim(_admin_id) AND id <> auth.uid()) THEN
    RAISE EXCEPTION 'That Administrator ID is already in use';
  END IF;

  INSERT INTO public.profiles (id, full_name, employee_id, department, admin_id)
  VALUES (
    auth.uid(),
    COALESCE(_metadata->>'full_name', ''),
    COALESCE(_metadata->>'employee_id', ''),
    COALESCE(NULLIF(_metadata->>'department', '')::public.department_type, 'Operations'::public.department_type),
    trim(_admin_id)
  )
  ON CONFLICT (id) DO UPDATE SET
    admin_id = EXCLUDED.admin_id,
    full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
    employee_id = COALESCE(NULLIF(public.profiles.employee_id, ''), EXCLUDED.employee_id),
    department = COALESCE(public.profiles.department, EXCLUDED.department),
    updated_at = now();

  DELETE FROM public.user_roles WHERE user_id = auth.uid() AND role = 'worker';
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN TRUE;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.claim_admin(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin(text, text) TO authenticated;

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
    WHERE p.id = auth.uid() AND r.role = 'admin' AND p.admin_id = trim(_admin_id)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.verify_admin_id(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_admin_id(text) TO authenticated;