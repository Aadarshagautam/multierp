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
  permissionMiddleware("pos.read"),
  getProducts
);
router.get(
  "/products/low-stock",
  userAuth,
  permissionMiddleware("pos.read"),
  getLowStock
);
router.get(
  "/products/categories",
  userAuth,
  permissionMiddleware("pos.read"),
  getCategories
);
router.get(
  "/products/:id",
  userAuth,
  permissionMiddleware("pos.read"),
  getProduct
);
router.post(
  "/products",
  userAuth,
  permissionMiddleware("pos.create"),
  validateRequest({ body: createProductSchema }),
  createProduct
);
router.patch(
  "/products/:id",
  userAuth,
  permissionMiddleware("pos.update"),
  validateRequest({ body: updateProductSchema }),
  updateProduct
);
router.delete(
  "/products/:id",
  userAuth,
  permissionMiddleware("pos.delete"),
  deleteProduct
);

// ─── Customers ───
router.get(
  "/customers",
  userAuth,
  permissionMiddleware("pos.read"),
  getCustomers
);
router.get(
  "/customers/:id",
  userAuth,
  permissionMiddleware("pos.read"),
  getCustomer
);
router.post(
  "/customers",
  userAuth,
  permissionMiddleware("pos.create"),
  validateRequest({ body: createCustomerSchema }),
  createCustomer
);
router.patch(
  "/customers/:id",
  userAuth,
  permissionMiddleware("pos.update"),
  validateRequest({ body: updateCustomerSchema }),
  updateCustomer
);
router.delete(
  "/customers/:id",
  userAuth,
  permissionMiddleware("pos.delete"),
  deleteCustomer
);

// ─── Sales ───
router.get(
  "/sales",
  userAuth,
  permissionMiddleware("pos.read"),
  getSales
);
router.get(
  "/sales/stats",
  userAuth,
  permissionMiddleware("pos.read"),
  getSaleStats
);
router.get(
  "/sales/:id",
  userAuth,
  permissionMiddleware("pos.read"),
  getSale
);
router.post(
  "/sales",
  userAuth,
  permissionMiddleware("pos.create"),
  validateRequest({ body: createSaleSchema }),
  createSale
);
router.post(
  "/sales/:id/refund",
  userAuth,
  permissionMiddleware("pos.delete"),
  refundSale
);
router.patch(
  "/sales/:id/order-status",
  userAuth,
  permissionMiddleware("pos.update"),
  validateRequest({ body: updateOrderStatusSchema }),
  updateOrderStatus
);

// ─── KDS (Kitchen Display) ───
router.get(
  "/kds",
  userAuth,
  permissionMiddleware("pos.read"),
  getKitchenOrders
);

// ─── Tables ───
router.get("/tables", userAuth, permissionMiddleware("pos.read"), getTables);
router.post("/tables", userAuth, permissionMiddleware("pos.create"), validateRequest({ body: createTableSchema }), createTable);
router.patch("/tables/:id", userAuth, permissionMiddleware("pos.update"), validateRequest({ body: updateTableSchema }), updateTable);
router.patch("/tables/:id/status", userAuth, permissionMiddleware("pos.update"), validateRequest({ body: updateTableStatusSchema }), updateTableStatus);
router.patch("/tables/:id/reservation", userAuth, permissionMiddleware("pos.update"), validateRequest({ body: reserveTableSchema }), reserveTable);
router.delete("/tables/:id/reservation", userAuth, permissionMiddleware("pos.update"), cancelTableReservation);
router.delete("/tables/:id", userAuth, permissionMiddleware("pos.delete"), deleteTable);

// ─── Shifts ───
router.get("/shifts/current", userAuth, permissionMiddleware("pos.read"), getCurrentShift);
router.get("/shifts", userAuth, permissionMiddleware("pos.read"), getShifts);
router.get("/shifts/:id", userAuth, permissionMiddleware("pos.read"), getShift);
router.post("/shifts/open", userAuth, permissionMiddleware("pos.create"), openShift);
router.post("/shifts/:id/close", userAuth, permissionMiddleware("pos.update"), closeShift);

export default router;
