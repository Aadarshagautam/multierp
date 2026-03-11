import mongoose from "mongoose";
import {
  DEFAULT_PRODUCT_CATEGORY,
  DEFAULT_PRODUCT_TYPE,
  DEFAULT_PRODUCT_UNIT,
  DEFAULT_REORDER_LEVEL,
  PRODUCT_MODEL_NAME,
  PRODUCT_TYPE_VALUES,
} from "./constants.js";

const modifierOptionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    price: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const modifierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    required: { type: Boolean, default: false },
    multiSelect: { type: Boolean, default: false },
    options: [modifierOptionSchema],
  },
  { _id: false }
);

const recipeItemSchema = new mongoose.Schema(
  {
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "inventory",
      required: true,
    },
    ingredientName: { type: String, trim: true, default: "" },
    qty: { type: Number, required: true, min: 0 },
    unit: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
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
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, default: "" },
    sku: { type: String, trim: true, default: "" },
    barcode: { type: String, trim: true, default: "" },
    description: { type: String, default: "", trim: true },
    productType: {
      type: String,
      alias: "type",
      enum: PRODUCT_TYPE_VALUES,
      default: DEFAULT_PRODUCT_TYPE,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product_category",
      default: null,
    },
    category: { type: String, trim: true, default: DEFAULT_PRODUCT_CATEGORY },
    menuCategory: { type: String, trim: true, default: "" },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "unit",
      default: null,
    },
    unit: { type: String, default: DEFAULT_PRODUCT_UNIT, trim: true },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    stockQty: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      alias: "currentStock",
    },
    taxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tax",
      default: null,
    },
    taxRate: { type: Number, default: 13, min: 0, max: 100 },
    trackStock: { type: Boolean, default: true },
    lowStockAlert: {
      type: Number,
      default: DEFAULT_REORDER_LEVEL,
      min: 0,
      alias: "reorderLevel",
    },
    preparationTime: { type: Number, default: 0, min: 0 },
    isAvailable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    imageUrl: { type: String, default: "", trim: true },
    modifiers: [modifierSchema],
    recipe: [recipeItemSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.pre("validate", function productDefaults(next) {
  if (!this.code) {
    this.code = this.sku || this.barcode || "";
  }

  if (!this.productType) {
    this.productType = this.trackStock === false ? "service" : DEFAULT_PRODUCT_TYPE;
  }

  if (this.trackStock === undefined || this.trackStock === null) {
    this.trackStock = this.productType === "stock";
  }

  if (!this.category) {
    this.category = DEFAULT_PRODUCT_CATEGORY;
  }

  if (!this.unit) {
    this.unit = DEFAULT_PRODUCT_UNIT;
  }

  if (!this.createdBy) {
    this.createdBy = this.userId;
  }

  if (!this.updatedBy) {
    this.updatedBy = this.userId;
  }

  next();
});

productSchema.index(
  { orgId: 1, branchId: 1, sku: 1 },
  { unique: true, partialFilterExpression: { sku: { $ne: "" } } }
);
productSchema.index(
  { orgId: 1, branchId: 1, barcode: 1 },
  { unique: true, partialFilterExpression: { barcode: { $ne: "" } } }
);
productSchema.index({ orgId: 1, branchId: 1, code: 1 });
productSchema.index({ orgId: 1, branchId: 1, name: "text" });
productSchema.index({ orgId: 1, branchId: 1, category: 1 });
productSchema.index({ orgId: 1, branchId: 1, menuCategory: 1 });

const ProductModel =
  mongoose.models[PRODUCT_MODEL_NAME] ||
  mongoose.model(PRODUCT_MODEL_NAME, productSchema);

export default ProductModel;
