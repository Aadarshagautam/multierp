import { z } from "zod";
import {
  DEFAULT_VAT_RATE,
  POS_PAYMENT_METHODS,
} from "../../core/utils/nepal.js";

// ─── Shared sub-schemas ───
const modifierOptionSchema = z.object({
  label: z.string().min(1),
  price: z.number().default(0),
});
const modifierSchema = z.object({
  name: z.string().min(1),
  required: z.boolean().optional().default(false),
  multiSelect: z.boolean().optional().default(false),
  options: z.array(modifierOptionSchema).optional().default([]),
});
const recipeItemSchema = z.object({
  inventoryItemId: z.string().min(1, "Ingredient is required"),
  ingredientName: z.string().trim().optional().default(""),
  qty: z.number().positive("Recipe quantity must be greater than 0"),
  unit: z.string().trim().optional().default(""),
});

// ─── Product Schemas ───
export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").trim(),
  sku: z.string().trim().optional().default(""),
  barcode: z.string().trim().optional().default(""),
  description: z.string().optional().default(""),
  category: z.string().trim().optional().default("General"),
  menuCategory: z.string().trim().optional().default(""),
  costPrice: z.number().min(0).optional().default(0),
  sellingPrice: z.number().min(0, "Selling price must be >= 0"),
  stockQty: z.number().int().optional().default(0),
  unit: z.string().trim().optional().default("pcs"),
  taxRate: z.number().min(0).max(100).optional().default(DEFAULT_VAT_RATE),
  lowStockAlert: z.number().int().min(0).optional().default(10),
  preparationTime: z.number().int().min(0).optional().default(0),
  isAvailable: z.boolean().optional().default(true),
  modifiers: z.array(modifierSchema).optional().default([]),
  recipe: z.array(recipeItemSchema).optional().default([]),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).trim().optional(),
  sku: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  description: z.string().optional(),
  category: z.string().trim().optional(),
  menuCategory: z.string().trim().optional(),
  costPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  stockQty: z.number().int().optional(),
  unit: z.string().trim().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  lowStockAlert: z.number().int().min(0).optional(),
  preparationTime: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
  isActive: z.boolean().optional(),
  modifiers: z.array(modifierSchema).optional(),
  recipe: z.array(recipeItemSchema).optional(),
});

// ─── Customer Schemas ───
export const createCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required").trim(),
  phone: z.string().trim().optional().default(""),
  email: z.string().email().or(z.literal("")).optional().default(""),
  address: z.string().trim().optional().default(""),
  birthday: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().email().or(z.literal("")).optional(),
  address: z.string().trim().optional(),
  creditBalance: z.number().optional(),
  loyaltyPoints: z.number().optional(),
  birthday: z.string().optional(),
  notes: z.string().optional(),
});

// ─── Sale Schemas ───
const saleItemModifierSchema = z.object({
  name: z.string(),
  option: z.string(),
  price: z.number().default(0),
});

const saleItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  qty: z.number().int().min(1, "Quantity must be at least 1"),
  price: z.number().min(0).optional(),
  discount: z.number().min(0).optional().default(0),
  modifiers: z.array(saleItemModifierSchema).optional().default([]),
  notes: z.string().optional().default(""),
});

export const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  paymentMethod: z.enum(POS_PAYMENT_METHODS).optional().default("cash"),
  paidAmount: z.number().min(0).optional(),
  customerId: z.string().optional().nullable().default(null),
  overallDiscount: z.number().min(0).optional().default(0),
  notes: z.string().optional().default(""),
  orderType: z.enum(["dine-in", "takeaway", "delivery"]).optional().default("takeaway"),
  tableId: z.string().optional().nullable().default(null),
  deliveryAddress: z.string().optional().default(""),
  loyaltyPointsRedeemed: z.number().int().min(0).optional().default(0),
});

// ─── Table Schemas ───
export const createTableSchema = z.object({
  number: z.number().int().min(1, "Table number required"),
  name: z.string().trim().optional().default(""),
  capacity: z.number().int().min(1).optional().default(4),
  section: z.string().trim().optional().default("Main Hall"),
});

export const updateTableSchema = z.object({
  number: z.number().int().min(1).optional(),
  name: z.string().trim().optional(),
  capacity: z.number().int().min(1).optional(),
  section: z.string().trim().optional(),
});

export const reserveTableSchema = z.object({
  customerName: z.string().trim().min(1, "Guest name is required"),
  phone: z.string().trim().optional().default(""),
  partySize: z.number().int().min(1).optional().default(1),
  reservationAt: z.string().datetime("Reservation time is required"),
  notes: z.string().optional().default(""),
  source: z.enum(["walk-in", "phone", "online"]).optional().default("phone"),
});

// ─── Zod validation helper ───
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message).join(", ");
      return res.status(400).json({ success: false, message: errors });
    }
    req.validated = result.data;
    next();
  };
}
