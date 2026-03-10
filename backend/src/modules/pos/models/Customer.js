import mongoose from "mongoose";

const posCustomerSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    creditBalance: { type: Number, default: 0 },
    // Loyalty & CRM
    loyaltyPoints: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    visitCount: { type: Number, default: 0 },
    tier: { type: String, enum: ["bronze", "silver", "gold", "platinum"], default: "bronze" },
    birthday: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

posCustomerSchema.index(
  { orgId: 1, branchId: 1, phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $ne: "" } } }
);
posCustomerSchema.index({ orgId: 1, branchId: 1, name: "text" });
posCustomerSchema.index({ orgId: 1, branchId: 1, tier: 1 });

const PosCustomer = mongoose.model("pos_customer", posCustomerSchema);

export default PosCustomer;
