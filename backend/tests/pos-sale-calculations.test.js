import test from "node:test";
import assert from "node:assert/strict";
import { calculateSaleLineItem, calculateSaleTotals } from "../src/shared/sales/calculations.js";
import { calculatePaymentSummary } from "../src/shared/payments/service.js";

test("calculates POS line items and totals with modifiers and loyalty discounts", () => {
  const lineItem = calculateSaleLineItem({
    item: {
      productId: "prod-1",
      qty: 2,
      discount: 15,
      modifiers: [{ name: "Milk", option: "Soy", price: 10 }],
    },
    product: {
      _id: "prod-1",
      name: "Milk Tea",
      sku: "MT-01",
      sellingPrice: 100,
      taxRate: 13,
    },
  });

  assert.equal(lineItem.basePrice, 100);
  assert.equal(lineItem.modifierTotal, 10);
  assert.equal(lineItem.price, 110);
  assert.equal(lineItem.grossAmount, 220);
  assert.equal(lineItem.tax, 26.65);
  assert.equal(lineItem.lineTotal, 231.65);

  const totals = calculateSaleTotals({
    items: [lineItem],
    overallDiscount: 5,
    loyaltyPointsRedeemed: 4,
  });

  assert.equal(totals.subtotal, 220);
  assert.equal(totals.itemDiscountTotal, 15);
  assert.equal(totals.overallDiscountAmount, 5);
  assert.equal(totals.loyaltyDiscount, 2);
  assert.equal(totals.taxTotal, 26.65);
  assert.equal(totals.grandTotal, 224.65);
});

test("summarizes cash sales with change correctly", () => {
  const summary = calculatePaymentSummary({
    paymentMethod: "cash",
    payments: [{ method: "cash", amount: 500 }],
    grandTotal: 450,
  });

  assert.equal(summary.paymentMethod, "cash");
  assert.equal(summary.paymentMode, "cash");
  assert.equal(summary.receivedAmount, 500);
  assert.equal(summary.paidAmount, 450);
  assert.equal(summary.changeAmount, 50);
  assert.equal(summary.dueAmount, 0);
  assert.equal(summary.status, "paid");
});

test("keeps credit sales fully due when no payment lines are provided", () => {
  const summary = calculatePaymentSummary({
    paymentMethod: "credit",
    grandTotal: 450,
  });

  assert.deepEqual(summary.payments, []);
  assert.equal(summary.receivedAmount, 0);
  assert.equal(summary.paidAmount, 0);
  assert.equal(summary.dueAmount, 450);
  assert.equal(summary.status, "due");
});
