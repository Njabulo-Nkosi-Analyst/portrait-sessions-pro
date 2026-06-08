
-- gallery bucket (public) — admins write, anyone reads
DROP POLICY IF EXISTS "Public read gallery" ON storage.objects;
CREATE POLICY "Public read gallery" ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');
DROP POLICY IF EXISTS "Admins write gallery" ON storage.objects;
CREATE POLICY "Admins write gallery" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins update gallery" ON storage.objects;
CREATE POLICY "Admins update gallery" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins delete gallery" ON storage.objects;
CREATE POLICY "Admins delete gallery" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'));

-- client-galleries bucket (private) — admin full, clients read own
CREATE POLICY "Admins manage client gallery files" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'client-galleries' AND has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'client-galleries' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients read own gallery files" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'client-galleries'
    AND EXISTS (
      SELECT 1 FROM public.client_galleries cg
      WHERE cg.is_published = true
        AND cg.user_id = auth.uid()
        AND (storage.foldername(name))[1] = cg.booking_id::text
    )
  );
