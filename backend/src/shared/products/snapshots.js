import { DEFAULT_VAT_RATE } from "../../core/utils/nepal.js";
import {
  DEFAULT_PRODUCT_CATEGORY,
  DEFAULT_PRODUCT_TYPE,
  DEFAULT_PRODUCT_UNIT,
  DEFAULT_REORDER_LEVEL,
} from "./constants.js";
import { normalizeProductPayload } from "./validation.js";

const normalizeSnapshotName = (value = "") => String(value || "").trim().toLowerCase();

export const buildProductIdentitySnapshot = (source = {}) => {
  const normalized = normalizeProductPayload({
    name: source.name ?? source.productName ?? "",
    code: source.code ?? "",
    sku: source.sku ?? "",
    barcode: source.barcode ?? "",
    description: source.description ?? "",
    type:
      source.productType ??
      source.type ??
      (source.trackStock === false ? "service" : DEFAULT_PRODUCT_TYPE),
    category: source.category ?? DEFAULT_PRODUCT_CATEGORY,
    categoryId: source.categoryId ?? null,
    menuCategory: source.menuCategory ?? "",
    unit: source.unit ?? DEFAULT_PRODUCT_UNIT,
    unitId: source.unitId ?? null,
    costPrice: source.costPrice ?? 0,
    sellingPrice: source.sellingPrice ?? source.unitPrice ?? 0,
    taxRate: source.taxRate ?? source.vatRate ?? DEFAULT_VAT_RATE,
    taxId: source.taxId ?? null,
    lowStockAlert: source.lowStockAlert ?? source.reorderLevel ?? DEFAULT_REORDER_LEVEL,
    trackStock: source.trackStock,
    preparationTime: source.preparationTime ?? 0,
    isAvailable: source.isAvailable ?? true,
    isActive: source.isActive ?? true,
    imageUrl: source.imageUrl ?? "",
    modifiers: Array.isArray(source.modifiers) ? source.modifiers : [],
    recipe: Array.isArray(source.recipe) ? source.recipe : [],
  });

  return {
    name: normalized.name || "",
    code: normalized.code || "",
    sku: normalized.sku || "",
    barcode: normalized.barcode || "",
    description: normalized.description || "",
    productType: normalized.productType || DEFAULT_PRODUCT_TYPE,
    category: normalized.category || DEFAULT_PRODUCT_CATEGORY,
    categoryId: normalized.categoryId ?? null,
    menuCategory: normalized.menuCategory || "",
    unit: normalized.unit || DEFAULT_PRODUCT_UNIT,
    unitId: normalized.unitId ?? null,
    costPrice: Number(normalized.costPrice) || 0,
    sellingPrice: Number(normalized.sellingPrice) || 0,
    taxRate: normalized.taxRate ?? DEFAULT_VAT_RATE,
    taxId: normalized.taxId ?? null,
    lowStockAlert: normalized.lowStockAlert ?? DEFAULT_REORDER_LEVEL,
    trackStock: normalized.trackStock !== false,
    preparationTime: Number(normalized.preparationTime) || 0,
    isAvailable: normalized.isAvailable ?? true,
    isActive: normalized.isActive ?? true,
    imageUrl: normalized.imageUrl || "",
    modifiers: normalized.modifiers || [],
    recipe: normalized.recipe || [],
  };
};

export const buildInventoryProductSnapshot = ({
  product = null,
  payload = {},
} = {}) => {
  const identity = buildProductIdentitySnapshot(product || payload);
  const productName =
    product?.name ||
    String(payload.productName || payload.name || identity.name || "").trim();
  const rawQuantity =
    payload.quantity ?? payload.stockQty ?? payload.currentStock ?? product?.stockQty ?? 0;
  const quantity = Number(rawQuantity);

  return {
    productId: product?._id || payload.productId || null,
    productName,
    normalizedName: normalizeSnapshotName(productName),
    quantity: Number.isFinite(quantity) ? quantity : 0,
    costPrice: identity.costPrice,
    sellingPrice: identity.sellingPrice,
    category: identity.category,
    supplier: String(payload.supplier || "").trim(),
    lowStockAlert: identity.lowStockAlert,
    vatRate: identity.taxRate,
    sku: identity.sku,
    barcode: identity.barcode,
  };
};
