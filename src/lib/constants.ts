export const SUPPLY_CATEGORIES = [
  { value: "first_aid", label: "First Aid", color: "bg-pink-100 text-pink-700" },
  { value: "tools", label: "Tools", color: "bg-gray-100 text-gray-700" },
  { value: "fuel", label: "Fuel", color: "bg-amber-100 text-amber-700" },
  { value: "documents", label: "Documents", color: "bg-indigo-100 text-indigo-700" },
  { value: "communication", label: "Comms", color: "bg-purple-100 text-purple-700" },
  { value: "hygiene", label: "Hygiene", color: "bg-teal-100 text-teal-700" },
  { value: "clothing", label: "Clothing", color: "bg-cyan-100 text-cyan-700" },
  { value: "other", label: "Other", color: "bg-slate-100 text-slate-700" },
] as const;

export const SCENARIO_CATEGORIES = [
  { value: "power", label: "Power Outage", icon: "zap" },
  { value: "weather", label: "Weather/Disaster", icon: "cloud" },
  { value: "supply_disruption", label: "Supply Disruption", icon: "truck" },
  { value: "medical", label: "Medical Emergency", icon: "heart" },
  { value: "financial", label: "Financial Emergency", icon: "wallet" },
  { value: "evacuation", label: "Evacuation", icon: "map" },
  { value: "general", label: "General", icon: "shield" },
] as const;

// Main stockpile categories (money is a parent for cash/gold/savings)
export const STOCKPILE_CATEGORIES = [
  { value: "food", label: "Food", color: "bg-orange-100 text-orange-700" },
  { value: "water", label: "Water", color: "bg-blue-100 text-blue-700" },
  { value: "money", label: "Money", color: "bg-emerald-100 text-emerald-700" },
  { value: "energy", label: "Energy", color: "bg-amber-100 text-amber-700" },
  { value: "medicine", label: "Medicine", color: "bg-red-100 text-red-700" },
] as const;

// Money sub-types (stored as category in DB)
export const MONEY_SUBTYPES = [
  { value: "cash", label: "Cash", color: "bg-emerald-100 text-emerald-700" },
  { value: "gold", label: "Gold", color: "bg-yellow-100 text-yellow-700" },
  { value: "savings", label: "Savings", color: "bg-violet-100 text-violet-700" },
] as const;

export const STOCKPILE_UNITS: Record<string, string[]> = {
  food: ["kg", "g", "liters", "ml", "tins", "packets", "bags", "bottles", "boxes", "jars", "units"],
  water: ["liters", "gallons", "bottles", "tins"],
  energy: ["liters", "units", "kg", "bottles", "cans"],
  cash: ["£"],
  gold: ["1/4 oz coins"],
  savings: ["£"],
  medicine: ["tablets", "packets", "bottles", "boxes", "units", "days"],
};

export function isMoneyCategory(category: string): boolean {
  return category === "cash" || category === "gold" || category === "savings";
}

export function getStockpileCategoryColor(category: string): string {
  if (isMoneyCategory(category)) {
    const found = MONEY_SUBTYPES.find((c) => c.value === category);
    return found?.color ?? "bg-emerald-100 text-emerald-700";
  }
  const found = STOCKPILE_CATEGORIES.find((c) => c.value === category);
  return found?.color ?? "bg-slate-100 text-slate-700";
}

export function getStockpileCategoryLabel(category: string): string {
  if (isMoneyCategory(category)) {
    const found = MONEY_SUBTYPES.find((c) => c.value === category);
    return found?.label ?? category;
  }
  const found = STOCKPILE_CATEGORIES.find((c) => c.value === category);
  return found?.label ?? category;
}

// All DB-level stockpile category values (including money sub-types)
export const STOCKPILE_CATEGORY_VALUES = ["food", "water", "energy", "cash", "gold", "savings", "medicine"] as const;

export function isStockpileCategory(category: string): boolean {
  return (STOCKPILE_CATEGORY_VALUES as readonly string[]).includes(category);
}

export const COMMON_UNITS = [
  "units", "liters", "gallons", "bottles", "cans", "packets",
  "kg", "lbs", "rolls", "pairs", "boxes", "bags", "days",
] as const;

export function getCategoryColor(category: string): string {
  const found = SUPPLY_CATEGORIES.find((c) => c.value === category);
  return found?.color ?? "bg-slate-100 text-slate-700";
}

export function getCategoryLabel(category: string): string {
  const found = SUPPLY_CATEGORIES.find((c) => c.value === category);
  return found?.label ?? category;
}

export function getExpiryStatus(
  expiryDate: string | null,
  warningDays: number = 30
): "expired" | "expiring_soon" | "ok" | null {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  if (expiry <= now) return "expired";
  const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= warningDays) return "expiring_soon";
  return "ok";
}
