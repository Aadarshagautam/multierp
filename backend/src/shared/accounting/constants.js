export const ACCOUNTING_SOURCE_TYPE_VALUES = Object.freeze([
  "manual",
  "pos_sale",
  "invoice",
  "purchase",
]);

export const ACCOUNTING_ENTRY_KIND_VALUES = Object.freeze([
  "manual_income",
  "manual_expense",
  "pos_sale",
  "pos_sale_refund",
  "invoice_sale",
  "purchase",
]);

export const ACCOUNTING_ENTRY_STATE_VALUES = Object.freeze([
  "active",
  "draft",
  "cancelled",
]);

export const ACCOUNTING_SUMMARY_DEFAULT = Object.freeze({
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  incomeByCategory: {},
  expenseByCategory: {},
  cashSummary: {
    totalIn: 0,
    totalOut: 0,
    net: 0,
    byMethod: {},
  },
  salesSummary: {
    totalSales: 0,
    totalPaid: 0,
    totalDue: 0,
    totalRefunds: 0,
    count: 0,
  },
  purchaseSummary: {
    totalPurchases: 0,
    totalPaid: 0,
    totalDue: 0,
    totalCredit: 0,
    count: 0,
  },
  dueSummary: {
    receivable: 0,
    payable: 0,
  },
  manualSummary: {
    income: 0,
    expense: 0,
  },
});
