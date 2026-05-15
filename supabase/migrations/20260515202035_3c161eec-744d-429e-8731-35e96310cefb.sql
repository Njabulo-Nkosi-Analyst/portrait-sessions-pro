
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  whatsapp TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE TABLE public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  duration TEXT NOT NULL,
  price NUMERIC NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  category TEXT,
  package_interest TEXT,
  message TEXT,
  preferred_date DATE,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  category TEXT,
  quote TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Gallery policies
CREATE POLICY "Anyone views gallery" ON public.gallery_images FOR SELECT USING (true);
CREATE POLICY "Admins manage gallery" ON public.gallery_images FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Packages policies
CREATE POLICY "Anyone views active packages" ON public.packages FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage packages" ON public.packages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Inquiries policies
CREATE POLICY "Anyone submits inquiry" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own inquiries" ON public.inquiries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all inquiries" ON public.inquiries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update inquiries" ON public.inquiries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete inquiries" ON public.inquiries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Testimonials policies
CREATE POLICY "Anyone views testimonials" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "Admins manage testimonials" ON public.testimonials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Site settings policies
CREATE POLICY "Anyone views site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + default user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed packages
INSERT INTO public.packages (category, name, duration, price, features, is_popular, sort_order) VALUES
('Wedding', 'Essential', 'Half day (4 hrs)', 8500, '["1 photographer","200 edited photos","Online gallery","Print release"]'::jsonb, false, 1),
('Wedding', 'Premium', 'Full day (8 hrs)', 15000, '["1 photographer","400 edited photos","Premium album","Online gallery","Print release"]'::jsonb, true, 2),
('Wedding', 'Luxury', 'Full day (8 hrs)', 25000, '["2 photographers","600 edited photos","Premium album","Engagement shoot","Online gallery"]'::jsonb, false, 3),

('Portrait', 'Mini', '30 minutes', 1200, '["10 edited photos","1 location","1 outfit","Online gallery"]'::jsonb, false, 1),
('Portrait', 'Standard', '1 hour', 2500, '["30 edited photos","2 looks","1 location","Online gallery"]'::jsonb, true, 2),
('Portrait', 'Extended', '2 hours', 4500, '["60 edited photos","Multiple looks","Multiple locations","Online gallery"]'::jsonb, false, 3),

('Events', '2 Hours', '2 hours', 3500, '["Up to 100 edited photos","Online gallery","Print release"]'::jsonb, false, 1),
('Events', 'Half Day', '4 hours', 6000, '["Up to 250 edited photos","Online gallery","Print release"]'::jsonb, true, 2),
('Events', 'Full Day', '8 hours', 10000, '["Up to 500 edited photos","Online gallery","Print release"]'::jsonb, false, 3),

('Product', 'Starter', 'Per session', 2000, '["10 products","White background","2 angles each"]'::jsonb, false, 1),
('Product', 'Business', 'Per session', 4500, '["25 products","Styled shots included","Multiple angles"]'::jsonb, true, 2),
('Product', 'Full Catalogue', 'Per session', 8000, '["50+ products","Lifestyle shots included","Multiple angles"]'::jsonb, false, 3),

('Maternity', 'Maternity', '1 hour', 2000, '["Outdoor or studio","30 edited photos","Online gallery"]'::jsonb, false, 1),
('Maternity', 'Newborn', '2 hours', 3000, '["Studio","Props included","40 edited photos"]'::jsonb, true, 2),
('Maternity', 'Combo', 'Two sessions', 4500, '["Maternity + newborn bundle","All props included","Online gallery"]'::jsonb, false, 3),

('Kids', 'Mini', '30 minutes', 1500, '["15 edited photos","1 location","Online gallery"]'::jsonb, false, 1),
('Kids', 'Family', '1 hour', 2800, '["35 edited photos","1 location","Online gallery"]'::jsonb, true, 2),
('Kids', 'Extended Family', '2 hours', 4500, '["60 edited photos","Multiple groupings","Online gallery"]'::jsonb, false, 3),

('Corporate', 'Headshots', 'Per person', 800, '["Studio session","3 final edited images","Quick turnaround"]'::jsonb, false, 1),
('Corporate', 'Corporate Event', 'Half day', 5500, '["Half day coverage","Edited gallery","Quick turnaround"]'::jsonb, true, 2),
('Corporate', 'Full Branding', 'Half day', 9000, '["Team, office & products","Half day coverage","Brand-ready edits"]'::jsonb, false, 3);

-- Seed testimonials
INSERT INTO public.testimonials (client_name, category, quote, rating) VALUES
('Sarah & James', 'Wedding', 'Absolutely magical. Every photo tells our story. We couldn''t have asked for a better photographer for our wedding day.', 5),
('Nicole Rodrigues', 'Portrait', 'Professional, kind, and incredibly talented. The portraits captured exactly who I am — I''ll cherish them forever.', 5),
('Daniel Mthembu', 'Corporate', 'Our brand shoot transformed how we present ourselves online. Sharp, on-brief, and delivered ahead of schedule.', 5);

-- Seed site settings
INSERT INTO public.site_settings (key, value) VALUES
('photographer_name', 'Garlo Studio'),
('location', 'Cape Town, South Africa'),
('whatsapp', '+27123456789'),
('instagram', 'https://instagram.com/garlostudio'),
('email', 'hello@garlostudio.com'),
('bio', 'We are many different types of photographers, including portrait, landscape, commercial, event photography, and more. Some photographers specialize in one or two types of photography.');

-- Storage bucket for gallery
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);

CREATE POLICY "Anyone views gallery files" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Admins upload gallery" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update gallery" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete gallery" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));
