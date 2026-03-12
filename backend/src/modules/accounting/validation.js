import { z } from "zod";
import { PAYMENT_METHOD_VALUES } from "../../shared/payment-methods/index.js";

const optionalTrimmedString = z.string().trim().optional().default("");

export const createTransactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().trim().min(1, "Category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().trim().min(1, "Description is required"),
  date: z.coerce.date(),
  paymentMethod: z.enum(PAYMENT_METHOD_VALUES).optional().default("cash"),
  notes: optionalTrimmedString,
});

export const updateTransactionSchema = z
  .object({
    type: z.enum(["income", "expense"]).optional(),
    category: z.string().trim().min(1).optional(),
    amount: z.coerce.number().min(0.01).optional(),
    description: z.string().trim().min(1).optional(),
    date: z.coerce.date().optional(),
    paymentMethod: z.enum(PAYMENT_METHOD_VALUES).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No valid fields to update",
  });
