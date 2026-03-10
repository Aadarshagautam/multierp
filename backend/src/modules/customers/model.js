import mongoose from "mongoose";
import { DEFAULT_COUNTRY } from "../../core/utils/nepal.js";

const customerSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    company: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      country: { type: String, default: DEFAULT_COUNTRY },
    },
    gstin: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

customerSchema.index({ userId: 1, createdAt: -1 });
customerSchema.index({ userId: 1, name: 1 });

const CustomerModel = mongoose.model("customer", customerSchema);

export default CustomerModel;
