import mongoose from "mongoose";
import { DEFAULT_COUNTRY } from "../../core/utils/nepal.js";
import {
  CUSTOMER_MODEL_NAME,
  CUSTOMER_SOURCE_VALUES,
  CUSTOMER_TIER_VALUES,
  CUSTOMER_TYPES,
} from "./constants.js";
import {
  buildAddressText,
  computeCustomerTier,
  normalizeAddress,
  normalizePhoneDigits,
  normalizeTaxNumber,
} from "./utils.js";

const customerAddressSchema = new mongoose.Schema(
  {
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    country: { type: String, default: DEFAULT_COUNTRY },
  },
  { _id: false }
);

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
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branch",
      index: true,
      default: null,
    },
    legacyPosCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
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
    phoneDigits: {
      type: String,
      default: "",
      index: true,
    },
    company: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: customerAddressSchema,
      default: () => ({
        street: "",
        city: "",
        state: "",
        pincode: "",
        country: DEFAULT_COUNTRY,
      }),
    },
    taxNumber: {
      type: String,
      default: "",
      trim: true,
    },
    customerType: {
      type: String,
      enum: CUSTOMER_TYPES,
      default: "regular",
    },
    creditLimit: {
      type: Number,
      default: null,
      min: 0,
    },
    creditBalance: {
      type: Number,
      default: 0,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    visitCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    tier: {
      type: String,
      enum: CUSTOMER_TIER_VALUES,
      default: "bronze",
    },
    birthday: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    lastSaleAt: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      enum: CUSTOMER_SOURCE_VALUES,
      default: "shared",
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

customerSchema.virtual("gstin")
  .get(function getGstin() {
    return this.taxNumber || "";
  })
  .set(function setGstin(value) {
    this.taxNumber = normalizeTaxNumber(value);
  });

customerSchema.virtual("addressText").get(function getAddressText() {
  return buildAddressText(this.address || {});
});

customerSchema.pre("validate", function normalizeCustomer(next) {
  this.phone = String(this.phone || "").trim();
  this.phoneDigits = normalizePhoneDigits(this.phone);
  this.email = String(this.email || "").trim().toLowerCase();
  this.taxNumber = normalizeTaxNumber(this.taxNumber || "");
  this.address = normalizeAddress(this.address);
  this.tags = Array.isArray(this.tags)
    ? [...new Set(this.tags.map((tag) => String(tag || "").trim()).filter(Boolean))]
    : [];
  this.name = String(this.name || "").trim();
  this.company = String(this.company || "").trim();
  this.notes = String(this.notes || "").trim();
  this.birthday = String(this.birthday || "").trim();
  this.tier = computeCustomerTier(this.totalSpent || 0);

  if (!this.name && this.customerType === "walk_in") {
    this.name = "Walk-in Customer";
  }

  next();
});

customerSchema.index({ userId: 1, isActive: 1, createdAt: -1 });
customerSchema.index({ orgId: 1, branchId: 1, isActive: 1, createdAt: -1 });
customerSchema.index({ orgId: 1, branchId: 1, phoneDigits: 1 });
customerSchema.index({ userId: 1, phoneDigits: 1 });
customerSchema.index({ orgId: 1, branchId: 1, name: 1 });
customerSchema.index({ userId: 1, name: 1 });
customerSchema.index({ orgId: 1, branchId: 1, customerType: 1, isActive: 1 });

const CustomerModel = mongoose.model(CUSTOMER_MODEL_NAME, customerSchema);

export default CustomerModel;
