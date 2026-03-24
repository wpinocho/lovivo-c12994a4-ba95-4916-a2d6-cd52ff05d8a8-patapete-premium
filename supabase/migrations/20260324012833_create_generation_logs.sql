-- Migration: create_generation_logs
-- Created: 2026-03-24T01:28:33.421755

CREATE TABLE generation_logs (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           timestamptz DEFAULT now(),
  pet_name             text,
  style                text,
  haiku_input_prompt   text,
  haiku_output_prompt  text,
  gemini_prompt        text,
  gemini_output_url    text,
  latency_birefnet_ms  integer,
  latency_haiku_ms     integer,
  latency_gemini_ms    integer,
  latency_total_ms     integer
);