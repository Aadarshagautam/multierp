import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPosSalePayload,
  calculateCartTotals,
  calculateTenderState,
  getCheckoutIssues,
} from "../src/features/pos/utils/billing.js";

test("calculates billing totals from cart lines and discounts", () => {
  const totals = calculateCartTotals({
    cart: [
      {
        productId: "prod-1",
        price: 110,
        qty: 2,
        discount: 15,
        taxRate: 13,
      },
    ],
    overallDiscount: 5,
    loyaltyRedeem: 4,
  });

  assert.equal(totals.subtotal, 220);
  assert.equal(totals.itemDiscountTotal, 15);
  assert.equal(totals.overallDiscountAmount, 5);
  assert.equal(totals.loyaltyDiscount, 2);
  assert.equal(totals.taxTotal, 26.65);
  assert.equal(totals.grandTotal, 224.65);
});

test("builds POS payloads with base price so modifier totals are not double-counted", () => {
  const payload = buildPosSalePayload({
    cart: [
      {
        productId: "prod-1",
        qty: 2,
        basePrice: 100,
        price: 110,
        discount: 15,
        modifiers: [{ name: "Milk", option: "Soy", price: 10 }],
      },
    ],
    paymentMethod: "cash",
    paymentState: {
      receivedAmount: 500,
      paidAmount: 224.65,
    },
  });

  assert.equal(payload.items[0].price, 100);
  assert.equal(payload.items[0].modifiers[0].price, 10);
  assert.equal(payload.payments[0].amount, 500);
});

test("treats credit sales as due and requires a real customer account", () => {
  const paymentState = calculateTenderState({
    grandTotal: 450,
    paymentMethod: "credit",
  });

  assert.equal(paymentState.receivedAmount, 0);
  assert.equal(paymentState.paidAmount, 0);
  assert.equal(paymentState.dueAmount, 450);

  const issues = getCheckoutIssues({
    cart: [{ productId: "prod-1", qty: 1 }],
    paymentMethod: "credit",
    selectedCustomer: { _id: null, name: "Walk-in Customer" },
    paymentState,
  });

  assert.deepEqual(issues, ["Select a customer before keeping any due amount."]);
});
