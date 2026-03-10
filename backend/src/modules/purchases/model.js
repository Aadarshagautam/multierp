import mongoose from "mongoose";

const purchasePaymentMethods = [
  "cash",
  "card",
  "bank_transfer",
  "esewa",
  "khalti",
  "credit",
  "cheque",
  "other",
];

const supplierSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "organization", default: null, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "branch", default: null, index: true },
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, trim: true },
    contact: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const purchaseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "organization", default: null, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "branch", default: null, index: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "purchase_supplier", default: null },
    supplierName: { type: String, required: true, trim: true },
    supplierContact: { type: String, trim: true, default: "" },
    productName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    outstandingAmount: { type: Number, default: 0, min: 0 },
    creditAmount: { type: Number, default: 0, min: 0 },
    purchaseDate: { type: Date, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: purchasePaymentMethods,
      default: "cash",
    },
    deliveryStatus: {
      type: String,
      enum: ["pending", "in_transit", "delivered", "returned"],
      default: "pending",
    },
    returnedQty: { type: Number, default: 0, min: 0 },
    returnedAmount: { type: Number, default: 0, min: 0 },
    returnNotes: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

supplierSchema.index({ orgId: 1, branchId: 1, normalizedName: 1 }, { unique: true, sparse: true });
supplierSchema.index({ userId: 1, normalizedName: 1 }, { unique: true, sparse: true });
purchaseSchema.index({ orgId: 1, branchId: 1, createdAt: -1 });
purchaseSchema.index({ userId: 1, createdAt: -1 });

export const PurchaseSupplier = mongoose.model("purchase_supplier", supplierSchema);
export const Purchase = mongoose.model("purchase", purchaseSchema);
export { purchasePaymentMethods };
