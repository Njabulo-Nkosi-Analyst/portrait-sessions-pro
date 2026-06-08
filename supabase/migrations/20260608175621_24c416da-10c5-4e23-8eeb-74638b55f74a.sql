
-- packages additions
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'none' CHECK (media_type IN ('image','video','none'));
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS category_sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS additional_hour_rate NUMERIC;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS deliverables TEXT;

-- bookings additions
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS session_time TIME;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS deposit_status TEXT NOT NULL DEFAULT 'awaiting' CHECK (deposit_status IN ('awaiting','deposit_received','fully_paid'));
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS deposit_received_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS fully_paid_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS promo_discount NUMERIC NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_bookings_session_date ON public.bookings(session_date);

-- testimonials additions
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT true;

-- Replace public read policy on testimonials to only show approved
DROP POLICY IF EXISTS "Anyone views testimonials" ON public.testimonials;
CREATE POLICY "Anyone views approved testimonials" ON public.testimonials FOR SELECT USING (is_approved = true);
-- Allow anonymous insert for the public review portal (always pending approval)
CREATE POLICY "Anyone can submit a review" ON public.testimonials FOR INSERT WITH CHECK (is_approved = false);

-- promo_codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value NUMERIC NOT NULL,
  expiry_date DATE,
  max_uses INT,
  uses_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promo_codes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active promo codes" ON public.promo_codes FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage promo codes" ON public.promo_codes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- client_galleries
CREATE TABLE IF NOT EXISTS public.client_galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  admin_message TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_galleries TO authenticated;
GRANT ALL ON public.client_galleries TO service_role;
ALTER TABLE public.client_galleries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own published galleries" ON public.client_galleries FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND is_published = true);
CREATE POLICY "Admins manage client galleries" ON public.client_galleries FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_cg_updated_at BEFORE UPDATE ON public.client_galleries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed weekly schedule defaults in site_settings (value is TEXT here; store JSON strings)
INSERT INTO public.site_settings (key, value) VALUES
  ('working_days', '{"mon":true,"tue":true,"wed":true,"thu":true,"fri":true,"sat":true,"sun":false}')
  ON CONFLICT (key) DO NOTHING;
INSERT INTO public.site_settings (key, value) VALUES
  ('default_slots', '{"mon":["09:00","11:00","14:00"],"tue":["09:00","11:00","14:00"],"wed":["09:00","11:00","14:00"],"thu":["09:00","11:00","14:00"],"fri":["09:00","11:00","14:00"],"sat":["09:00","11:00"],"sun":[]}')
  ON CONFLICT (key) DO NOTHING;

-- Realtime for live slot updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
