import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_COUNTRY,
  PAYMENT_METHOD_LABELS,
  formatCurrencyNpr,
  formatDateNepal,
} from "../src/utils/nepal.js";

test("uses Nepal as the product default country", () => {
  assert.equal(DEFAULT_COUNTRY, "Nepal");
});

test("formats NPR values for customer-facing UI", () => {
  assert.equal(formatCurrencyNpr(1250), "NPR 1,250.00");
});

test("formats Nepal dates with month labels", () => {
  assert.match(formatDateNepal("2026-03-09T00:00:00.000Z"), /2026/);
});

test("exposes Nepal wallet payment labels", () => {
  assert.equal(PAYMENT_METHOD_LABELS.esewa, "eSewa");
  assert.equal(PAYMENT_METHOD_LABELS.khalti, "Khalti");
});
