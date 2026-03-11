export const CUSTOMER_MODEL_NAME = "customer";

export const CUSTOMER_TYPES = [
  "walk_in",
  "regular",
  "wholesale",
  "guest",
];

export const DEFAULT_CUSTOMER_TYPE = "regular";
export const DEFAULT_WALK_IN_NAME = "Walk-in Customer";

export const CUSTOMER_SOURCE_VALUES = [
  "shared",
  "backoffice",
  "pos",
  "crm",
  "legacy_customer",
  "legacy_pos",
];

export const CUSTOMER_TIER_VALUES = [
  "bronze",
  "silver",
  "gold",
  "platinum",
];

export const CUSTOMER_TIER_THRESHOLDS = {
  silver: 5000,
  gold: 20000,
  platinum: 50000,
};

export const DEFAULT_CUSTOMER_LIST_LIMIT = 50;
