import test from "node:test";
import assert from "node:assert/strict";
import { getAppsForBusiness } from "../src/config/businessConfigs.js";
import { ASSIGNABLE_ROLE_OPTIONS, getRoleMeta } from "../src/config/roleMeta.js";

test("restaurant menu permissions are specific enough for waiter and kitchen roles", () => {
  const serviceApp = getAppsForBusiness("restaurant").find((app) => app.id === "pos");
  const menuByLabel = Object.fromEntries(serviceApp.menu.map((item) => [item.label, item.permission]));

  assert.equal(menuByLabel["Kitchen"], "pos.kitchen.read");
  assert.equal(menuByLabel["Floor Plan"], "pos.tables.read");
  assert.equal(menuByLabel["New Bill"], "pos.sales.create");
});

test("new assignable roles are exposed with Nepal-market labels", () => {
  assert.equal(ASSIGNABLE_ROLE_OPTIONS.includes("waiter"), true);
  assert.equal(ASSIGNABLE_ROLE_OPTIONS.includes("kitchen"), true);
  assert.equal(getRoleMeta("kitchen").label, "Kitchen Staff");
});
