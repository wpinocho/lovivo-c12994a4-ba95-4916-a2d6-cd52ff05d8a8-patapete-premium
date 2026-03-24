-- Migration: add_status_and_error_to_generation_logs
-- Created: 2026-03-24T19:46:09.472081

ALTER TABLE generation_logs
  ADD COLUMN IF NOT EXISTS status        text DEFAULT 'success',
  ADD COLUMN IF NOT EXISTS error_message text;