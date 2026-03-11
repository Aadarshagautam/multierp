import { z } from "zod";
import { DEFAULT_VAT_RATE } from "../../core/utils/nepal.js";
import {
  INVOICE_ITEM_DISCOUNT_TYPES,
  INVOICE_OVERALL_DISCOUNT_TYPES,
  INVOICE_PAYMENT_METHOD_VALUES,
  INVOICE_STATUS_VALUES,
} from "../payments/constants.js";

const invoiceItemSchema = z.object({
  productId: z.string().trim().min(1, "Product is required"),
  productName: z.string().trim().min(1, "Product name is required"),
  sku: z.string().trim().optional().default(""),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Unit price must be 0 or more"),
  vatRate: z.coerce.number().min(0).max(100).optional().default(DEFAULT_VAT_RATE),
  discountType: z.enum(INVOICE_ITEM_DISCOUNT_TYPES).optional().default("flat"),
  discountValue: z.coerce.number().min(0).optional().default(0),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().trim().min(1, "Customer is required"),
  items: z.array(invoiceItemSchema).min(1, "At least one invoice item is required"),
  overallDiscountType: z.enum(INVOICE_OVERALL_DISCOUNT_TYPES).optional().default("none"),
  overallDiscountValue: z.coerce.number().min(0).optional().default(0),
  withoutVat: z.boolean().optional().default(false),
  dueDate: z.string().min(1, "Due date is required"),
  paymentMethod: z.enum(INVOICE_PAYMENT_METHOD_VALUES).optional().default("cash"),
  notes: z.string().trim().optional().default(""),
  status: z.enum(INVOICE_STATUS_VALUES).optional().default("draft"),
});

export const updateInvoiceSchema = z.object({
  customerId: z.string().trim().min(1, "Customer is required").optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one invoice item is required").optional(),
  overallDiscountType: z.enum(INVOICE_OVERALL_DISCOUNT_TYPES).optional(),
  overallDiscountValue: z.coerce.number().min(0).optional(),
  withoutVat: z.boolean().optional(),
  dueDate: z.string().min(1, "Due date is required").optional(),
  paymentMethod: z.enum(INVOICE_PAYMENT_METHOD_VALUES).optional(),
  notes: z.string().trim().optional(),
  status: z.enum(INVOICE_STATUS_VALUES).optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(INVOICE_STATUS_VALUES),
});
