import { z } from "zod";

const optionalTrimmedString = z.string().trim().optional().default("");
const nullableProductId = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed || null;
  });
const optionalProductId = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed || null;
  });

export const createInventoryItemSchema = z.object({
  productId: nullableProductId,
  productName: z.string().trim().min(1, "Product name is required"),
  quantity: z.coerce.number().min(0, "Quantity must be 0 or more"),
  costPrice: z.coerce.number().min(0, "Cost price must be 0 or more"),
  sellingPrice: z.coerce.number().min(0, "Selling price must be 0 or more"),
  category: optionalTrimmedString,
  supplier: optionalTrimmedString,
  lowStockAlert: z.coerce.number().min(0).optional().default(10),
  vatRate: z.coerce.number().min(0).max(100).optional().default(0),
  sku: optionalTrimmedString,
  barcode: optionalTrimmedString,
});

export const updateInventoryItemSchema = z
  .object({
    productId: optionalProductId,
    productName: z.string().trim().min(1).optional(),
    quantity: z.coerce.number().min(0).optional(),
    costPrice: z.coerce.number().min(0).optional(),
    sellingPrice: z.coerce.number().min(0).optional(),
    category: z.string().trim().optional(),
    supplier: z.string().trim().optional(),
    lowStockAlert: z.coerce.number().min(0).optional(),
    vatRate: z.coerce.number().min(0).max(100).optional(),
    sku: z.string().trim().optional(),
    barcode: z.string().trim().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No valid fields to update",
  });

export const createInventoryAdjustmentSchema = z.object({
  quantityDelta: z.coerce
    .number()
    .refine((value) => Number.isFinite(value) && value !== 0, "Adjustment quantity must be non-zero"),
  reason: z.string().trim().min(1, "Adjustment reason is required"),
  note: optionalTrimmedString,
});
