#!/usr/bin/env ts-node
/**
 * Validates that all required environment variables are set.
 * Run with: npx ts-node scripts/check-env.ts
 */

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_PROJECT_ID",
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("Missing required environment variables:");
  missing.forEach((key) => console.error(`  - ${key}`));
  console.error("\nCopy .env.local.example to .env.local and fill in the values.");
  process.exit(1);
} else {
  console.info("All required environment variables are set.");
}
