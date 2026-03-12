import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAccountingSummary,
  buildInvoiceAccountingEntry,
  buildPosSaleAccountingEntry,
  buildPurchaseAccountingEntry,
} from "../src/shared/accounting/index.js";

const context = {
  userId: "user-1",
  orgId: "org-1",
  membership: { branchId: "branch-1" },
};

test("buildPosSaleAccountingEntry keeps sales, collection, and due together", () => {
  const entry = buildPosSaleAccountingEntry({
    sale: {
      _id: "sale-1",
      userId: "user-1",
      orgId: "org-1",
      branchId: "branch-1",
      invoiceNo: "POS-0001",
      grandTotal: 1000,
      paidAmount: 700,
      dueAmount: 300,
      paymentMethod: "mixed",
      payments: [
        { method: "cash", amount: 500 },
        { method: "esewa", amount: 200 },
      ],
      status: "due",
      createdAt: new Date("2026-03-11T10:00:00.000Z"),
    },
    context,
  });

  assert.equal(entry.type, "income");
  assert.equal(entry.category, "Sales");
  assert.equal(entry.amount, 1000);
  assert.equal(entry.paidAmount, 700);
  assert.equal(entry.dueAmount, 300);
  assert.equal(entry.cashAmount, 500);
  assert.equal(entry.nonCashAmount, 200);
  assert.equal(entry.entryKind, "pos_sale");
});

test("buildInvoiceAccountingEntry keeps draft invoices out of active owner totals", () => {
  const draftEntry = buildInvoiceAccountingEntry({
    invoice: {
      _id: "invoice-1",
      userId: "user-1",
      orgId: "org-1",
      invoiceNumber: "INV-0001",
      grandTotal: 5000,
      status: "draft",
      paymentMethod: "cash",
      issueDate: new Date("2026-03-11T10:00:00.000Z"),
    },
    context,
  });

  assert.equal(draftEntry.entryState, "draft");
  assert.equal(draftEntry.dueAmount, 5000);
});

test("buildPurchaseAccountingEntry keeps purchase paid, due, and credit visible", () => {
  const entry = buildPurchaseAccountingEntry({
    purchase: {
      _id: "purchase-1",
      userId: "user-1",
      orgId: "org-1",
      branchId: "branch-1",
      productName: "Tokla Tea 500g",
      totalAmount: 4000,
      returnedAmount: 500,
      paidAmount: 2500,
      outstandingAmount: 1000,
      creditAmount: 0,
      paymentMethod: "bank_transfer",
      purchaseDate: new Date("2026-03-11T10:00:00.000Z"),
      deliveryStatus: "delivered",
    },
    context,
  });

  assert.equal(entry.type, "expense");
  assert.equal(entry.category, "Purchases");
  assert.equal(entry.amount, 3500);
  assert.equal(entry.paidAmount, 2500);
  assert.equal(entry.dueAmount, 1000);
  assert.equal(entry.cashAmount, 0);
  assert.equal(entry.nonCashAmount, 2500);
});

test("buildAccountingSummary aggregates owner-facing totals across sales, invoices, purchases, and expenses", () => {
  const summary = buildAccountingSummary([
    {
      type: "income",
      category: "Sales",
      amount: 1000,
      paidAmount: 700,
      dueAmount: 300,
      creditAmount: 0,
      cashAmount: 500,
      nonCashAmount: 200,
      paymentMethod: "mixed",
      paymentBreakdown: [
        { method: "cash", amount: 500 },
        { method: "esewa", amount: 200 },
      ],
      sourceType: "pos_sale",
      entryKind: "pos_sale",
      entryState: "active",
    },
    {
      type: "income",
      category: "Invoices",
      amount: 5000,
      paidAmount: 0,
      dueAmount: 5000,
      creditAmount: 0,
      cashAmount: 0,
      nonCashAmount: 0,
      paymentMethod: "cash",
      paymentBreakdown: [],
      sourceType: "invoice",
      entryKind: "invoice_sale",
      entryState: "active",
    },
    {
      type: "expense",
      category: "Purchases",
      amount: 3500,
      paidAmount: 2500,
      dueAmount: 1000,
      creditAmount: 0,
      cashAmount: 0,
      nonCashAmount: 2500,
      paymentMethod: "bank_transfer",
      paymentBreakdown: [{ method: "bank_transfer", amount: 2500 }],
      sourceType: "purchase",
      entryKind: "purchase",
      entryState: "active",
    },
    {
      type: "expense",
      category: "Rent",
      amount: 1200,
      paidAmount: 1200,
      dueAmount: 0,
      creditAmount: 0,
      cashAmount: 1200,
      nonCashAmount: 0,
      paymentMethod: "cash",
      paymentBreakdown: [{ method: "cash", amount: 1200 }],
      sourceType: "manual",
      entryKind: "manual_expense",
      entryState: "active",
    },
  ]);

  assert.equal(summary.totalIncome, 6000);
  assert.equal(summary.totalExpense, 4700);
  assert.equal(summary.balance, 1300);
  assert.equal(summary.salesSummary.totalSales, 6000);
  assert.equal(summary.salesSummary.totalDue, 5300);
  assert.equal(summary.purchaseSummary.totalPurchases, 3500);
  assert.equal(summary.purchaseSummary.totalDue, 1000);
  assert.equal(summary.dueSummary.receivable, 5300);
  assert.equal(summary.dueSummary.payable, 1000);
  assert.equal(summary.cashSummary.totalIn, 500);
  assert.equal(summary.cashSummary.totalOut, 1200);
  assert.equal(summary.cashSummary.net, -700);
});
