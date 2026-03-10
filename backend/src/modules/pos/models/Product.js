import mongoose from "mongoose";

const modifierOptionSchema = new mongoose.Schema(
  { label: { type: String, required: true }, price: { type: Number, default: 0 } },
  { _id: false }
);

const modifierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },   // "Size", "Spice Level", "Add-ons"
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

const posProductSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "organization", index: true, default: null },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "branch", index: true, default: null },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, default: "" },
    barcode: { type: String, trim: true, default: "" },
    description: { type: String, default: "" },
    category: { type: String, trim: true, default: "General" },
    menuCategory: { type: String, trim: true, default: "" }, // Starters / Mains / Beverages / Desserts
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    stockQty: { type: Number, required: true, default: 0 },
    unit: { type: String, default: "pcs", trim: true },
    taxRate: { type: Number, default: 13, min: 0, max: 100 },
    lowStockAlert: { type: Number, default: 10 },
    preparationTime: { type: Number, default: 0 },  // minutes
    isAvailable: { type: Boolean, default: true },   // sold-out toggle
    isActive: { type: Boolean, default: true },
    imageUrl: { type: String, default: "" },
    modifiers: [modifierSchema],
    recipe: [recipeItemSchema],
  },
  { timestamps: true }
);

posProductSchema.index({ orgId: 1, branchId: 1, sku: 1 }, { unique: true, partialFilterExpression: { sku: { $ne: "" } } });
posProductSchema.index({ orgId: 1, branchId: 1, barcode: 1 }, { unique: true, partialFilterExpression: { barcode: { $ne: "" } } });
posProductSchema.index({ orgId: 1, branchId: 1, name: "text" });
posProductSchema.index({ orgId: 1, branchId: 1, category: 1 });
posProductSchema.index({ orgId: 1, branchId: 1, menuCategory: 1 });

const PosProduct = mongoose.model("pos_product", posProductSchema);
export default PosProduct;
