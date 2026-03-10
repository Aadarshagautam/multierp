import test from "node:test";
import assert from "node:assert/strict";
import { hasPermission } from "../src/core/config/permissions.js";
import { buildEffectivePermissions } from "../src/core/middleware/permissionMiddleware.js";

test("buildEffectivePermissions merges role and explicit permissions without duplicates", () => {
  const permissions = buildEffectivePermissions({
    role: "cashier",
    permissions: ["reports.read", "customers.read"],
  });

  assert.equal(permissions.includes("pos.create"), true);
  assert.equal(permissions.includes("reports.read"), true);
  assert.equal(permissions.filter(permission => permission === "customers.read").length, 1);
});

test("hasPermission respects wildcard module permissions", () => {
  assert.equal(hasPermission(["inventory.*"], "inventory.update"), true);
  assert.equal(hasPermission(["customers.read"], "customers.delete"), false);
  assert.equal(hasPermission(["*"], "settings.update"), true);
});
