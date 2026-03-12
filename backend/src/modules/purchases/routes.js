import express from "express";
import userAuth from "../../core/middleware/userAuth.js";
import permissionMiddleware from "../../core/middleware/permissionMiddleware.js";
import validateRequest from "../../core/middleware/validate.js";
import {
  createPurchase,
  createSupplier,
  deletePurchase,
  getPurchases,
  getSuppliers,
  returnPurchase,
  updatePurchase,
} from "./controller.js";
import {
  createPurchaseSchema,
  returnPurchaseSchema,
  updatePurchaseSchema,
} from "./validation.js";

const router = express.Router();

router.get("/", userAuth, permissionMiddleware("purchases.read"), getPurchases);
router.post(
  "/",
  userAuth,
  permissionMiddleware("purchases.create"),
  validateRequest({ body: createPurchaseSchema }),
  createPurchase
);
router.put(
  "/:id",
  userAuth,
  permissionMiddleware("purchases.update"),
  validateRequest({ body: updatePurchaseSchema }),
  updatePurchase
);
router.post(
  "/:id/return",
  userAuth,
  permissionMiddleware("purchases.return"),
  validateRequest({ body: returnPurchaseSchema }),
  returnPurchase
);
router.delete("/:id", userAuth, permissionMiddleware("purchases.delete"), deletePurchase);

router.get("/suppliers", userAuth, permissionMiddleware("purchases.read"), getSuppliers);
router.post("/suppliers", userAuth, permissionMiddleware("purchases.create"), createSupplier);

export default router;
