import { pgTable, serial, text, integer, real, timestamp, date, boolean, jsonb, primaryKey } from "drizzle-orm/pg-core";

// ---- NextAuth tables ----

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable("accounts", {
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (account) => [
  primaryKey({ columns: [account.provider, account.providerAccountId] }),
]);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationTokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
}, (vt) => [
  primaryKey({ columns: [vt.identifier, vt.token] }),
]);

// ---- App tables ----

export const supplies = pgTable("supplies", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(0),
  unit: text("unit").notNull().default("units"),
  minimumQuantity: integer("minimum_quantity").default(0),
  expiryDate: date("expiry_date"),
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  isCustom: boolean("is_custom").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id")
    .notNull()
    .references(() => scenarios.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  itemType: text("item_type").notNull().default("supply"),
  supplyCategory: text("supply_category"),
  requiredQuantity: integer("required_quantity"),
  requiredUnit: text("required_unit"),
  isCompleted: boolean("is_completed").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const supplyLog = pgTable("supply_log", {
  id: serial("id").primaryKey(),
  supplyId: integer("supply_id")
    .notNull()
    .references(() => supplies.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stockpileItems = pgTable("stockpile_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: real("quantity").notNull().default(0),
  unit: text("unit").notNull().default("units"),
  caloriesTotal: integer("calories_total"),
  valueAmount: real("value_amount"),
  daysSupply: real("days_supply"),
  expiryDate: date("expiry_date"),
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  householdSize: integer("household_size").default(2),
  children: jsonb("children").default("[]"),
  pets: jsonb("pets").default("[]"),
  expiryWarningDays: integer("expiry_warning_days").default(30),
  lowStockAlertEnabled: boolean("low_stock_alert_enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});
