import {
  INVOICE_PAYMENT_METHOD_VALUES as SHARED_INVOICE_PAYMENT_METHOD_VALUES,
  PAYMENT_METHOD_LABELS,
  POS_PAYMENT_METHOD_VALUES as SHARED_POS_PAYMENT_METHOD_VALUES,
} from "../payment-methods/index.js";

export const POS_PAYMENT_METHOD_VALUES = [...SHARED_POS_PAYMENT_METHOD_VALUES];
export const POS_PAYMENT_STATUS_VALUES = [
  "paid",
  "partial",
  "due",
  "refund",
];

export const INVOICE_PAYMENT_METHOD_VALUES = [...SHARED_INVOICE_PAYMENT_METHOD_VALUES];
export const INVOICE_STATUS_VALUES = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
];
export const INVOICE_ITEM_DISCOUNT_TYPES = ["percentage", "flat"];
export const INVOICE_OVERALL_DISCOUNT_TYPES = ["percentage", "flat", "none"];

export const PAYMENT_METHOD_LABEL_MAP = { ...PAYMENT_METHOD_LABELS };
