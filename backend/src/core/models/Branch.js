import mongoose from "mongoose";
import { DEFAULT_COUNTRY } from "../utils/nepal.js";

const branchSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    businessType: {
      type: String,
      enum: ["restaurant", "cafe", "shop", "general"],
      default: "general",
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      country: { type: String, default: DEFAULT_COUNTRY },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
  },
  { timestamps: true }
);

branchSchema.index({ orgId: 1, name: 1 });

const BranchModel = mongoose.model("branch", branchSchema);

export default BranchModel;
