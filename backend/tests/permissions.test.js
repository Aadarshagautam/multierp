import test from "node:test";
import assert from "node:assert/strict";
import { hasPermission } from "../src/core/config/permissions.js";
import { buildEffectivePermissions } from "../src/core/middleware/permissionMiddleware.js";

test("buildEffectivePermissions merges role and explicit permissions without duplicates", () => {
  const permissions = buildEffectivePermissions({
    role: "cashier",
    permissions: ["reports.read", "customers.read"],
  });

  assert.equal(permissions.includes("pos.sales.create"), true);
  assert.equal(permissions.includes("reports.read"), true);
  assert.equal(permissions.filter(permission => permission === "customers.read").length, 1);
});

test("hasPermission respects wildcard module permissions", () => {
  assert.equal(hasPermission(["inventory.*"], "inventory.update"), true);
  assert.equal(hasPermission(["customers.read"], "customers.delete"), false);
  assert.equal(hasPermission(["*"], "settings.update"), true);
});

test("hasPermission respects nested wildcards and legacy root CRUD fallbacks", () => {
  assert.equal(hasPermission(["pos.products.*"], "pos.products.update"), true);
  assert.equal(hasPermission(["pos.read"], "pos.products.read"), true);
  assert.equal(hasPermission(["pos.create"], "pos.sales.create"), true);
  assert.equal(hasPermission(["pos.read"], "pos.sales.refund"), false);
});

test("waiter and kitchen roles receive only their intended POS permissions", () => {
  const waiterPermissions = buildEffectivePermissions({ role: "waiter", permissions: [] });
  const kitchenPermissions = buildEffectivePermissions({ role: "kitchen", permissions: [] });

  assert.equal(hasPermission(waiterPermissions, "pos.tables.read"), true);
  assert.equal(hasPermission(waiterPermissions, "pos.products.delete"), false);
  assert.equal(hasPermission(kitchenPermissions, "pos.kitchen.update"), true);
  assert.equal(hasPermission(kitchenPermissions, "pos.sales.refund"), false);
});
