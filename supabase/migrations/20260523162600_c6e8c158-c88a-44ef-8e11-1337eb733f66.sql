
-- 1) Add video URL columns
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.hero_images ADD COLUMN IF NOT EXISTS video_url text;

-- 2) Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid REFERENCES public.inquiries(id) ON DELETE SET NULL,
  user_id uuid,
  client_name text NOT NULL,
  client_email text,
  client_whatsapp text,
  category text,
  package_name text,
  package_price numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  discount_reason text,
  final_price numeric(10,2) NOT NULL DEFAULT 0,
  session_date date,
  status text NOT NULL DEFAULT 'confirmed', -- confirmed | completed | cancelled
  notes text,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage bookings" ON public.bookings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3) Booking expenses
CREATE TABLE IF NOT EXISTS public.booking_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  type text NOT NULL, -- petrol | wage | other
  label text,
  km numeric(10,2),
  rate_per_km numeric(10,2),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.booking_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage expenses" ON public.booking_expenses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Quotes (instant quote calculator)
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  whatsapp text,
  category text NOT NULL,
  hours numeric(5,2) NOT NULL DEFAULT 1,
  location text,
  extras jsonb NOT NULL DEFAULT '[]',
  estimated_price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits quote" ON public.quotes
  FOR INSERT TO public WITH CHECK (
    char_length(name) BETWEEN 1 AND 200
    AND email ~~ '%_@_%.__%'
  );
CREATE POLICY "Admins view quotes" ON public.quotes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete quotes" ON public.quotes
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5) Availability blocks
CREATE TABLE IF NOT EXISTS public.availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_date date NOT NULL,
  start_time time,
  end_time time,
  is_available boolean NOT NULL DEFAULT true,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views availability" ON public.availability_blocks
  FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage availability" ON public.availability_blocks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6) Client gallery access (private gallery portal)
CREATE TABLE IF NOT EXISTS public.client_gallery_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  client_name text NOT NULL,
  title text,
  cover_url text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_gallery_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views gallery access by token" ON public.client_gallery_access
  FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage gallery access" ON public.client_gallery_access
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Images attached to a client gallery
CREATE TABLE IF NOT EXISTS public.client_gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid NOT NULL REFERENCES public.client_gallery_access(id) ON DELETE CASCADE,
  url text NOT NULL,
  caption text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_gallery_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views client gallery images" ON public.client_gallery_images
  FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage client gallery images" ON public.client_gallery_images
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7) Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid REFERENCES public.client_gallery_access(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  rating int NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  quote text NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits review" ON public.reviews
  FOR INSERT TO public WITH CHECK (
    char_length(client_name) BETWEEN 1 AND 200
    AND char_length(quote) BETWEEN 1 AND 2000
  );
CREATE POLICY "Anyone views published reviews" ON public.reviews
  FOR SELECT TO public USING (is_published = true);
CREATE POLICY "Admins manage reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8) Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, -- null = global / admin-wide
  kind text NOT NULL, -- inquiry | booking | review | quote | system
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view all notifications" ON public.notifications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_confirmed_at ON public.bookings(confirmed_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_booking ON public.booking_expenses(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_token ON public.client_gallery_access(token);
