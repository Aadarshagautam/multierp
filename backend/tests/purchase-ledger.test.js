import test from "node:test";
import assert from "node:assert/strict";
import {
  appendReturnNotes,
  buildPurchaseFinancials,
  getEffectiveReceivedQty,
} from "../src/modules/purchases/utils.js";

test("buildPurchaseFinancials derives paid and due values from status", () => {
  const pending = buildPurchaseFinancials({
    quantity: 10,
    unitPrice: 50,
    paymentStatus: "pending",
  });
  const paid = buildPurchaseFinancials({
    quantity: 10,
    unitPrice: 50,
    paymentStatus: "paid",
  });

  assert.equal(pending.paidAmount, 0);
  assert.equal(pending.outstandingAmount, 500);
  assert.equal(paid.paidAmount, 500);
  assert.equal(paid.outstandingAmount, 0);
});

test("buildPurchaseFinancials keeps supplier credit after returns", () => {
  const result = buildPurchaseFinancials({
    quantity: 10,
    unitPrice: 100,
    paidAmount: 1000,
    returnedQty: 2,
  });

  assert.equal(result.totalAmount, 1000);
  assert.equal(result.returnedAmount, 200);
  assert.equal(result.creditAmount, 200);
  assert.equal(result.outstandingAmount, 0);
});

test("getEffectiveReceivedQty excludes returned stock and non-delivered purchases", () => {
  assert.equal(
    getEffectiveReceivedQty({ quantity: 12, returnedQty: 2, deliveryStatus: "delivered" }),
    10
  );
  assert.equal(
    getEffectiveReceivedQty({ quantity: 12, returnedQty: 2, deliveryStatus: "returned" }),
    0
  );
});

test("appendReturnNotes appends a new note cleanly", () => {
  assert.equal(appendReturnNotes("", "Damaged pack"), "Damaged pack");
  assert.equal(
    appendReturnNotes("Wrong item", "Damaged pack"),
    "Wrong item\nDamaged pack"
  );
});
