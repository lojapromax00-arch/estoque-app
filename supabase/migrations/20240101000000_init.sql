-- Migration: init
-- Created: 2024-01-01
-- Description: Initial schema setup

-- Enable UUID extension (already available on Supabase by default)
create extension if not exists "uuid-ossp";

-- Example: future tables go here.
-- Each new migration creates a new file with timestamp prefix:
--   YYYYMMDDHHMMSS_description.sql
