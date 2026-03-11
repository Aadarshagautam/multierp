import { z } from "zod";
export {
  createProductSchema,
  updateProductSchema,
} from "../../shared/products/index.js";
export {
  createCustomerSchema,
  updateCustomerSchema,
} from "../../shared/customers/index.js";
export {
  createSaleSchema,
  updateOrderStatusSchema,
} from "../../shared/sales/index.js";

export const createTableSchema = z.object({
  number: z.coerce.number().int().min(1, "Table number required"),
  name: z.string().trim().optional().default(""),
  capacity: z.coerce.number().int().min(1).optional().default(4),
  section: z.string().trim().optional().default("Main Hall"),
});

export const updateTableSchema = z.object({
  number: z.coerce.number().int().min(1).optional(),
  name: z.string().trim().optional(),
  capacity: z.coerce.number().int().min(1).optional(),
  section: z.string().trim().optional(),
});

export const updateTableStatusSchema = z.object({
  status: z.enum(["available", "occupied", "reserved", "cleaning"]),
});

export const reserveTableSchema = z.object({
  customerName: z.string().trim().min(1, "Guest name is required"),
  phone: z.string().trim().optional().default(""),
  partySize: z.coerce.number().int().min(1).optional().default(1),
  reservationAt: z.string().datetime("Reservation time is required"),
  notes: z.string().trim().optional().default(""),
  source: z.enum(["walk-in", "phone", "online"]).optional().default("phone"),
});
