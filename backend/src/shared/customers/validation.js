import { z } from "zod";
import { DEFAULT_COUNTRY } from "../../core/utils/nepal.js";
import { CUSTOMER_TYPES } from "./constants.js";
import { normalizeCustomerPayload } from "./utils.js";

const emptyableEmailSchema = z.union([
  z.string().trim().email("Enter a valid email address"),
  z.literal(""),
]);

const nullableOptionalId = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed || null;
  });

const addressCreateSchema = z.object({
  street: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  state: z.string().trim().optional().default(""),
  pincode: z.string().trim().optional().default(""),
  country: z.string().trim().optional().default(DEFAULT_COUNTRY),
});

const addressUpdateSchema = z.object({
  street: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  pincode: z.string().trim().optional(),
  country: z.string().trim().optional(),
});

const addressCreateInputSchema = z
  .union([z.string().trim(), addressCreateSchema])
  .optional()
  .default({});

const addressUpdateInputSchema = z
  .union([z.string().trim(), addressUpdateSchema])
  .optional();

const creditLimitSchema = z
  .union([z.coerce.number().min(0), z.literal(""), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === "" || value === null) return null;
    return value;
  });

const createCustomerBaseSchema = z.object({
  name: z.string().trim().optional().default(""),
  email: emptyableEmailSchema.optional().default(""),
  phone: z.string().trim().optional().default(""),
  company: z.string().trim().optional().default(""),
  address: addressCreateInputSchema,
  gstin: z.string().trim().optional(),
  taxNumber: z.string().trim().optional().default(""),
  customerType: z.enum(CUSTOMER_TYPES).optional().default("regular"),
  creditLimit: creditLimitSchema.default(null),
  loyaltyPoints: z.coerce.number().int().min(0).optional().default(0),
  notes: z.string().trim().optional().default(""),
  tags: z.array(z.string().trim().min(1)).optional().default([]),
  isActive: z.boolean().optional().default(true),
  branchId: nullableOptionalId,
  birthday: z.string().trim().optional().default(""),
});

export const createCustomerSchema = createCustomerBaseSchema
  .superRefine((value, ctx) => {
    if (!value.name && !value.phone && value.customerType !== "walk_in") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Customer name or phone is required",
        path: ["name"],
      });
    }
  })
  .transform((value) => normalizeCustomerPayload(value));

export const updateCustomerSchema = z
  .object({
    name: z.string().trim().min(1, "Customer name is required").optional(),
    email: emptyableEmailSchema.optional(),
    phone: z.string().trim().optional(),
    company: z.string().trim().optional(),
    address: addressUpdateInputSchema,
    gstin: z.string().trim().optional(),
    taxNumber: z.string().trim().optional(),
    customerType: z.enum(CUSTOMER_TYPES).optional(),
    creditLimit: creditLimitSchema,
    creditBalance: z.coerce.number().optional(),
    loyaltyPoints: z.coerce.number().int().min(0).optional(),
    totalSpent: z.coerce.number().min(0).optional(),
    visitCount: z.coerce.number().int().min(0).optional(),
    notes: z.string().trim().optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
    isActive: z.boolean().optional(),
    branchId: nullableOptionalId,
    birthday: z.string().trim().optional(),
  })
  .transform((value) => normalizeCustomerPayload(value, { partial: true }));

export default {
  createCustomerSchema,
  updateCustomerSchema,
};
