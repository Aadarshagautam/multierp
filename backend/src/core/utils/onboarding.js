export const BUSINESS_TYPES = ["restaurant", "cafe", "shop", "general"];

export const SOFTWARE_PLANS = ["single-branch", "growth", "multi-branch"];

const DEFAULT_MODULES = [
  "notes",
  "todos",
  "accounting",
  "inventory",
  "customers",
  "invoices",
  "purchases",
  "reports",
  "crm",
  "pos",
];

const MODULES_BY_BUSINESS = {
  restaurant: ["pos", "inventory", "customers", "purchases", "reports"],
  cafe: ["pos", "customers", "inventory", "reports"],
  shop: ["pos", "inventory", "customers", "invoices", "accounting", "purchases", "reports"],
  general: DEFAULT_MODULES,
};

const BRANCH_LIMITS = {
  "single-branch": 1,
  growth: 3,
  "multi-branch": Number.POSITIVE_INFINITY,
};

export function normalizeBusinessType(value) {
  return BUSINESS_TYPES.includes(value) ? value : "general";
}

export function normalizeSoftwarePlan(value) {
  return SOFTWARE_PLANS.includes(value) ? value : "single-branch";
}

export function getEnabledModulesForBusinessType(value) {
  const businessType = normalizeBusinessType(value);
  return MODULES_BY_BUSINESS[businessType] || DEFAULT_MODULES;
}

export function getBranchLimitForPlan(value) {
  const plan = normalizeSoftwarePlan(value);
  return BRANCH_LIMITS[plan];
}

export function slugifyValue(value, fallback = "item") {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

export function buildOrganizationSlug(name, userId) {
  const suffix = String(userId || "").slice(-4) || Date.now().toString().slice(-4);
  return `${slugifyValue(name, "organization")}-${suffix}`;
}

export function buildBranchCode(name, branchCount = 1) {
  const prefix = slugifyValue(name, "branch")
    .replace(/-/g, "")
    .slice(0, 6)
    .toUpperCase();

  const numericSuffix = String(branchCount).padStart(2, "0");
  return `${prefix || "BRANCH"}${numericSuffix}`;
}
