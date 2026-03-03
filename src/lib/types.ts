export type Supply = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minimumQuantity: number | null;
  expiryDate: string | null;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Scenario = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  isCustom: boolean | null;
  createdAt: string;
  readiness?: number;
};

export type ChecklistItem = {
  id: number;
  scenarioId: number;
  description: string;
  itemType: string;
  supplyCategory: string | null;
  requiredQuantity: number | null;
  requiredUnit: string | null;
  isCompleted: boolean | null;
  sortOrder: number | null;
  currentQuantity?: number;
};

export type SupplyLogEntry = {
  id: number;
  supplyId: number;
  action: string;
  quantity: number;
  createdAt: string;
};

export type Settings = {
  householdSize: number;
  expiryWarningDays: number;
  lowStockAlertEnabled: boolean;
};

export type DashboardData = {
  overallReadiness: number;
  expiringItems: Supply[];
  lowStockItems: Supply[];
  scenarioSummaries: { id: number; name: string; category: string; readiness: number }[];
  totalSupplies: number;
};
