import express from "express";
import userAuth from "../../core/middleware/userAuth.js";
import permissionMiddleware from "../../core/middleware/permissionMiddleware.js";
import validateRequest from "../../core/middleware/validate.js";
import {
  getInventory,
  getLowStock,
  getInventoryMovements,
  createInventoryItem,
  createInventoryAdjustment,
  updateInventoryItem,
  deleteInventoryItem,
} from "./controller.js";
import {
  createInventoryAdjustmentSchema,
  createInventoryItemSchema,
  updateInventoryItemSchema,
} from "./validation.js";

const router = express.Router();

router.get("/", userAuth, permissionMiddleware("inventory.read"), getInventory);
router.get("/low-stock", userAuth, permissionMiddleware("inventory.read"), getLowStock);
router.get("/movements", userAuth, permissionMiddleware("inventory.read"), getInventoryMovements);
router.post(
  "/",
  userAuth,
  permissionMiddleware("inventory.create"),
  validateRequest({ body: createInventoryItemSchema }),
  createInventoryItem
);
router.post(
  "/:id/adjustments",
  userAuth,
  permissionMiddleware("inventory.adjust"),
  validateRequest({ body: createInventoryAdjustmentSchema }),
  createInventoryAdjustment
);
router.put(
  "/:id",
  userAuth,
  permissionMiddleware("inventory.update"),
  validateRequest({ body: updateInventoryItemSchema }),
  updateInventoryItem
);
router.delete("/:id", userAuth, permissionMiddleware("inventory.delete"), deleteInventoryItem);

export default router;
