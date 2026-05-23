
CREATE OR REPLACE FUNCTION public.notify_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_TABLE_NAME = 'inquiries' THEN
    INSERT INTO public.notifications(kind, title, body, link)
    VALUES ('inquiry', 'New inquiry from ' || NEW.name, COALESCE(NEW.message, NEW.email), '/admin');
  ELSIF TG_TABLE_NAME = 'quotes' THEN
    INSERT INTO public.notifications(kind, title, body, link)
    VALUES ('quote', 'New quote: ' || NEW.name, 'Estimated R' || NEW.estimated_price::text || ' — ' || NEW.category, '/admin');
  ELSIF TG_TABLE_NAME = 'reviews' THEN
    INSERT INTO public.notifications(kind, title, body, link)
    VALUES ('review', 'New review from ' || NEW.client_name, NEW.rating::text || '★ — ' || left(NEW.quote, 100), '/admin');
  ELSIF TG_TABLE_NAME = 'bookings' THEN
    INSERT INTO public.notifications(kind, title, body, link)
    VALUES ('booking', 'Booking confirmed: ' || NEW.client_name, 'R' || NEW.final_price::text || ' — ' || COALESCE(NEW.package_name, NEW.category, 'custom'), '/admin');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_inquiry ON public.inquiries;
CREATE TRIGGER notify_on_inquiry AFTER INSERT ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.notify_event();

DROP TRIGGER IF EXISTS notify_on_quote ON public.quotes;
CREATE TRIGGER notify_on_quote AFTER INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.notify_event();

DROP TRIGGER IF EXISTS notify_on_review ON public.reviews;
CREATE TRIGGER notify_on_review AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_event();

DROP TRIGGER IF EXISTS notify_on_booking ON public.bookings;
CREATE TRIGGER notify_on_booking AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_event();
