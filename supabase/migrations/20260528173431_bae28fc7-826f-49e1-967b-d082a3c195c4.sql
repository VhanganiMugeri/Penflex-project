ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_admin_id_unique ON public.profiles (admin_id) WHERE admin_id IS NOT NULL;