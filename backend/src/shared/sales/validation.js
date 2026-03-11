import { z } from "zod";
import { POS_PAYMENT_METHOD_VALUES } from "../payments/constants.js";
import {
  SALE_ORDER_STATUS_VALUES,
  SALE_ORDER_TYPE_VALUES,
} from "./constants.js";

const salePaymentLineSchema = z.object({
  method: z.enum(POS_PAYMENT_METHOD_VALUES.filter((value) => value !== "mixed")),
  amount: z.coerce.number().min(0.01, "Payment amount must be greater than 0"),
  reference: z.string().trim().optional().default(""),
});

const saleItemModifierSchema = z.object({
  name: z.string().trim().min(1, "Modifier name is required"),
  option: z.string().trim().min(1, "Modifier option is required"),
  price: z.coerce.number().min(0).optional().default(0),
});

const saleItemSchema = z.object({
  productId: z.string().trim().min(1, "Product is required"),
  qty: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  price: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).optional().default(0),
  modifiers: z.array(saleItemModifierSchema).optional().default([]),
  notes: z.string().trim().optional().default(""),
});

export const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  paymentMethod: z.enum(POS_PAYMENT_METHOD_VALUES).optional().default("cash"),
  payments: z.array(salePaymentLineSchema).optional().default([]),
  paidAmount: z.coerce.number().min(0).optional(),
  customerId: z
    .union([z.string().trim(), z.null()])
    .optional()
    .transform((value) => (typeof value === "string" && value ? value : null))
    .default(null),
  overallDiscount: z.coerce.number().min(0).optional().default(0),
  notes: z.string().trim().optional().default(""),
  orderType: z.enum(SALE_ORDER_TYPE_VALUES).optional().default("takeaway"),
  tableId: z
    .union([z.string().trim(), z.null()])
    .optional()
    .transform((value) => (typeof value === "string" && value ? value : null))
    .default(null),
  deliveryAddress: z.string().trim().optional().default(""),
  loyaltyPointsRedeemed: z.coerce.number().int().min(0).optional().default(0),
});

export const updateOrderStatusSchema = z.object({
  orderStatus: z.enum(SALE_ORDER_STATUS_VALUES),
});
