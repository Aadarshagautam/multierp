import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInventoryProductSnapshot,
  buildProductIdentitySnapshot,
  buildProductScopeFilter,
  createProductSchema,
  mapInventoryItemToProductInput,
  updateProductSchema,
} from "../src/shared/products/index.js";

test("buildProductScopeFilter keeps products inside tenant and branch", () => {
  assert.deepEqual(
    buildProductScopeFilter({
      orgId: "org-1",
      userId: "user-1",
      membership: { branchId: "branch-9" },
    }),
    { orgId: "org-1", branchId: "branch-9" }
  );

  assert.deepEqual(buildProductScopeFilter({ userId: "user-1" }), { userId: "user-1" });
});

test("createProductSchema normalizes shared product aliases", () => {
  const result = createProductSchema.safeParse({
    name: "Chicken Momo",
    type: "service",
    sellingPrice: "180",
    currentStock: "0",
    reorderLevel: "6",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.productType, "service");
  assert.equal(result.data.trackStock, false);
  assert.equal(result.data.stockQty, 0);
  assert.equal(result.data.lowStockAlert, 6);
});

test("updateProductSchema keeps partial updates partial", () => {
  const result = updateProductSchema.safeParse({
    currentStock: "12",
  });

  assert.equal(result.success, true);
  assert.deepEqual(result.data, { stockQty: 12 });
});

test("mapInventoryItemToProductInput builds a stock-tracked shared product payload", () => {
  const mapped = mapInventoryItemToProductInput({
    productName: "Coca Cola 500ml",
    quantity: 24,
    costPrice: 38,
    sellingPrice: 50,
    category: "Beverages",
    vatRate: 13,
    sku: "COKE-500",
  });

  assert.equal(mapped.name, "Coca Cola 500ml");
  assert.equal(mapped.productType, "stock");
  assert.equal(mapped.trackStock, true);
  assert.equal(mapped.stockQty, 24);
  assert.equal(mapped.taxRate, 13);
  assert.equal(mapped.sku, "COKE-500");
});

test("buildProductIdentitySnapshot centralizes product identity, price, and tax fields", () => {
  const snapshot = buildProductIdentitySnapshot({
    productName: "Buff Momo",
    sku: "MOMO-001",
    barcode: "1234567890123",
    category: "Mains",
    costPrice: 110,
    sellingPrice: 180,
    vatRate: 13,
    trackStock: false,
  });

  assert.equal(snapshot.name, "Buff Momo");
  assert.equal(snapshot.sku, "MOMO-001");
  assert.equal(snapshot.barcode, "1234567890123");
  assert.equal(snapshot.category, "Mains");
  assert.equal(snapshot.costPrice, 110);
  assert.equal(snapshot.sellingPrice, 180);
  assert.equal(snapshot.taxRate, 13);
  assert.equal(snapshot.productType, "service");
  assert.equal(snapshot.trackStock, false);
});

test("buildInventoryProductSnapshot keeps inventory rows aligned with the shared product identity", () => {
  const product = {
    _id: "prod-1",
    name: "Cold Brew",
    sku: "CB-1",
    barcode: "999",
    category: "Beverages",
    costPrice: 90,
    sellingPrice: 140,
    taxRate: 13,
    lowStockAlert: 5,
  };

  const snapshot = buildInventoryProductSnapshot({
    product,
    payload: {
      quantity: 12,
      supplier: "Local Roaster",
    },
  });

  assert.equal(snapshot.productId, "prod-1");
  assert.equal(snapshot.productName, "Cold Brew");
  assert.equal(snapshot.quantity, 12);
  assert.equal(snapshot.costPrice, 90);
  assert.equal(snapshot.sellingPrice, 140);
  assert.equal(snapshot.vatRate, 13);
  assert.equal(snapshot.sku, "CB-1");
});
