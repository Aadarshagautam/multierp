export const DEFAULT_COUNTRY = "Nepal";
export const DEFAULT_CURRENCY = "NPR";
export const DEFAULT_VAT_RATE = 13;
export const TAX_REGISTRATION_LABEL = "PAN/VAT";

export const POS_PAYMENT_METHODS = [
  "cash",
  "card",
  "esewa",
  "khalti",
  "credit",
  "mixed",
];

export const INVOICE_PAYMENT_METHODS = [
  "cash",
  "card",
  "bank_transfer",
  "esewa",
  "khalti",
  "cheque",
  "other",
];

export const PAYMENT_METHOD_LABELS = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
  esewa: "eSewa",
  khalti: "Khalti",
  cheque: "Cheque",
  credit: "Credit",
  mixed: "Mixed",
  other: "Other",
};

export function formatCurrencyNpr(value, options = {}) {
  return new Intl.NumberFormat("en-NP", {
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(Number(value) || 0);
}

export function formatDateNepal(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-NP", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
