import mongoose from "mongoose";
import { POS_PAYMENT_METHODS } from "../../../core/utils/nepal.js";

const saleItemModifierSchema = new mongoose.Schema(
  { name: String, option: String, price: { type: Number, default: 0 } },
  { _id: false }
);

const saleItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "pos_product", required: true },
    nameSnapshot: { type: String, required: true },
    skuSnapshot: { type: String, default: "" },
    menuCategory: { type: String, default: "" },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true },
    modifiers: [saleItemModifierSchema],
    notes: { type: String, default: "" },     // "no onion", "extra spicy"
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "served"],
      default: "pending",
    },
  },
  { _id: false }
);

const posSaleSchema = new mongoose.Schema(
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
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: "Sale must have at least one item",
      },
    },
    subTotal: { type: Number, required: true },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: POS_PAYMENT_METHODS,
      default: "cash",
    },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "pos_customer",
      default: null,
    },
    soldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    status: { type: String, enum: ["paid", "partial", "due", "refund"], default: "paid" },
    notes: { type: String, default: "" },
    // Restaurant-specific fields
    orderType: { type: String, enum: ["dine-in", "takeaway", "delivery"], default: "takeaway" },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "pos_table", default: null },
    tableNumber: { type: Number, default: null },
    orderStatus: {
      type: String,
      enum: ["pending", "preparing", "ready", "served", "completed", "cancelled"],
      default: "completed",
    },
    kotNumber: { type: String, default: "" },       // Kitchen Order Ticket
    deliveryAddress: { type: String, default: "" },
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: "pos_shift", default: null },
    loyaltyPointsEarned: { type: Number, default: 0 },
    loyaltyPointsRedeemed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

posSaleSchema.index({ orgId: 1, branchId: 1, createdAt: -1 });
posSaleSchema.index({ orgId: 1, branchId: 1, status: 1 });
posSaleSchema.index({ orgId: 1, branchId: 1, customerId: 1 });
posSaleSchema.index({ orgId: 1, branchId: 1, orderStatus: 1 });
posSaleSchema.index({ orgId: 1, branchId: 1, tableId: 1 });
posSaleSchema.index({ invoiceNo: 1 });

const PosSale = mongoose.model("pos_sale", posSaleSchema);

export default PosSale;
