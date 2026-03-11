import { z } from "zod";
import { DEFAULT_VAT_RATE } from "../../core/utils/nepal.js";
import {
  DEFAULT_PRODUCT_CATEGORY,
  DEFAULT_PRODUCT_TYPE,
  DEFAULT_PRODUCT_UNIT,
  DEFAULT_REORDER_LEVEL,
  PRODUCT_TYPE_VALUES,
} from "./constants.js";

const optionalTrimmedString = z.string().trim().optional().default("");
const nullableIdField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed || null;
  });
const optionalNullableIdField = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed || null;
  });

export const modifierOptionSchema = z.object({
  label: z.string().trim().min(1, "Modifier option label is required"),
  price: z.coerce.number().min(0).optional().default(0),
});

export const modifierSchema = z.object({
  name: z.string().trim().min(1, "Modifier name is required"),
  required: z.boolean().optional().default(false),
  multiSelect: z.boolean().optional().default(false),
  options: z.array(modifierOptionSchema).optional().default([]),
});

export const recipeItemSchema = z.object({
  inventoryItemId: z.string().trim().min(1, "Ingredient is required"),
  ingredientName: optionalTrimmedString,
  qty: z.coerce.number().positive("Recipe quantity must be greater than 0"),
  unit: optionalTrimmedString,
});

export const normalizeProductPayload = (payload = {}, { partial = false } = {}) => {
  const normalized = { ...payload };

  if (normalized.currentStock !== undefined && normalized.stockQty === undefined) {
    normalized.stockQty = normalized.currentStock;
  }
  delete normalized.currentStock;

  if (normalized.reorderLevel !== undefined && normalized.lowStockAlert === undefined) {
    normalized.lowStockAlert = normalized.reorderLevel;
  }
  delete normalized.reorderLevel;

  if (normalized.type !== undefined && normalized.productType === undefined) {
    normalized.productType = normalized.type;
  }
  delete normalized.type;

  if (!partial && normalized.productType === undefined) {
    normalized.productType =
      normalized.trackStock === false ? "service" : DEFAULT_PRODUCT_TYPE;
  }

  if (normalized.productType !== undefined && normalized.trackStock === undefined) {
    normalized.trackStock = normalized.productType === "stock";
  }

  if (!partial) {
    if (normalized.category === undefined) normalized.category = DEFAULT_PRODUCT_CATEGORY;
    if (normalized.unit === undefined) normalized.unit = DEFAULT_PRODUCT_UNIT;
    if (normalized.stockQty === undefined) normalized.stockQty = 0;
    if (normalized.lowStockAlert === undefined) {
      normalized.lowStockAlert = DEFAULT_REORDER_LEVEL;
    }
  }

  if (!partial && normalized.code === undefined) {
    normalized.code = normalized.sku || normalized.barcode || "";
  }

  return normalized;
};

const createProductBaseSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  code: optionalTrimmedString,
  sku: optionalTrimmedString,
  barcode: optionalTrimmedString,
  description: optionalTrimmedString,
  type: z.enum(PRODUCT_TYPE_VALUES).optional(),
  category: z.string().trim().optional().default(DEFAULT_PRODUCT_CATEGORY),
  categoryId: nullableIdField,
  menuCategory: optionalTrimmedString,
  unit: z.string().trim().optional().default(DEFAULT_PRODUCT_UNIT),
  unitId: nullableIdField,
  costPrice: z.coerce.number().min(0).optional().default(0),
  sellingPrice: z.coerce.number().min(0, "Selling price must be 0 or more"),
  stockQty: z.coerce.number().min(0).optional(),
  currentStock: z.coerce.number().min(0).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional().default(DEFAULT_VAT_RATE),
  taxId: nullableIdField,
  lowStockAlert: z.coerce.number().min(0).optional(),
  reorderLevel: z.coerce.number().min(0).optional(),
  trackStock: z.boolean().optional(),
  preparationTime: z.coerce.number().int().min(0).optional().default(0),
  isAvailable: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
  imageUrl: optionalTrimmedString,
  modifiers: z.array(modifierSchema).optional().default([]),
  recipe: z.array(recipeItemSchema).optional().default([]),
});

export const createProductSchema = createProductBaseSchema.transform((value) =>
  normalizeProductPayload(value)
);

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    code: z.string().trim().optional(),
    sku: z.string().trim().optional(),
    barcode: z.string().trim().optional(),
    description: z.string().trim().optional(),
    type: z.enum(PRODUCT_TYPE_VALUES).optional(),
    category: z.string().trim().optional(),
    categoryId: optionalNullableIdField,
    menuCategory: z.string().trim().optional(),
    unit: z.string().trim().optional(),
    unitId: optionalNullableIdField,
    costPrice: z.coerce.number().min(0).optional(),
    sellingPrice: z.coerce.number().min(0).optional(),
    stockQty: z.coerce.number().min(0).optional(),
    currentStock: z.coerce.number().min(0).optional(),
    taxRate: z.coerce.number().min(0).max(100).optional(),
    taxId: optionalNullableIdField,
    lowStockAlert: z.coerce.number().min(0).optional(),
    reorderLevel: z.coerce.number().min(0).optional(),
    trackStock: z.boolean().optional(),
    preparationTime: z.coerce.number().int().min(0).optional(),
    isAvailable: z.boolean().optional(),
    isActive: z.boolean().optional(),
    imageUrl: z.string().trim().optional(),
    modifiers: z.array(modifierSchema).optional(),
    recipe: z.array(recipeItemSchema).optional(),
  })
  .transform((value) => normalizeProductPayload(value, { partial: true }));
