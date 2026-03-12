import mongoose from "mongoose";
import { PAYMENT_METHOD_VALUES } from "../payment-methods/index.js";
import {
  ACCOUNTING_ENTRY_KIND_VALUES,
  ACCOUNTING_ENTRY_STATE_VALUES,
  ACCOUNTING_SOURCE_TYPE_VALUES,
} from "./constants.js";

const paymentBreakdownSchema = new mongoose.Schema(
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
    label: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
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
    creditAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    cashAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    nonCashAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHOD_VALUES,
      default: "cash",
    },
    paymentBreakdown: {
      type: [paymentBreakdownSchema],
      default: [],
    },
    sourceType: {
      type: String,
      enum: ACCOUNTING_SOURCE_TYPE_VALUES,
      default: "manual",
      index: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    sourceDocumentNo: {
      type: String,
      trim: true,
      default: "",
    },
    entryKind: {
      type: String,
      enum: ACCOUNTING_ENTRY_KIND_VALUES,
      default: "manual_expense",
    },
    entryState: {
      type: String,
      enum: ACCOUNTING_ENTRY_STATE_VALUES,
      default: "active",
    },
    isSystemGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ orgId: 1, branchId: 1, date: -1 });
transactionSchema.index({ orgId: 1, branchId: 1, type: 1, date: -1 });
transactionSchema.index(
  { sourceType: 1, sourceId: 1 },
  {
    unique: true,
    partialFilterExpression: { sourceId: { $exists: true, $ne: null } },
  }
);

const TransactionModel =
  mongoose.models.transaction ||
  mongoose.model("transaction", transactionSchema);

export default TransactionModel;
