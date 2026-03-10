import mongoose from "mongoose";

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
      ref: "pos_product",
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

const StockMovement = mongoose.model("stock_movement", stockMovementSchema);

export default StockMovement;
