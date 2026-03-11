export const DEFAULT_COUNTRY = "Nepal";
export const DEFAULT_PHONE_PLACEHOLDER = "+977 98XXXXXXXX";
export const DEFAULT_VAT_RATE = 13;
export const TAX_REGISTRATION_LABEL = "PAN/VAT";

export const POS_PAYMENT_METHODS = [
  { key: "cash", label: "Cash" },
  { key: "card", label: "Card" },
  { key: "esewa", label: "eSewa" },
  { key: "khalti", label: "Khalti" },
  { key: "credit", label: "Credit" },
  { key: "mixed", label: "Split" },
];

export const INVOICE_PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "esewa", label: "eSewa" },
  { value: "khalti", label: "Khalti" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

export const PAYMENT_METHOD_LABELS = Object.fromEntries(
  [...POS_PAYMENT_METHODS, ...INVOICE_PAYMENT_METHODS].map((item) => [
    item.key || item.value,
    item.label,
  ])
);

export function formatCurrencyNpr(value, options = {}) {
  const amount = Number(value) || 0;
  const formatted = amount.toLocaleString("en-NP", {
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  });

  return options.symbol === false ? formatted : `NPR ${formatted}`;
}

export function formatShortCurrencyNpr(value) {
  return `Rs. ${formatCurrencyNpr(value, {
    symbol: false,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateNepal(value, options = {}) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-NP", {
    day: options.day ?? "2-digit",
    month: options.month ?? "short",
    year: options.year ?? "numeric",
  });
}

export function formatDateTimeNepal(value) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-NP", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
