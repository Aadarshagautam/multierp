import {
  INVOICE_PAYMENT_METHOD_VALUES,
  PAYMENT_METHOD_LABELS as SHARED_PAYMENT_METHOD_LABELS,
  POS_PAYMENT_METHOD_VALUES,
} from "../../shared/payment-methods/index.js";

export const DEFAULT_COUNTRY = "Nepal";
export const DEFAULT_CURRENCY = "NPR";
export const DEFAULT_VAT_RATE = 13;
export const TAX_REGISTRATION_LABEL = "PAN/VAT";

export const POS_PAYMENT_METHODS = [...POS_PAYMENT_METHOD_VALUES];
export const INVOICE_PAYMENT_METHODS = [...INVOICE_PAYMENT_METHOD_VALUES];
export const PAYMENT_METHOD_LABELS = { ...SHARED_PAYMENT_METHOD_LABELS };

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
