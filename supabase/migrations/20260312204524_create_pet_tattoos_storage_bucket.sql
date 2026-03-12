-- Migration: create_pet_tattoos_storage_bucket
-- Created: 2026-03-12T20:45:24.455869


-- Create public bucket for pet tattoo temp images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-tattoos',
  'pet-tattoos',
  true,
  10485760,  -- 10 MB max
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read pet-tattoos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-tattoos');

-- Allow service role (edge function) to upload
CREATE POLICY "Service role upload pet-tattoos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pet-tattoos');

-- Allow service role to update/upsert
CREATE POLICY "Service role update pet-tattoos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'pet-tattoos');
