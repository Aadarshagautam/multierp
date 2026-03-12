import test from "node:test";
import assert from "node:assert/strict";
import {
  buildStockMovementPayload,
  calculateNextStockQuantity,
} from "../src/shared/stock-movements/index.js";
import {
  createPurchaseSchema,
  returnPurchaseSchema,
} from "../src/modules/purchases/validation.js";

test("calculateNextStockQuantity blocks negative stock by default", () => {
  assert.throws(
    () =>
      calculateNextStockQuantity({
        currentQty: 3,
        quantityDelta: -4,
        productName: "Tokla Tea 500g",
      }),
    /Insufficient stock/
  );
});

test("calculateNextStockQuantity rounds Nepal retail stock quantities safely", () => {
  assert.deepEqual(
    calculateNextStockQuantity({
      currentQty: 5,
      quantityDelta: 1.2574,
      productName: "Rice Sack",
    }),
    {
      delta: 1.257,
      nextQty: 6.257,
    }
  );
});

test("buildStockMovementPayload keeps one shared stock identity for purchases", () => {
  const payload = buildStockMovementPayload({
    productId: "product-1",
    inventoryItemId: "inventory-1",
    type: "IN",
    qty: 10,
    reason: "Purchase delivery",
    note: "Hulas Trading",
    sourceType: "purchase",
    sourceId: "purchase-1",
    stockBefore: 4,
    stockAfter: 14,
    unitCost: 120,
    refPurchaseId: "purchase-1",
    referenceNo: "purchase-1",
    context: {
      orgId: "org-1",
      membership: { branchId: "branch-1" },
      userId: "user-1",
    },
  });

  assert.deepEqual(payload, {
    orgId: "org-1",
    branchId: "branch-1",
    productId: "product-1",
    inventoryItemId: "inventory-1",
    type: "IN",
    qty: 10,
    reason: "Purchase delivery",
    note: "Hulas Trading",
    sourceType: "purchase",
    sourceId: "purchase-1",
    stockBefore: 4,
    stockAfter: 14,
    unitCost: 120,
    refSaleId: null,
    refPurchaseId: "purchase-1",
    referenceNo: "purchase-1",
    createdBy: "user-1",
  });
});

test("createPurchaseSchema normalizes a delivered supplier entry", () => {
  const result = createPurchaseSchema.safeParse({
    supplierName: "  Hulas Trading  ",
    productName: "  Wai Wai Noodles  ",
    quantity: "12",
    unitPrice: "25.5",
    purchaseDate: "2026-03-11",
    deliveryStatus: "delivered",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.supplierName, "Hulas Trading");
  assert.equal(result.data.productName, "Wai Wai Noodles");
  assert.equal(result.data.quantity, 12);
  assert.equal(result.data.unitPrice, 25.5);
  assert.equal(result.data.paymentMethod, "cash");
  assert.equal(result.data.paymentStatus, "pending");
});

test("returnPurchaseSchema rejects zero-quantity returns", () => {
  const result = returnPurchaseSchema.safeParse({
    quantity: 0,
  });

  assert.equal(result.success, false);
});
