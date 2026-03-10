import express from "express";
import userAuth from "../../core/middleware/userAuth.js";
import permissionMiddleware from "../../core/middleware/permissionMiddleware.js";
import {
  getInventory,
  getLowStock,
  getInventoryMovements,
  createInventoryItem,
  createInventoryAdjustment,
  updateInventoryItem,
  deleteInventoryItem,
} from "./controller.js";

const router = express.Router();

router.get("/", userAuth, permissionMiddleware("inventory.read"), getInventory);
router.get("/low-stock", userAuth, permissionMiddleware("inventory.read"), getLowStock);
router.get("/movements", userAuth, permissionMiddleware("inventory.read"), getInventoryMovements);
router.post("/", userAuth, permissionMiddleware("inventory.create"), createInventoryItem);
router.post("/:id/adjustments", userAuth, permissionMiddleware("inventory.update"), createInventoryAdjustment);
router.put("/:id", userAuth, permissionMiddleware("inventory.update"), updateInventoryItem);
router.delete("/:id", userAuth, permissionMiddleware("inventory.delete"), deleteInventoryItem);

export default router;
