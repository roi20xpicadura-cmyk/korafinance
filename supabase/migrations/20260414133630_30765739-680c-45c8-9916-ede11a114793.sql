ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_version text DEFAULT '1.0';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_emails boolean DEFAULT false;