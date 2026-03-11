import mongoose from "mongoose";
import { PRODUCT_MODEL_NAME } from "../../shared/products/constants.js";

const inventorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
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
      index: true,
      default: null,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      default: "",
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    costPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      default: "",
    },
    supplier: {
      type: String,
      default: "",
      trim: true,
    },
    lowStockAlert: {
      type: Number,
      default: 10,
    },
    vatRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    sku: {
      type: String,
      default: "",
      trim: true,
    },
    barcode: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes for better performance
inventorySchema.index({ userId: 1, createdAt: -1 });
inventorySchema.index({ userId: 1, quantity: 1 });
inventorySchema.index({ orgId: 1, branchId: 1, normalizedName: 1 });
inventorySchema.index({ orgId: 1, branchId: 1, productId: 1 });

const inventoryMovementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
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
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "inventory",
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
      min: 0,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

inventoryMovementSchema.index({ orgId: 1, branchId: 1, createdAt: -1 });
inventoryMovementSchema.index({ inventoryItemId: 1, createdAt: -1 });

const InventoryModel = mongoose.model("inventory", inventorySchema);
export const InventoryMovement = mongoose.model("inventory_movement", inventoryMovementSchema);

export default InventoryModel;
