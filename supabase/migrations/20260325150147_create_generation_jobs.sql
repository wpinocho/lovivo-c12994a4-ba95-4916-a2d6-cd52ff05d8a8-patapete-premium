-- Migration: create_generation_jobs
-- Created: 2026-03-25T15:01:47.128721


CREATE TABLE generation_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status        text NOT NULL DEFAULT 'processing', -- 'processing' | 'done' | 'error'
  result_url    text,
  error_message text,
  style         text,
  pet_name      text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- Anyone can read by job_id (no auth needed, anonymous users)
CREATE POLICY "public_read" ON generation_jobs
  FOR SELECT USING (true);

-- Only service role can insert/update
CREATE POLICY "service_role_write" ON generation_jobs
  FOR ALL USING (auth.role() = 'service_role');
