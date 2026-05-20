-- Run ONLY after `manual_apply_public_schema.sql` if you did NOT run `npm run db:migrate`.
-- Records migration `0000_mysterious_exiles` in `drizzle.__drizzle_migrations` so `drizzle-kit migrate`
-- and Vercel `vercel-build` do not try to apply the same DDL again.
--
-- Hash = SHA-256 (hex) of `0000_mysterious_exiles.sql` bytes (with breakpoints), matching Drizzle Kit.

CREATE SCHEMA IF NOT EXISTS drizzle;

CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT
  '9551c27b87ffcd50a268de0e0130c095dae8fbc638dc289aedbb7c6c693b9424'::text,
  1778515498243::bigint
WHERE NOT EXISTS (
  SELECT 1
  FROM drizzle.__drizzle_migrations
  WHERE hash = '9551c27b87ffcd50a268de0e0130c095dae8fbc638dc289aedbb7c6c693b9424'
);
