import express from "express";
import userAuth from "../../core/middleware/userAuth.js";
import permissionMiddleware from "../../core/middleware/permissionMiddleware.js";
import validateRequest from "../../core/middleware/validate.js";
import {
  getTransactions,
  getSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "./controller.js";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "./validation.js";

const router = express.Router();

router.get("/", userAuth, permissionMiddleware("accounting.read"), getTransactions);
router.get("/summary", userAuth, permissionMiddleware("accounting.read"), getSummary);
router.post(
  "/",
  userAuth,
  permissionMiddleware("accounting.create"),
  validateRequest({ body: createTransactionSchema }),
  createTransaction
);
router.put(
  "/:id",
  userAuth,
  permissionMiddleware("accounting.update"),
  validateRequest({ body: updateTransactionSchema }),
  updateTransaction
);
router.delete("/:id", userAuth, permissionMiddleware("accounting.delete"), deleteTransaction);

export default router;
