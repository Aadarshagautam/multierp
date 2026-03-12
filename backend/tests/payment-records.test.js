import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPosSalePaymentRecord,
  calculatePaymentSummary,
} from "../src/shared/payments/index.js";

test("buildPosSalePaymentRecord creates an auditable shared payment payload", () => {
  const paymentSummary = calculatePaymentSummary({
    paymentMethod: "cash",
    payments: [{ method: "cash", amount: 1200 }],
    grandTotal: 1000,
  });

  const record = buildPosSalePaymentRecord({
    sale: {
      _id: "507f1f77bcf86cd799439001",
      userId: "507f1f77bcf86cd799439010",
      orgId: "507f1f77bcf86cd799439011",
      branchId: "507f1f77bcf86cd799439012",
      customerId: "507f1f77bcf86cd799439013",
      invoiceNo: "POS-439011-439012-20260311-0001",
      paymentMethod: paymentSummary.paymentMethod,
      paymentMode: paymentSummary.paymentMode,
      payments: paymentSummary.payments,
      receivedAmount: paymentSummary.receivedAmount,
      paidAmount: paymentSummary.paidAmount,
      dueAmount: paymentSummary.dueAmount,
      changeAmount: paymentSummary.changeAmount,
      status: paymentSummary.status,
      notes: "Counter billing",
    },
    context: {
      userId: "507f1f77bcf86cd799439099",
    },
  });

  assert.equal(record.sourceType, "pos_sale");
  assert.equal(record.documentNumber, "POS-439011-439012-20260311-0001");
  assert.equal(record.receivedAmount, 1200);
  assert.equal(record.paidAmount, 1000);
  assert.equal(record.changeAmount, 200);
  assert.equal(record.status, "paid");
  assert.equal(record.payments.length, 1);
  assert.equal(record.payments[0].method, "cash");
});
