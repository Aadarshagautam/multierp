import Inventory, { InventoryMovement } from "./model.js";
import { buildTenantFilter } from "../../core/utils/tenant.js";
import { getEffectiveReceivedQty } from "../purchases/utils.js";
import { syncProductFromInventoryItem } from "../../shared/products/service.js";

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

export const adjustInventoryQuantity = async ({
  inventoryItemId = null,
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
  if (inventoryItemId) {
    item = await Inventory.findOne({
      _id: inventoryItemId,
      ...buildInventoryScopeFilter(req),
    }).session(session);
  } else {
    item = await findInventoryByName({ productName, req, session });
  }

  if (!item && !allowCreate) {
    throw new Error(`Inventory item not found for "${productName.trim()}"`);
  }

  if (!item) {
    const safeName = productName.trim();
    const safeUnitCost = Number(unitCost) || 0;
    const [created] = await Inventory.create(
      [{
        userId: req.userId,
        orgId: req.orgId || null,
        branchId: getInventoryBranchId(req),
        productName: safeName,
        normalizedName: normalizeInventoryName(safeName),
        quantity: delta,
        costPrice: safeUnitCost,
        sellingPrice: safeUnitCost,
        category: "",
        supplier: supplier.trim(),
        lowStockAlert: 10,
        vatRate: 0,
        sku: "",
        barcode: "",
      }],
      { session }
    );
    item = created;
  } else {
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
    productId: item.productId,
    session,
  });

  if (
    syncedProduct &&
    (!item.productId || item.productId.toString() !== syncedProduct._id.toString())
  ) {
    item.productId = syncedProduct._id;
    await item.save({ session });
  }

  if (movement) {
    await InventoryMovement.create(
      [{
        userId: req.userId,
        orgId: req.orgId || null,
        branchId: getInventoryBranchId(req),
        inventoryItemId: item._id,
        type: movement.type || (delta >= 0 ? "IN" : "OUT"),
        qty: Math.abs(delta),
        reason: movement.reason || "",
        note: movement.note || "",
        createdBy: req.userId,
      }],
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
  const sameProductName =
    previousPurchase &&
    nextPurchase &&
    previousPurchase.productName?.trim() === nextPurchase.productName?.trim();

  if (sameProductName) {
    const delta = roundQty(nextQty - previousQty);
    if (!delta) return;

    await adjustInventoryQuantity({
      productName: nextPurchase.productName,
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
      },
    });
    return;
  }

  if (previousQty > 0) {
    await adjustInventoryQuantity({
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
      },
    });
  }

  if (nextQty > 0) {
    await adjustInventoryQuantity({
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
      },
    });
  }
};

export const consumeRecipeStock = async ({
  product,
  saleQty,
  req,
  session,
  allowNegative = false,
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
    });
  }
};

export const restoreRecipeStock = async ({
  product,
  saleQty,
  req,
  session,
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
    });
  }
};
