import mongoose from "mongoose";

const legacyPosCustomerSchema = new mongoose.Schema(
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
    loyaltyPoints: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    visitCount: { type: Number, default: 0 },
    tier: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum"],
      default: "bronze",
    },
    birthday: { type: String, default: "" },
    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const LegacyPosCustomerModel = mongoose.model(
  "pos_customer",
  legacyPosCustomerSchema
);

export default LegacyPosCustomerModel;
