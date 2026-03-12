import test from "node:test";
import assert from "node:assert/strict";
import { calculateInvoiceTotals } from "../src/shared/invoices/calculations.js";

test("calculates invoice totals with VAT and percentage item discount", () => {
  const totals = calculateInvoiceTotals({
    items: [
      {
        productId: "prod-1",
        productName: "Milk Tea",
        quantity: 2,
        unitPrice: 100,
        vatRate: 13,
        discountType: "percentage",
        discountValue: 10,
      },
    ],
    overallDiscountType: "flat",
    overallDiscountValue: 15,
    withoutVat: false,
  });

  assert.equal(totals.subtotal, 200);
  assert.equal(totals.totalItemDiscount, 20);
  assert.equal(totals.totalVat, 23.4);
  assert.equal(totals.overallDiscountAmount, 15);
  assert.equal(totals.grandTotal, 188.4);
});

test("recalculates invoice totals without VAT when requested", () => {
  const totals = calculateInvoiceTotals({
    items: [
      {
        productId: "prod-1",
        productName: "Noodles",
        quantity: 1,
        unitPrice: 250,
        vatRate: 13,
        discountType: "flat",
        discountValue: 20,
      },
    ],
    overallDiscountType: "none",
    overallDiscountValue: 0,
    withoutVat: true,
  });

  assert.equal(totals.subtotal, 250);
  assert.equal(totals.totalItemDiscount, 20);
  assert.equal(totals.totalVat, 0);
  assert.equal(totals.grandTotal, 230);
});

test("keeps invoice totals aligned with after-vat prorated discounts", () => {
  const totals = calculateInvoiceTotals({
    items: [
      {
        productId: "prod-1",
        productName: "Latte",
        quantity: 1,
        unitPrice: 200,
        vatRate: 13,
        discountType: "flat",
        discountValue: 0,
      },
      {
        productId: "prod-2",
        productName: "Cake Slice",
        quantity: 1,
        unitPrice: 100,
        vatRate: 13,
        discountType: "flat",
        discountValue: 0,
      },
    ],
    overallDiscountType: "flat",
    overallDiscountValue: 30,
    vatDiscountMode: "after_vat_prorate",
  });

  assert.equal(totals.subtotal, 300);
  assert.equal(totals.totalVat, 39);
  assert.equal(totals.overallDiscountAmount, 30);
  assert.equal(totals.grandTotal, 309);
  assert.equal(
    totals.items.reduce((sum, item) => sum + item.lineTotal, 0),
    totals.grandTotal
  );
});
