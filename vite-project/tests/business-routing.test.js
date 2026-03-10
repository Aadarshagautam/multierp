import test from "node:test";
import assert from "node:assert/strict";
import {
  getRedirectPathForBusiness,
  isPathSupportedForBusiness,
} from "../src/config/businessConfigs.js";

test("restaurant routes customer records back to the guest book", () => {
  assert.equal(isPathSupportedForBusiness("/customers", "restaurant"), false);
  assert.equal(getRedirectPathForBusiness("/customers", "restaurant"), "/pos/customers");
});

test("cafe routes invoice pages back to shift close", () => {
  assert.equal(isPathSupportedForBusiness("/invoices/123", "cafe"), false);
  assert.equal(getRedirectPathForBusiness("/invoices/123", "cafe"), "/pos/shifts");
});

test("cafe routes restaurant-only floor tools back to the POS dashboard", () => {
  assert.equal(isPathSupportedForBusiness("/pos/tables", "cafe"), false);
  assert.equal(getRedirectPathForBusiness("/pos/tables", "cafe"), "/pos");
});

test("shop routes restaurant-only floor tools back to the POS dashboard", () => {
  assert.equal(isPathSupportedForBusiness("/pos/tables", "shop"), false);
  assert.equal(getRedirectPathForBusiness("/pos/tables", "shop"), "/pos");
});

test("unknown unsupported paths fall back to the command center", () => {
  assert.equal(getRedirectPathForBusiness("/unknown-screen", "restaurant"), "/dashboard");
});
