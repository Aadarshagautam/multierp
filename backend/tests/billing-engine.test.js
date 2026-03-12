import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInvoiceStatusState,
  calculateInvoiceTotals,
  derivePaymentStatusFromAmounts,
} from "../src/shared/billing/index.js";

test("invoice billing supports before-vat prorated discounts", () => {
  const totals = calculateInvoiceTotals({
    items: [
      {
        productId: "prod-1",
        productName: "Chicken Momo",
        quantity: 2,
        unitPrice: 100,
        vatRate: 13,
        discountType: "flat",
        discountValue: 20,
      },
      {
        productId: "prod-2",
        productName: "Cold Coffee",
        quantity: 1,
        unitPrice: 200,
        vatRate: 13,
        discountType: "flat",
        discountValue: 0,
      },
    ],
    overallDiscountType: "flat",
    overallDiscountValue: 50,
    vatDiscountMode: "before_vat_prorate",
  });

  assert.equal(totals.subtotal, 400);
  assert.equal(totals.totalItemDiscount, 20);
  assert.equal(totals.overallDiscountAmount, 50);
  assert.equal(totals.totalVat, 42.9);
  assert.equal(totals.grandTotal, 372.9);
  assert.equal(totals.vatDiscountMode, "before_vat_prorate");
});

test("invoice billing clamps discount values so totals never go negative", () => {
  const totals = calculateInvoiceTotals({
    items: [
      {
        productId: "prod-1",
        productName: "Espresso",
        quantity: 1,
        unitPrice: 150,
        vatRate: 13,
        discountType: "flat",
        discountValue: 999,
      },
    ],
    overallDiscountType: "percentage",
    overallDiscountValue: 250,
  });

  assert.equal(totals.totalItemDiscount, 150);
  assert.equal(totals.totalVat, 0);
  assert.equal(totals.overallDiscountAmount, 0);
  assert.equal(totals.grandTotal, 0);
});

test("derivePaymentStatusFromAmounts supports due and pending workflows", () => {
  assert.equal(
    derivePaymentStatusFromAmounts({ totalAmount: 500, paidAmount: 0 }),
    "due"
  );
  assert.equal(
    derivePaymentStatusFromAmounts({
      totalAmount: 500,
      paidAmount: 0,
      unpaidStatus: "pending",
    }),
    "pending"
  );
  assert.equal(
    derivePaymentStatusFromAmounts({ totalAmount: 500, paidAmount: 200 }),
    "partial"
  );
});

test("buildInvoiceStatusState centralizes paid date handling", () => {
  const now = new Date("2026-03-11T08:30:00.000Z");
  const draftState = buildInvoiceStatusState({ status: "draft", now });
  const paidState = buildInvoiceStatusState({ status: "paid", now });

  assert.equal(draftState.paidDate, null);
  assert.equal(paidState.paidDate.toISOString(), now.toISOString());
});
