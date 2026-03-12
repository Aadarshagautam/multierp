import Inventory from "./model.js";
import { buildTenantFilter } from "../../core/utils/tenant.js";
import { getEffectiveReceivedQty } from "../purchases/utils.js";
import {
  buildInventoryProductSnapshot,
  syncProductFromInventoryItem,
} from "../../shared/products/index.js";
import {
  buildStockMovementPayload,
  createStockMovement,
} from "../../shared/stock-movements/index.js";

export const normalizeInventoryName = (value = "") => value.trim().toLowerCase();

export const buildInventoryScopeFilter = (req) => {
  const filter = buildTenantFilter(req);

  if (req.orgId && req.membership?.branchId) {
    filter.branchId = req.membership.branchId;
  }

  return filter;
};

export const getInventoryBranchId = (req) => req.membership?.branchId || null;

const roundQty = (value) => Math.round(Number(value) * 1000) / 1000;

const findInventoryByName = async ({ productName, req, session }) => {
  const normalizedName = normalizeInventoryName(productName);
  if (!normalizedName) return null;

  return Inventory.findOne({
    ...buildInventoryScopeFilter(req),
    $or: [{ normalizedName }, { productName: productName.trim() }],
  }).session(session);
};

const findInventoryByProductReference = async ({
  productId = null,
  productName = "",
  req,
  session,
}) => {
  if (productId) {
    const itemByProductId = await Inventory.findOne({
      ...buildInventoryScopeFilter(req),
      productId,
    }).session(session);

    if (itemByProductId) return itemByProductId;
  }

  return findInventoryByName({ productName, req, session });
};

export const adjustInventoryQuantity = async ({
  inventoryItemId = null,
  productId = null,
  productName = "",
  quantityDelta,
  unitCost = 0,
  supplier = "",
  req,
  session,
  allowCreate = false,
  allowNegative = false,
  movement = null,
}) => {
  const delta = roundQty(quantityDelta);
  if (!delta) return null;

  let item = null;
  let previousQuantity = 0;
  if (inventoryItemId) {
    item = await Inventory.findOne({
      _id: inventoryItemId,
      ...buildInventoryScopeFilter(req),
    }).session(session);
  } else {
    item = await findInventoryByProductReference({
      productId,
      productName,
      req,
      session,
    });
  }

  if (!item && !allowCreate) {
    throw new Error(`Inventory item not found for "${productName.trim()}"`);
  }

  if (!item) {
    const safeName = productName.trim();
    const safeUnitCost = Number(unitCost) || 0;
    const snapshot = buildInventoryProductSnapshot({
      payload: {
        productId,
        productName: safeName,
        quantity: delta,
        costPrice: safeUnitCost,
        sellingPrice: safeUnitCost,
        category: "",
        supplier: supplier.trim(),
        lowStockAlert: 10,
        vatRate: 0,
        sku: "",
        barcode: "",
      },
    });
    const [created] = await Inventory.create(
      [{
        ...snapshot,
        userId: req.userId,
        orgId: req.orgId || null,
        branchId: getInventoryBranchId(req),
      }],
      { session }
    );
    item = created;
    previousQuantity = 0;
  } else {
    previousQuantity = roundQty(item.quantity || 0);
    const nextQty = roundQty((item.quantity || 0) + delta);
    if (!allowNegative && nextQty < 0) {
      throw new Error(
        `Insufficient stock for "${item.productName}". Available: ${item.quantity}, Required: ${Math.abs(delta)}`
      );
    }

    item.quantity = nextQty;
    if (delta > 0 && Number(unitCost) >= 0) {
      item.costPrice = Number(unitCost);
    }
    if (supplier.trim()) {
      item.supplier = supplier.trim();
    }
    if (!item.normalizedName) {
      item.normalizedName = normalizeInventoryName(item.productName);
    }

    await item.save({ session });
  }

  const syncedProduct = await syncProductFromInventoryItem({
    inventoryItem: {
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      category: item.category,
      lowStockAlert: item.lowStockAlert,
      vatRate: item.vatRate,
      sku: item.sku,
      barcode: item.barcode,
    },
    context: req,
    productId: productId || item.productId,
    session,
  });

  if (
    syncedProduct &&
    (!item.productId || item.productId.toString() !== syncedProduct._id.toString())
  ) {
    item.productId = syncedProduct._id;
    await item.save({ session });
  }

  const linkedProductId = syncedProduct?._id || item.productId || productId || null;

  if (linkedProductId) {
    await createStockMovement(
      buildStockMovementPayload({
        productId: linkedProductId,
        inventoryItemId: item._id,
        type: movement?.type || (delta >= 0 ? "IN" : "OUT"),
        qty: Math.abs(delta),
        reason:
          movement?.reason ||
          (delta >= 0 ? "Stock increase" : "Stock decrease"),
        note: movement?.note || "",
        sourceType: movement?.sourceType || "manual",
        sourceId: movement?.sourceId || item._id,
        stockBefore: previousQuantity,
        stockAfter: item.quantity,
        unitCost:
          Number.isFinite(Number(unitCost)) && Number(unitCost) >= 0
            ? Number(unitCost)
            : null,
        refPurchaseId: movement?.refPurchaseId || null,
        referenceNo: movement?.referenceNo || "",
        context: req,
      }),
      { session }
    );
  }
  return item;
};

