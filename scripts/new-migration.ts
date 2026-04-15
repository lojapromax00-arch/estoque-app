#!/usr/bin/env ts-node
/**
 * Creates a new timestamped migration file.
 * Usage: npx ts-node scripts/new-migration.ts <description>
 * Example: npx ts-node scripts/new-migration.ts create_products_table
 */

import * as fs from "fs";
import * as path from "path";

const description = process.argv[2];

if (!description) {
  console.error("Usage: npx ts-node scripts/new-migration.ts <description>");
  console.error("Example: npx ts-node scripts/new-migration.ts create_products_table");
  process.exit(1);
}

const slug = description.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
const timestamp = new Date()
  .toISOString()
  .replace(/[-T:.Z]/g, "")
  .slice(0, 14);

const filename = `${timestamp}_${slug}.sql`;
const filepath = path.join(__dirname, "..", "supabase", "migrations", filename);

const template = `-- Migration: ${slug}
-- Created: ${new Date().toISOString()}
-- Description: TODO

`;

fs.writeFileSync(filepath, template);
console.info(`Created migration: supabase/migrations/${filename}`);
