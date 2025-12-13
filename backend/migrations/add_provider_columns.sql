-- Migration: Add multi-provider AI support columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_provider VARCHAR DEFAULT 'gemini';
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_model VARCHAR;