export const syncPurchaseInventory = async ({
  previousPurchase = null,
  nextPurchase = null,
  req,
  session,
}) => {
  const allowNegative = process.env.ALLOW_NEGATIVE_STOCK === "true";
  const previousQty = getEffectiveReceivedQty(previousPurchase);
  const nextQty = getEffectiveReceivedQty(nextPurchase);
  const previousProductId = previousPurchase?.productId || null;
  const nextProductId = nextPurchase?.productId || null;
  const sameProductId =
    previousProductId &&
    nextProductId &&
    previousProductId.toString() === nextProductId.toString();
  const sameProductName =
    previousPurchase &&
    nextPurchase &&
    previousPurchase.productName?.trim() === nextPurchase.productName?.trim();
  const scopedProductId = nextProductId || previousProductId || null;

  if (sameProductId || sameProductName) {
    const delta = roundQty(nextQty - previousQty);
    if (!delta) return null;

    return adjustInventoryQuantity({
      productId: scopedProductId,
      productName: nextPurchase.productName || previousPurchase.productName,
      quantityDelta: delta,
      unitCost: nextPurchase.unitPrice,
      supplier: nextPurchase.supplierName || "",
      req,
      session,
      allowCreate: delta > 0,
      allowNegative: delta > 0 ? true : allowNegative,
      movement: {
        type: delta > 0 ? "IN" : "OUT",
        reason: delta > 0 ? "Purchase delivery" : "Purchase return",
        note: nextPurchase.supplierName || "",
        sourceType: delta > 0 ? "purchase" : "purchase_return",
        sourceId: nextPurchase?._id || previousPurchase?._id || null,
        refPurchaseId: nextPurchase?._id || previousPurchase?._id || null,
        referenceNo:
          nextPurchase?._id?.toString?.() || previousPurchase?._id?.toString?.() || "",
      },
    });
  }

  if (previousQty > 0) {
    await adjustInventoryQuantity({
      productId: previousProductId,
      productName: previousPurchase.productName,
      quantityDelta: -previousQty,
      unitCost: previousPurchase.unitPrice,
      supplier: previousPurchase.supplierName || "",
      req,
      session,
      allowNegative,
      movement: {
        type: "OUT",
        reason: "Purchase sync",
        note: previousPurchase.supplierName || "",
        sourceType: "purchase_return",
        sourceId: previousPurchase?._id || null,
        refPurchaseId: previousPurchase?._id || null,
        referenceNo: previousPurchase?._id?.toString?.() || "",
      },
    });
  }

  if (nextQty > 0) {
    return adjustInventoryQuantity({
      productId: nextProductId,
      productName: nextPurchase.productName,
      quantityDelta: nextQty,
      unitCost: nextPurchase.unitPrice,
      supplier: nextPurchase.supplierName || "",
      req,
      session,
      allowCreate: true,
      allowNegative: true,
      movement: {
        type: "IN",
        reason: "Purchase delivery",
        note: nextPurchase.supplierName || "",
        sourceType: "purchase",
        sourceId: nextPurchase?._id || null,
        refPurchaseId: nextPurchase?._id || null,
        referenceNo: nextPurchase?._id?.toString?.() || "",
      },
    });
  }

  return null;
};

export const consumeRecipeStock = async ({
  product,
  saleQty,
  req,
  session,
  allowNegative = false,
  movement = null,
}) => {
  for (const ingredient of product.recipe || []) {
    const qtyRequired = roundQty((ingredient.qty || 0) * saleQty);
    if (!ingredient.inventoryItemId || qtyRequired <= 0) continue;

    await adjustInventoryQuantity({
      inventoryItemId: ingredient.inventoryItemId,
      productName: ingredient.ingredientName || product.name,
      quantityDelta: -qtyRequired,
      req,
      session,
      allowNegative,
      movement: {
        type: "OUT",
        reason: movement?.reason || "Recipe consumption",
        note: movement?.note || ingredient.ingredientName || product.name,
        sourceType: movement?.sourceType || "recipe_sale",
        sourceId: movement?.sourceId || null,
        referenceNo: movement?.referenceNo || "",
      },
    });
  }
};

export const restoreRecipeStock = async ({
  product,
  saleQty,
  req,
  session,
  movement = null,
}) => {
  for (const ingredient of product.recipe || []) {
    const qtyToRestore = roundQty((ingredient.qty || 0) * saleQty);
    if (!ingredient.inventoryItemId || qtyToRestore <= 0) continue;

    await adjustInventoryQuantity({
      inventoryItemId: ingredient.inventoryItemId,
      productName: ingredient.ingredientName || product.name,
      quantityDelta: qtyToRestore,
      req,
      session,
      allowNegative: true,
      movement: {
        type: "IN",
        reason: movement?.reason || "Recipe restore",
        note: movement?.note || ingredient.ingredientName || product.name,
        sourceType: movement?.sourceType || "recipe_refund",
        sourceId: movement?.sourceId || null,
        referenceNo: movement?.referenceNo || "",
      },
    });
  }
};
