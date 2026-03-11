import test from "node:test";
import assert from "node:assert/strict";
import {
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
