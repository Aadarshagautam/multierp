import { z } from "zod";
import { PURCHASE_PAYMENT_METHOD_VALUES } from "../../shared/payment-methods/index.js";
import {
  optionalProductReferenceIdSchema,
  productNameFieldSchema,
} from "../../shared/products/validation.js";

const purchasePaymentStatusSchema = z.enum(["pending", "partial", "paid"]);
const purchaseDeliveryStatusSchema = z.enum([
  "pending",
  "in_transit",
  "delivered",
  "returned",
]);

const optionalTrimmedString = z.string().trim().optional().default("");
const optionalPaidAmountSchema = z.coerce.number().min(0).optional();
const purchaseDateSchema = z.coerce.date();

export const createPurchaseSchema = z.object({
  productId: optionalProductReferenceIdSchema,
  supplierName: z.string().trim().min(1, "Supplier name is required"),
  supplierContact: optionalTrimmedString,
  productName: productNameFieldSchema,
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Unit price must be 0 or more"),
  purchaseDate: purchaseDateSchema,
  paymentStatus: purchasePaymentStatusSchema.optional().default("pending"),
  paidAmount: optionalPaidAmountSchema,
  paymentMethod: z
    .enum(PURCHASE_PAYMENT_METHOD_VALUES)
    .optional()
    .default("cash"),
  deliveryStatus: purchaseDeliveryStatusSchema.optional().default("pending"),
  notes: optionalTrimmedString,
});

export const updatePurchaseSchema = z
  .object({
    productId: optionalProductReferenceIdSchema,
    supplierName: z.string().trim().min(1).optional(),
    supplierContact: z.string().trim().optional(),
    productName: productNameFieldSchema.optional(),
    quantity: z.coerce.number().min(1).optional(),
    unitPrice: z.coerce.number().min(0).optional(),
    purchaseDate: purchaseDateSchema.optional(),
    paymentStatus: purchasePaymentStatusSchema.optional(),
    paidAmount: optionalPaidAmountSchema,
    paymentMethod: z.enum(PURCHASE_PAYMENT_METHOD_VALUES).optional(),
    deliveryStatus: purchaseDeliveryStatusSchema.optional(),
    notes: z.string().trim().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No valid fields to update",
  });

export const returnPurchaseSchema = z.object({
  quantity: z.coerce.number().min(0.001, "Return quantity must be greater than 0"),
  notes: optionalTrimmedString,
});
