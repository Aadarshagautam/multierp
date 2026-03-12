import express from "express";
import userAuth from "../../core/middleware/userAuth.js";
import permissionMiddleware from "../../core/middleware/permissionMiddleware.js";
import validateRequest from "../../core/middleware/validate.js";

import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getLowStock,
  getCategories,
} from "./controllers/productController.js";

import {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} from "./controllers/customerController.js";

import {
  createSale,
  getSales,
  getSale,
  refundSale,
  getSaleStats,
  updateOrderStatus,
  getKitchenOrders,
} from "./controllers/saleController.js";

import {
  getTables,
  createTable,
  updateTable,
  updateTableStatus,
  reserveTable,
  cancelTableReservation,
  deleteTable,
} from "./controllers/tableController.js";

import {
  getCurrentShift,
  openShift,
  closeShift,
  getShifts,
  getShift,
} from "./controllers/shiftController.js";

import {
  createProductSchema,
  updateProductSchema,
  createCustomerSchema,
  updateCustomerSchema,
  createSaleSchema,
  createTableSchema,
  updateTableSchema,
  updateTableStatusSchema,
  updateOrderStatusSchema,
  reserveTableSchema,
} from "./validation.js";

const router = express.Router();

// ─── Products ───
router.get(
  "/products",
  userAuth,
  permissionMiddleware("pos.products.read"),
  getProducts
);
router.get(
  "/products/low-stock",
  userAuth,
  permissionMiddleware("pos.products.read"),
  getLowStock
);
router.get(
  "/products/categories",
  userAuth,
  permissionMiddleware("pos.products.read"),
  getCategories
);
router.get(
  "/products/:id",
  userAuth,
  permissionMiddleware("pos.products.read"),
  getProduct
);
router.post(
  "/products",
  userAuth,
  permissionMiddleware("pos.products.create"),
  validateRequest({ body: createProductSchema }),
  createProduct
);
router.patch(
  "/products/:id",
  userAuth,
  permissionMiddleware("pos.products.update"),
  validateRequest({ body: updateProductSchema }),
  updateProduct
);
router.delete(
  "/products/:id",
  userAuth,
  permissionMiddleware("pos.products.delete"),
  deleteProduct
);

// ─── Customers ───
router.get(
  "/customers",
  userAuth,
  permissionMiddleware("pos.customers.read"),
  getCustomers
);
router.get(
  "/customers/:id",
  userAuth,
  permissionMiddleware("pos.customers.read"),
  getCustomer
);
router.post(
  "/customers",
  userAuth,
  permissionMiddleware("pos.customers.create"),
  validateRequest({ body: createCustomerSchema }),
  createCustomer
);
router.patch(
  "/customers/:id",
  userAuth,
  permissionMiddleware("pos.customers.update"),
  validateRequest({ body: updateCustomerSchema }),
  updateCustomer
);
router.delete(
  "/customers/:id",
  userAuth,
  permissionMiddleware("pos.customers.delete"),
  deleteCustomer
);

// ─── Sales ───
router.get(
  "/sales",
  userAuth,
  permissionMiddleware("pos.sales.read"),
  getSales
);
router.get(
  "/sales/stats",
  userAuth,
  permissionMiddleware("pos.sales.read"),
  getSaleStats
);
router.get(
  "/sales/:id",
  userAuth,
  permissionMiddleware("pos.sales.read"),
  getSale
);
router.post(
  "/sales",
  userAuth,
  permissionMiddleware("pos.sales.create"),
  validateRequest({ body: createSaleSchema }),
  createSale
);
router.post(
  "/sales/:id/refund",
  userAuth,
  permissionMiddleware("pos.sales.refund"),
  refundSale
);
router.patch(
  "/sales/:id/order-status",
  userAuth,
  permissionMiddleware(["pos.kitchen.update", "pos.sales.update"]),
  validateRequest({ body: updateOrderStatusSchema }),
  updateOrderStatus
);

// ─── KDS (Kitchen Display) ───
router.get(
  "/kds",
  userAuth,
  permissionMiddleware("pos.kitchen.read"),
  getKitchenOrders
);

// ─── Tables ───
router.get("/tables", userAuth, permissionMiddleware("pos.tables.read"), getTables);
router.post("/tables", userAuth, permissionMiddleware("pos.tables.create"), validateRequest({ body: createTableSchema }), createTable);
router.patch("/tables/:id", userAuth, permissionMiddleware("pos.tables.update"), validateRequest({ body: updateTableSchema }), updateTable);
router.patch("/tables/:id/status", userAuth, permissionMiddleware("pos.tables.update"), validateRequest({ body: updateTableStatusSchema }), updateTableStatus);
router.patch("/tables/:id/reservation", userAuth, permissionMiddleware("pos.tables.update"), validateRequest({ body: reserveTableSchema }), reserveTable);
router.delete("/tables/:id/reservation", userAuth, permissionMiddleware("pos.tables.update"), cancelTableReservation);
router.delete("/tables/:id", userAuth, permissionMiddleware("pos.tables.delete"), deleteTable);

// ─── Shifts ───
router.get("/shifts/current", userAuth, permissionMiddleware("pos.shifts.read"), getCurrentShift);
router.get("/shifts", userAuth, permissionMiddleware("pos.shifts.read"), getShifts);
router.get("/shifts/:id", userAuth, permissionMiddleware("pos.shifts.read"), getShift);
router.post("/shifts/open", userAuth, permissionMiddleware("pos.shifts.open"), openShift);
router.post("/shifts/:id/close", userAuth, permissionMiddleware("pos.shifts.close"), closeShift);

export default router;
