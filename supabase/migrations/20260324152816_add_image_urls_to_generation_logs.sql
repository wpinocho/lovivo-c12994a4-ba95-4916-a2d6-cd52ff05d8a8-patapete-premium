-- Migration: add_image_urls_to_generation_logs
-- Created: 2026-03-24T15:28:16.603548

ALTER TABLE generation_logs
  ADD COLUMN IF NOT EXISTS user_image_url    text,
  ADD COLUMN IF NOT EXISTS pet_normalized_url text;

COMMENT ON COLUMN generation_logs.user_image_url     IS 'URL permanente en Supabase Storage de la foto original que subió el usuario';
COMMENT ON COLUMN generation_logs.pet_normalized_url  IS 'URL permanente en Supabase Storage del pet después de BiRefNet + normalización 800×800 (step 2.5)';