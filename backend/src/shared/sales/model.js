import mongoose from "mongoose";
import { PRODUCT_MODEL_NAME } from "../products/constants.js";
import { CUSTOMER_MODEL_NAME } from "../customers/constants.js";
import {
  POS_PAYMENT_METHOD_VALUES,
  POS_PAYMENT_STATUS_VALUES,
} from "../payments/constants.js";
import {
  SALE_MODEL_NAME,
  SALE_ORDER_STATUS_VALUES,
  SALE_ORDER_TYPE_VALUES,
} from "./constants.js";

const salePaymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: POS_PAYMENT_METHOD_VALUES.filter((value) => value !== "mixed"),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reference: {
      type: String,
      default: "",
      trim: true,
    },
    label: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const saleItemModifierSchema = new mongoose.Schema(
  { name: String, option: String, price: { type: Number, default: 0 } },
  { _id: false }
);

const saleItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: PRODUCT_MODEL_NAME,
      required: true,
    },
    nameSnapshot: { type: String, required: true },
    skuSnapshot: { type: String, default: "" },
    barcodeSnapshot: { type: String, default: "" },
    menuCategory: { type: String, default: "" },
    productTypeSnapshot: { type: String, default: "stock" },
    qty: { type: Number, required: true, min: 1 },
    basePrice: { type: Number, required: true, min: 0, default: 0 },
    modifierTotal: { type: Number, default: 0, min: 0 },
    price: { type: Number, required: true, min: 0 },
    grossAmount: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true },
    modifiers: [saleItemModifierSchema],
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: SALE_ORDER_STATUS_VALUES,
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
        validator: (value) => value.length > 0,
        message: "Sale must have at least one item",
      },
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: CUSTOMER_MODEL_NAME,
      default: null,
    },
    customerName: { type: String, default: "" },
    customerPhone: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    customerAddressText: { type: String, default: "" },
    customerType: { type: String, default: "" },
    subTotal: { type: Number, required: true, min: 0 },
    itemDiscountTotal: { type: Number, default: 0, min: 0 },
    overallDiscount: { type: Number, default: 0, min: 0 },
    loyaltyDiscount: { type: Number, default: 0, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    payments: {
      type: [salePaymentSchema],
      default: [],
    },
    paymentMethod: {
      type: String,
      enum: POS_PAYMENT_METHOD_VALUES,
      default: "cash",
    },
    paymentMode: {
      type: String,
      enum: POS_PAYMENT_METHOD_VALUES,
      default: "cash",
    },
    receivedAmount: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, default: 0, min: 0 },
    changeAmount: { type: Number, default: 0, min: 0 },
    soldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    status: {
      type: String,
      enum: POS_PAYMENT_STATUS_VALUES,
      default: "paid",
    },
    notes: { type: String, default: "" },
    orderType: {
      type: String,
      enum: SALE_ORDER_TYPE_VALUES,
      default: "takeaway",
    },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "pos_table", default: null },
    tableNumber: { type: Number, default: null },
    orderStatus: {
      type: String,
      enum: SALE_ORDER_STATUS_VALUES,
      default: "completed",
    },
    kotNumber: { type: String, default: "" },
    deliveryAddress: { type: String, default: "" },
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: "pos_shift", default: null },
    loyaltyPointsEarned: { type: Number, default: 0, min: 0 },
    loyaltyPointsRedeemed: { type: Number, default: 0, min: 0 },
    refundedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

posSaleSchema.index({ orgId: 1, branchId: 1, createdAt: -1 });
posSaleSchema.index({ orgId: 1, branchId: 1, status: 1 });
posSaleSchema.index({ orgId: 1, branchId: 1, customerId: 1 });
posSaleSchema.index({ orgId: 1, branchId: 1, orderStatus: 1 });
posSaleSchema.index({ orgId: 1, branchId: 1, tableId: 1 });

const SaleModel =
  mongoose.models[SALE_MODEL_NAME] ||
  mongoose.model(SALE_MODEL_NAME, posSaleSchema);

export default SaleModel;
