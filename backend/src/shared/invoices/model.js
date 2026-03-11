import mongoose from "mongoose";
import {
  DEFAULT_COUNTRY,
  INVOICE_PAYMENT_METHODS,
} from "../../core/utils/nepal.js";
import { PRODUCT_MODEL_NAME } from "../products/constants.js";

const invoiceItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: PRODUCT_MODEL_NAME,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    vatRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    vatAmount: {
      type: Number,
      default: 0,
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      default: "flat",
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
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
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customer",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      default: "",
    },
    customerPhone: {
      type: String,
      default: "",
    },
    customerAddress: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      country: { type: String, default: DEFAULT_COUNTRY },
    },
    customerGstin: {
      type: String,
      default: "",
    },
    items: [invoiceItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    totalVat: {
      type: Number,
      default: 0,
    },
    totalItemDiscount: {
      type: Number,
      default: 0,
    },
    overallDiscountType: {
      type: String,
      enum: ["percentage", "flat", "none"],
      default: "none",
    },
    overallDiscountValue: {
      type: Number,
      default: 0,
    },
    overallDiscountAmount: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    withoutVat: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "cancelled"],
      default: "draft",
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidDate: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: INVOICE_PAYMENT_METHODS,
      default: "cash",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

invoiceSchema.index({ userId: 1, createdAt: -1 });
invoiceSchema.index({ userId: 1, status: 1 });
invoiceSchema.index({ userId: 1, customerId: 1 });

const InvoiceModel = mongoose.model("invoice", invoiceSchema);

export default InvoiceModel;
