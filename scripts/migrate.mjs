import postgres from "postgres";

const url = process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL;

if (!url) {
  console.error("ERROR: DATABASE_URL is not set, skipping migration");
  process.exit(0);
}

console.log("Running database migration...");

const sql = postgres(url, {
  ssl: url.includes("railway") ? { rejectUnauthorized: false } : false,
  max: 1,
  connect_timeout: 10,
});

try {
  await sql`
    CREATE TABLE IF NOT EXISTS "supplies" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "category" text NOT NULL,
      "quantity" integer NOT NULL DEFAULT 0,
      "unit" text NOT NULL DEFAULT 'units',
      "minimum_quantity" integer DEFAULT 0,
      "expiry_date" date,
      "location" text,
      "notes" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log("  ✓ supplies table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS "scenarios" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "description" text,
      "category" text NOT NULL DEFAULT 'general',
      "is_custom" boolean DEFAULT false,
      "created_at" timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log("  ✓ scenarios table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS "checklist_items" (
      "id" serial PRIMARY KEY NOT NULL,
      "scenario_id" integer NOT NULL REFERENCES "scenarios"("id") ON DELETE CASCADE,
      "description" text NOT NULL,
      "item_type" text NOT NULL DEFAULT 'supply',
      "supply_category" text,
      "required_quantity" integer,
      "required_unit" text,
      "is_completed" boolean DEFAULT false,
      "sort_order" integer DEFAULT 0,
      "created_at" timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log("  ✓ checklist_items table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS "supply_log" (
      "id" serial PRIMARY KEY NOT NULL,
      "supply_id" integer NOT NULL REFERENCES "supplies"("id") ON DELETE CASCADE,
      "action" text NOT NULL,
      "quantity" integer NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log("  ✓ supply_log table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS "settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "household_size" integer DEFAULT 2,
      "expiry_warning_days" integer DEFAULT 30,
      "low_stock_alert_enabled" boolean DEFAULT true,
      "updated_at" timestamp DEFAULT now()
    )
  `;
  console.log("  ✓ settings table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS "stockpile_items" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "category" text NOT NULL,
      "quantity" real NOT NULL DEFAULT 0,
      "unit" text NOT NULL DEFAULT 'units',
      "calories_total" integer,
      "value_amount" real,
      "days_supply" real,
      "expiry_date" date,
      "location" text,
      "notes" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log("  ✓ stockpile_items table ready");

  // Add children and pets columns to settings
  try {
    await sql`ALTER TABLE "settings" ADD COLUMN "children" jsonb DEFAULT '[]'`;
    console.log("  ✓ added children column to settings");
  } catch (e) {
    if (e.message?.includes("already exists")) console.log("  ✓ children column already exists");
    else throw e;
  }
  try {
    await sql`ALTER TABLE "settings" ADD COLUMN "pets" jsonb DEFAULT '[]'`;
    console.log("  ✓ added pets column to settings");
  } catch (e) {
    if (e.message?.includes("already exists")) console.log("  ✓ pets column already exists");
    else throw e;
  }

  // Verify
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `;
  console.log("  Tables in database:", tables.map(t => t.table_name).join(", "));
  console.log("Migration complete!");

  await sql.end();
} catch (error) {
  console.error("Migration failed:", error.message);
  console.error(error);
  await sql.end();
  process.exit(1);
}
