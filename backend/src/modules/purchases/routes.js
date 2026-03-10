import express from "express";
import userAuth from "../../core/middleware/userAuth.js";
import permissionMiddleware from "../../core/middleware/permissionMiddleware.js";
import {
  createPurchase,
  createSupplier,
  deletePurchase,
  getPurchases,
  getSuppliers,
  returnPurchase,
  updatePurchase,
} from "./controller.js";

const router = express.Router();

router.get("/", userAuth, permissionMiddleware("purchases.read"), getPurchases);
router.post("/", userAuth, permissionMiddleware("purchases.create"), createPurchase);
router.put("/:id", userAuth, permissionMiddleware("purchases.update"), updatePurchase);
router.post("/:id/return", userAuth, permissionMiddleware("purchases.update"), returnPurchase);
router.delete("/:id", userAuth, permissionMiddleware("purchases.delete"), deletePurchase);

router.get("/suppliers", userAuth, permissionMiddleware("purchases.read"), getSuppliers);
router.post("/suppliers", userAuth, permissionMiddleware("purchases.create"), createSupplier);

export default router;
