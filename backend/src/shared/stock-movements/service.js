import Inventory from "../../modules/inventory/model.js";
import { buildTenantFilter } from "../../core/utils/tenant.js";
import {
  buildInventoryProductSnapshot,
} from "../products/snapshots.js";
import { buildProductScopeFilter } from "../products/repository.js";
import ProductModel from "../products/model.js";
import StockMovementModel from "./model.js";

export const roundStockQuantity = (value) =>
  Math.round(Number(value || 0) * 1000) / 1000;

export const calculateNextStockQuantity = ({
  currentQty = 0,
  quantityDelta = 0,
  allowNegative = false,
  productName = "Product",
}) => {
  const delta = roundStockQuantity(quantityDelta);
  const nextQty = roundStockQuantity((Number(currentQty) || 0) + delta);

  if (!allowNegative && nextQty < 0) {
    throw new Error(
      `Insufficient stock for "${productName}". Available: ${Number(currentQty) || 0}, Required: ${Math.abs(delta)}`
    );
  }

  return {
    delta,
    nextQty,
  };
};

export const buildStockMovementScopeFilter = (context = {}) => {
  const filter = buildTenantFilter(context);

  if (context.orgId && context.membership?.branchId) {
    filter.branchId = context.membership.branchId;
  }

  return filter;
};

export const buildStockMovementPayload = ({
  productId,
  inventoryItemId = null,
  type = "ADJUST",
  qty,
  reason = "",
  note = "",
  sourceType = "manual",
  sourceId = null,
  stockBefore = null,
  stockAfter = null,
  unitCost = null,
  refSaleId = null,
  refPurchaseId = null,
  referenceNo = "",
  context = {},
}) => ({
  orgId: context.orgId || null,
  branchId: context.membership?.branchId || null,
  productId,
  inventoryItemId,
  type,
  qty: roundStockQuantity(qty),
  reason: reason || "",
  note: note || "",
  sourceType,
  sourceId,
  stockBefore:
    stockBefore === null || stockBefore === undefined
      ? null
      : roundStockQuantity(stockBefore),
  stockAfter:
    stockAfter === null || stockAfter === undefined
      ? null
      : roundStockQuantity(stockAfter),
  unitCost:
    unitCost === null || unitCost === undefined || unitCost === ""
      ? null
      : Number(unitCost),
  refSaleId: refSaleId || null,
  refPurchaseId: refPurchaseId || null,
  referenceNo,
  createdBy: context.userId,
});

export const createStockMovement = (payload, options = {}) =>
  StockMovementModel.create([payload], options).then(([movement]) => movement);

export const syncInventoryFromProductStock = async ({
  product,
  context = {},
  session = null,
  supplier = "",
  unitCost = null,
  createIfMissing = false,
}) => {
  if (!product?._id) return null;

  let query = Inventory.findOne({
    ...buildStockMovementScopeFilter(context),
    productId: product._id,
  });

  if (session) query = query.session(session);
  let inventoryItem = await query;

  if (!inventoryItem && !createIfMissing) {
    return null;
  }

  const snapshot = buildInventoryProductSnapshot({
    product,
    payload: {
      productId: product._id,
      quantity: product.stockQty,
      costPrice: unitCost ?? product.costPrice,
      sellingPrice: product.sellingPrice,
      supplier: supplier || inventoryItem?.supplier || "",
      lowStockAlert: product.lowStockAlert,
      vatRate: product.taxRate,
      sku: product.sku,
      barcode: product.barcode,
    },
  });

  if (!inventoryItem) {
    const [createdInventoryItem] = await Inventory.create(
      [
        {
          ...snapshot,
          userId: context.userId,
          orgId: context.orgId || null,
          branchId: context.membership?.branchId || null,
        },
      ],
      session ? { session } : undefined
    );

    return createdInventoryItem;
  }

  Object.assign(inventoryItem, {
    ...snapshot,
    supplier: supplier || inventoryItem.supplier || "",
  });
  await inventoryItem.save(session ? { session } : undefined);
  return inventoryItem;
};

