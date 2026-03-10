import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInventoryScopeFilter,
  getInventoryBranchId,
  normalizeInventoryName,
} from "../src/modules/inventory/stockService.js";
import { createProductSchema } from "../src/modules/pos/validation.js";

test("normalizeInventoryName trims and lowercases inventory names", () => {
  assert.equal(normalizeInventoryName("  Chicken MOMO  "), "chicken momo");
});

test("buildInventoryScopeFilter keeps inventory inside tenant and branch", () => {
  assert.deepEqual(
    buildInventoryScopeFilter({
      orgId: "org-1",
      userId: "user-1",
      membership: { branchId: "branch-1" },
    }),
    { orgId: "org-1", branchId: "branch-1" }
  );
  assert.deepEqual(buildInventoryScopeFilter({ userId: "user-1" }), { userId: "user-1" });
  assert.equal(getInventoryBranchId({ membership: { branchId: "branch-2" } }), "branch-2");
});

test("createProductSchema accepts recipe-linked products", () => {
  const result = createProductSchema.safeParse({
    name: "Chicken Momo",
    sellingPrice: 180,
    recipe: [
      {
        inventoryItemId: "inv-1",
        ingredientName: "Momo Flour",
        qty: 0.12,
        unit: "kg",
      },
    ],
  });

  assert.equal(result.success, true);
  assert.deepEqual(result.data.recipe, [
    {
      inventoryItemId: "inv-1",
      ingredientName: "Momo Flour",
      qty: 0.12,
      unit: "kg",
    },
  ]);
});
