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
    refSaleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "pos_sale",
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

const StockMovementModel =
  mongoose.models.stock_movement ||
  mongoose.model("stock_movement", stockMovementSchema);

export default StockMovementModel;
