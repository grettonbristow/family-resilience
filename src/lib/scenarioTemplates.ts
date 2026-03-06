export type TemplateChecklistItem = {
  description: string;
  itemType: "supply" | "action" | "document" | "skill";
  supplyCategory?: string;
  requiredQuantity?: number;
  requiredUnit?: string;
  sortOrder: number;
};

export type ScenarioTemplate = {
  name: string;
  description: string;
  category: string;
  checklistItems: TemplateChecklistItem[];
};

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    name: "72-Hour Power Outage",
    description: "Be prepared for a 3-day power outage affecting your household",
    category: "power",
    checklistItems: [
      { description: "Flashlights with batteries", itemType: "supply", supplyCategory: "tools", requiredQuantity: 2, requiredUnit: "units", sortOrder: 0 },
      { description: "Portable phone charger / power bank", itemType: "supply", supplyCategory: "communication", requiredQuantity: 1, requiredUnit: "units", sortOrder: 1 },
      { description: "Battery-powered or hand-crank radio", itemType: "supply", supplyCategory: "communication", requiredQuantity: 1, requiredUnit: "units", sortOrder: 2 },
      { description: "Candles and matches/lighter", itemType: "supply", supplyCategory: "tools", requiredQuantity: 1, requiredUnit: "boxes", sortOrder: 3 },
      { description: "First aid kit", itemType: "supply", supplyCategory: "first_aid", requiredQuantity: 1, requiredUnit: "units", sortOrder: 4 },
      { description: "Blankets or sleeping bags", itemType: "supply", supplyCategory: "clothing", requiredQuantity: 2, requiredUnit: "units", sortOrder: 5 },
      { description: "Know how to manually open electric garage door", itemType: "skill", sortOrder: 6 },
      { description: "Know the location of your fuse box", itemType: "action", sortOrder: 7 },
      { description: "Have utility company contact numbers saved offline", itemType: "document", sortOrder: 8 },
    ],
  },
  {
    name: "2-Week Supply Disruption",
    description: "Prepare for a 14-day period where shops may be empty or inaccessible",
    category: "supply_disruption",
    checklistItems: [
      { description: "Toilet paper and hygiene supplies", itemType: "supply", supplyCategory: "hygiene", requiredQuantity: 14, requiredUnit: "rolls", sortOrder: 0 },
      { description: "Cleaning supplies and disinfectant", itemType: "supply", supplyCategory: "hygiene", requiredQuantity: 2, requiredUnit: "bottles", sortOrder: 1 },
      { description: "Baby/pet supplies if applicable", itemType: "supply", supplyCategory: "other", requiredQuantity: 14, requiredUnit: "days", sortOrder: 2 },
      { description: "Cooking fuel (gas canisters or similar)", itemType: "supply", supplyCategory: "fuel", requiredQuantity: 4, requiredUnit: "cans", sortOrder: 3 },
      { description: "Water purification tablets or filter", itemType: "supply", supplyCategory: "tools", requiredQuantity: 1, requiredUnit: "units", sortOrder: 4 },
      { description: "Create a meal plan using stored food", itemType: "action", sortOrder: 5 },
      { description: "Know how to safely store and rotate food supplies", itemType: "skill", sortOrder: 6 },
    ],
  },
  {
    name: "Natural Disaster Evacuation",
    description: "Ready to evacuate your home within 15 minutes if needed",
    category: "evacuation",
    checklistItems: [
      { description: "Go-bag packed and accessible for each family member", itemType: "supply", supplyCategory: "other", requiredQuantity: 2, requiredUnit: "bags", sortOrder: 0 },
      { description: "Copies of important documents in waterproof bag", itemType: "supply", supplyCategory: "documents", requiredQuantity: 1, requiredUnit: "packets", sortOrder: 1 },
      { description: "Change of clothes for each family member", itemType: "supply", supplyCategory: "clothing", requiredQuantity: 2, requiredUnit: "sets", sortOrder: 2 },
      { description: "First aid kit (compact)", itemType: "supply", supplyCategory: "first_aid", requiredQuantity: 1, requiredUnit: "units", sortOrder: 3 },
      { description: "Phone charger and cables", itemType: "supply", supplyCategory: "communication", requiredQuantity: 1, requiredUnit: "units", sortOrder: 4 },
      { description: "Establish a family meeting point", itemType: "action", sortOrder: 5 },
      { description: "Plan two evacuation routes from your home", itemType: "action", sortOrder: 6 },
      { description: "List of emergency contacts saved on paper", itemType: "document", sortOrder: 7 },
      { description: "Pet carriers and pet food if applicable", itemType: "supply", supplyCategory: "other", requiredQuantity: 1, requiredUnit: "units", sortOrder: 8 },
    ],
  },
  {
    name: "3-Month Financial Emergency",
    description: "Survive 3 months of reduced or no income",
    category: "financial",
    checklistItems: [
      { description: "List all essential monthly bills and amounts", itemType: "document", sortOrder: 0 },
      { description: "Review and document all insurance policies", itemType: "document", sortOrder: 1 },
      { description: "Know how to access pension/savings accounts", itemType: "skill", sortOrder: 2 },
      { description: "Identify non-essential subscriptions that can be cancelled", itemType: "action", sortOrder: 3 },
      { description: "Copy of all financial documents (bank, mortgage, insurance)", itemType: "supply", supplyCategory: "documents", requiredQuantity: 1, requiredUnit: "packets", sortOrder: 4 },
      { description: "Know your rights for mortgage/rent forbearance", itemType: "skill", sortOrder: 5 },
      { description: "Research local food banks and support services", itemType: "action", sortOrder: 6 },
      { description: "Have a secondary income skill or plan", itemType: "skill", sortOrder: 7 },
    ],
  },
  {
    name: "Medical Emergency",
    description: "Be prepared to handle a medical emergency at home",
    category: "medical",
    checklistItems: [
      { description: "Comprehensive first aid kit", itemType: "supply", supplyCategory: "first_aid", requiredQuantity: 1, requiredUnit: "units", sortOrder: 0 },
      { description: "Thermometer", itemType: "supply", supplyCategory: "first_aid", requiredQuantity: 1, requiredUnit: "units", sortOrder: 1 },
      { description: "List of all family medications and dosages", itemType: "document", sortOrder: 2 },
      { description: "NHS and GP contact numbers saved", itemType: "document", sortOrder: 3 },
      { description: "Insurance/medical cards accessible", itemType: "supply", supplyCategory: "documents", requiredQuantity: 1, requiredUnit: "packets", sortOrder: 4 },
      { description: "Learn basic first aid and CPR", itemType: "skill", sortOrder: 5 },
      { description: "Know the nearest A&E and walk-in clinic", itemType: "action", sortOrder: 6 },
      { description: "Allergy information documented for all family members", itemType: "document", sortOrder: 7 },
    ],
  },
];
