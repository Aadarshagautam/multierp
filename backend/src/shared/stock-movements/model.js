import mongoose from "mongoose";
import { PRODUCT_MODEL_NAME } from "../products/constants.js";

const stockMovementSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
      index: true,
      default: null,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branch",
      index: true,
      default: null,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: PRODUCT_MODEL_NAME,
      required: true,
      index: true,
    },
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "inventory",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ["IN", "OUT", "ADJUST"],
      required: true,
    },
    qty: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: "",
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    sourceType: {
      type: String,
      enum: [
        "manual",
        "adjustment",
        "purchase",
        "purchase_return",
        "sale",
        "sale_refund",
        "recipe_sale",
        "recipe_refund",
      ],
      default: "manual",
      index: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    stockBefore: {
      type: Number,
      default: null,
    },
    stockAfter: {
      type: Number,
      default: null,
    },
    unitCost: {
      type: Number,
      default: null,
      min: 0,
    },
    refSaleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "pos_sale",
      default: null,
    },
    refPurchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "purchase",
      default: null,
    },
    referenceNo: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

stockMovementSchema.index({ orgId: 1, branchId: 1, createdAt: -1 });
stockMovementSchema.index({ productId: 1, createdAt: -1 });
stockMovementSchema.index({ sourceType: 1, sourceId: 1, createdAt: -1 });

const StockMovementModel =
  mongoose.models.stock_movement ||
  mongoose.model("stock_movement", stockMovementSchema);

export default StockMovementModel;