export const applyProductStockDelta = async ({
  productId,
  quantityDelta,
  context = {},
  session = null,
  allowNegative = false,
  reason = "",
  note = "",
  sourceType = "manual",
  sourceId = null,
  referenceNo = "",
  refSaleId = null,
  refPurchaseId = null,
  unitCost = null,
  supplier = "",
  createInventoryMirror = true,
}) => {
  if (!productId) {
    throw new Error("A product is required for stock movement.");
  }

  let productQuery = ProductModel.findOne({
    _id: productId,
    ...buildProductScopeFilter(context),
  });

  if (session) productQuery = productQuery.session(session);
  const product = await productQuery;

  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  if (product.trackStock === false || product.productType === "service") {
    return {
      product,
      inventoryItem: null,
      movement: null,
      skipped: true,
    };
  }

  const { delta, nextQty } = calculateNextStockQuantity({
    currentQty: product.stockQty || 0,
    quantityDelta,
    allowNegative,
    productName: product.name,
  });

  if (!delta) {
    return {
      product,
      inventoryItem: null,
      movement: null,
      skipped: true,
    };
  }

  const previousQty = roundStockQuantity(product.stockQty || 0);
  product.stockQty = nextQty;
  if (delta > 0 && Number.isFinite(Number(unitCost)) && Number(unitCost) >= 0) {
    product.costPrice = Number(unitCost);
  }
  await product.save(session ? { session } : undefined);

  const inventoryItem = await syncInventoryFromProductStock({
    product,
    context,
    session,
    supplier,
    unitCost,
    createIfMissing: createInventoryMirror,
  });

  const movement = await createStockMovement(
    buildStockMovementPayload({
      productId: product._id,
      inventoryItemId: inventoryItem?._id || null,
      type: delta > 0 ? "IN" : "OUT",
      qty: Math.abs(delta),
      reason,
      note,
      sourceType,
      sourceId,
      stockBefore: previousQty,
      stockAfter: nextQty,
      unitCost,
      refSaleId,
      refPurchaseId,
      referenceNo,
      context,
    }),
    session ? { session } : undefined
  );

  return {
    product,
    inventoryItem,
    movement,
    stockBefore: previousQty,
    stockAfter: nextQty,
    skipped: false,
  };
};

export const listStockMovements = async ({
  context = {},
  inventoryItemId = null,
  productId = null,
  limit = 50,
}) => {
  const filter = buildStockMovementScopeFilter(context);

  if (inventoryItemId) {
    filter.inventoryItemId = inventoryItemId;
  }

  if (productId) {
    filter.productId = productId;
  }

  return StockMovementModel.find(filter)
    .populate("productId", "name sku barcode category")
    .populate("inventoryItemId", "productName")
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Number(limit) || 50));
};

export const createSaleStockMovement = ({
  productId,
  inventoryItemId = null,
  qty,
  saleId,
  invoiceNo = "",
  req,
  session = null,
  reason = "Sale",
}) =>
  createStockMovement(
    buildStockMovementPayload({
      productId,
      inventoryItemId,
      type: "OUT",
      qty,
      reason,
      sourceType: "sale",
      sourceId: saleId || null,
      refSaleId: saleId || null,
      referenceNo: invoiceNo,
      context: req,
    }),
    session ? { session } : undefined
  );

export const createRefundStockMovement = ({
  productId,
  inventoryItemId = null,
  qty,
  saleId,
  invoiceNo = "",
  req,
  session = null,
}) =>
  createStockMovement(
    buildStockMovementPayload({
      productId,
      inventoryItemId,
      type: "IN",
      qty,
      reason: `Refund - ${invoiceNo}`.trim(),
      sourceType: "sale_refund",
      sourceId: saleId || null,
      refSaleId: saleId || null,
      referenceNo: invoiceNo,
      context: req,
    }),
    session ? { session } : undefined
  );
