import { z } from "zod";
import {
  optionalProductReferenceIdSchema,
  productBarcodeFieldSchema,
  productCostPriceFieldSchema,
  productLowStockAlertFieldSchema,
  productNameFieldSchema,
  productReferenceIdSchema,
  productSellingPriceFieldSchema,
  productSkuFieldSchema,
  productTaxRateFieldSchema,
} from "../../shared/products/validation.js";

const optionalTrimmedString = z.string().trim().optional().default("");

export const createInventoryItemSchema = z.object({
  productId: productReferenceIdSchema,
  productName: productNameFieldSchema,
  quantity: z.coerce.number().min(0, "Quantity must be 0 or more"),
  costPrice: productCostPriceFieldSchema,
  sellingPrice: productSellingPriceFieldSchema,
  category: optionalTrimmedString,
  supplier: optionalTrimmedString,
  lowStockAlert: productLowStockAlertFieldSchema.optional().default(10),
  vatRate: productTaxRateFieldSchema.optional().default(0),
  sku: productSkuFieldSchema.optional().default(""),
  barcode: productBarcodeFieldSchema.optional().default(""),
});

export const updateInventoryItemSchema = z
  .object({
    productId: optionalProductReferenceIdSchema,
    productName: productNameFieldSchema.optional(),
    quantity: z.coerce.number().min(0).optional(),
    costPrice: productCostPriceFieldSchema.optional(),
    sellingPrice: productSellingPriceFieldSchema.optional(),
    category: z.string().trim().optional(),
    supplier: z.string().trim().optional(),
    lowStockAlert: productLowStockAlertFieldSchema.optional(),
    vatRate: productTaxRateFieldSchema.optional(),
    sku: productSkuFieldSchema.optional(),
    barcode: productBarcodeFieldSchema.optional(),
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
