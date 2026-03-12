import mongoose from "mongoose";
import { POS_PAYMENT_STATUS_VALUES } from "./constants.js";
import { PAYMENT_METHOD_VALUES } from "../payment-methods/index.js";
import { CUSTOMER_MODEL_NAME } from "../customers/constants.js";
import { SALE_MODEL_NAME } from "../sales/constants.js";

export const PAYMENT_RECORD_MODEL_NAME = "payment_record";

const paymentLineSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: PAYMENT_METHOD_VALUES.filter((value) => value !== "mixed"),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reference: {
      type: String,
      trim: true,
      default: "",
    },
    label: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const paymentRecordSchema = new mongoose.Schema(
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
    sourceType: {
      type: String,
      enum: ["pos_sale"],
      required: true,
      index: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: SALE_MODEL_NAME,
      required: true,
      index: true,
    },
    documentNumber: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: CUSTOMER_MODEL_NAME,
      default: null,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHOD_VALUES,
      default: "cash",
    },
    paymentMode: {
      type: String,
      enum: PAYMENT_METHOD_VALUES,
      default: "cash",
    },
    payments: {
      type: [paymentLineSchema],
      default: [],
    },
    receivedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    changeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "NPR",
      trim: true,
    },
    status: {
      type: String,
      enum: POS_PAYMENT_STATUS_VALUES,
      default: "paid",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
  },
  { timestamps: true }
);

paymentRecordSchema.index({ orgId: 1, branchId: 1, createdAt: -1 });
paymentRecordSchema.index({ orgId: 1, branchId: 1, customerId: 1, createdAt: -1 });
paymentRecordSchema.index({ sourceType: 1, sourceId: 1 }, { unique: true });

const PaymentRecordModel =
  mongoose.models[PAYMENT_RECORD_MODEL_NAME] ||
  mongoose.model(PAYMENT_RECORD_MODEL_NAME, paymentRecordSchema);

export default PaymentRecordModel;
