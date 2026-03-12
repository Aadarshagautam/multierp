import { buildTenantFilter } from "../../core/utils/tenant.js";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_VALUES,
} from "../payment-methods/index.js";
import { roundMoney } from "../billing/utils.js";
import TransactionModel from "./model.js";
import {
  ACCOUNTING_SUMMARY_DEFAULT,
} from "./constants.js";

const CASH_METHOD = "cash";

export const buildAccountingScopeFilter = (context = {}) => {
  const filter = buildTenantFilter(context);

  if (context.orgId && context.membership?.branchId) {
    filter.branchId = context.membership.branchId;
  }

  return filter;
};

const cloneSummary = () => JSON.parse(JSON.stringify(ACCOUNTING_SUMMARY_DEFAULT));

const normalizeAmount = (value) => roundMoney(Math.max(0, Number(value) || 0));

const isAllowedPaymentMethod = (value = "") =>
  PAYMENT_METHOD_VALUES.includes(String(value || "").trim());

export const normalizeAccountingPaymentBreakdown = ({
  paymentMethod = "cash",
  paidAmount = 0,
  payments = [],
} = {}) => {
  if (Array.isArray(payments) && payments.length > 0) {
    return payments
      .map((payment) => {
        const method = String(
          payment?.method || payment?.paymentMethod || paymentMethod || "cash"
        ).trim();
        const amount = normalizeAmount(payment?.amount);

        if (!isAllowedPaymentMethod(method) || method === "mixed" || amount <= 0) {
          return null;
        }

        return {
          method,
          amount,
          label: PAYMENT_METHOD_LABELS[method] || method,
        };
      })
      .filter(Boolean);
  }

  const normalizedMethod = isAllowedPaymentMethod(paymentMethod)
    ? String(paymentMethod || "cash").trim()
    : "cash";
  const amount = normalizeAmount(paidAmount);

  if (amount <= 0 || normalizedMethod === "credit") {
    return [];
  }

  return [
    {
      method: normalizedMethod,
      amount,
      label: PAYMENT_METHOD_LABELS[normalizedMethod] || normalizedMethod,
    },
  ];
};

export const splitAccountingAmountsByMethod = (paymentBreakdown = []) =>
  paymentBreakdown.reduce(
    (totals, payment) => {
      if (payment.method === CASH_METHOD) {
        totals.cashAmount = roundMoney(totals.cashAmount + payment.amount);
      } else {
        totals.nonCashAmount = roundMoney(totals.nonCashAmount + payment.amount);
      }

      return totals;
    },
    { cashAmount: 0, nonCashAmount: 0 }
  );

const buildManualEntryKind = (type = "expense") =>
  type === "income" ? "manual_income" : "manual_expense";

const buildEntryBase = ({
  type,
  category,
  amount,
  paidAmount = 0,
  dueAmount = 0,
  creditAmount = 0,
  paymentMethod = "cash",
  paymentBreakdown = [],
  description,
  date,
  sourceType = "manual",
  sourceId = null,
  sourceDocumentNo = "",
  entryKind,
  entryState = "active",
  isSystemGenerated = false,
  context = {},
}) => {
  const safeAmount = normalizeAmount(amount);
  const safePaidAmount = normalizeAmount(paidAmount);
  const safeDueAmount = normalizeAmount(dueAmount);
  const safeCreditAmount = normalizeAmount(creditAmount);
  const normalizedBreakdown = normalizeAccountingPaymentBreakdown({
    paymentMethod,
    paidAmount: safePaidAmount,
    payments: paymentBreakdown,
  });
  const paymentTotals = splitAccountingAmountsByMethod(normalizedBreakdown);

  return {
    userId: context.userId,
    orgId: context.orgId || null,
    branchId: context.membership?.branchId || null,
    type,
    category: String(category || "").trim(),
    amount: safeAmount,
    paidAmount: safePaidAmount,
    dueAmount: safeDueAmount,
    creditAmount: safeCreditAmount,
    cashAmount: paymentTotals.cashAmount,
    nonCashAmount: paymentTotals.nonCashAmount,
    description: String(description || "").trim(),
    date: date ? new Date(date) : new Date(),
    paymentMethod: isAllowedPaymentMethod(paymentMethod) ? paymentMethod : "cash",
    paymentBreakdown: normalizedBreakdown,
    sourceType,
    sourceId,
    sourceDocumentNo: String(sourceDocumentNo || "").trim(),
    entryKind,
    entryState,
    isSystemGenerated,
  };
};

export const buildManualAccountingEntry = (data = {}, context = {}) =>
  buildEntryBase({
    type: data.type || "expense",
    category: data.category || (data.type === "income" ? "Other Income" : "Expense"),
    amount: data.amount,
    paidAmount: data.amount,
    dueAmount: 0,
    creditAmount: 0,
    paymentMethod: data.paymentMethod || "cash",
    paymentBreakdown: [],
    description: data.description,
    date: data.date,
    sourceType: "manual",
    sourceId: null,
    sourceDocumentNo: "",
    entryKind: buildManualEntryKind(data.type),
    entryState: "active",
    isSystemGenerated: false,
    context,
  });

export const buildPosSaleAccountingEntry = ({ sale, context = {} } = {}) => {
  if (!sale?._id) {
    throw new Error("Sale is required for accounting sync.");
  }

  const isRefund = sale.status === "refund";

  return buildEntryBase({
    type: isRefund ? "expense" : "income",
    category: isRefund ? "Sales Refund" : "Sales",
    amount: sale.grandTotal,
    paidAmount: sale.paidAmount,
    dueAmount: sale.dueAmount,
    creditAmount: 0,
    paymentMethod: sale.paymentMethod || "cash",
    paymentBreakdown: sale.payments || [],
    description: isRefund
      ? `Refund ${sale.invoiceNo || ""}`.trim()
      : `POS sale ${sale.invoiceNo || ""}`.trim(),
    date: sale.refundedAt || sale.createdAt || new Date(),
    sourceType: "pos_sale",
    sourceId: sale._id,
    sourceDocumentNo: sale.invoiceNo || "",
    entryKind: isRefund ? "pos_sale_refund" : "pos_sale",
    entryState: "active",
    isSystemGenerated: true,
    context: {
      ...context,
      userId: sale.userId || context.userId,
      orgId: sale.orgId ?? context.orgId ?? null,
      membership: {
        branchId: sale.branchId ?? context.membership?.branchId ?? null,
      },
    },
  });
};

export const buildInvoiceAccountingEntry = ({ invoice, context = {} } = {}) => {
  if (!invoice?._id) {
    throw new Error("Invoice is required for accounting sync.");
  }

  const entryState =
    invoice.status === "cancelled"
      ? "cancelled"
      : invoice.status === "draft"
        ? "draft"
        : "active";
  const paidAmount = invoice.status === "paid" ? invoice.grandTotal : 0;
  const dueAmount =
    invoice.status === "paid" || invoice.status === "cancelled"
      ? 0
      : invoice.grandTotal;

  return buildEntryBase({
    type: "income",
    category: "Invoices",
    amount: invoice.grandTotal,
    paidAmount,
    dueAmount,
    paymentMethod: invoice.paymentMethod || "cash",
      paymentBreakdown: paidAmount > 0 ? [{ method: invoice.paymentMethod, amount: paidAmount }] : [],
    description: `Invoice ${invoice.invoiceNumber || ""}`.trim(),
    date: invoice.issueDate || invoice.createdAt || new Date(),
    sourceType: "invoice",
    sourceId: invoice._id,
    sourceDocumentNo: invoice.invoiceNumber || "",
    entryKind: "invoice_sale",
    entryState,
    isSystemGenerated: true,
    context: {
      ...context,
      userId: invoice.userId || context.userId,
      orgId: invoice.orgId ?? context.orgId ?? null,
      membership: {
        branchId: invoice.branchId ?? context.membership?.branchId ?? null,
      },
    },
  });
};

export const buildPurchaseAccountingEntry = ({ purchase, context = {} } = {}) => {
  if (!purchase?._id) {
    throw new Error("Purchase is required for accounting sync.");
  }

  const netAmount = roundMoney(
    Math.max(
      0,
      Number(purchase.totalAmount || 0) - Number(purchase.returnedAmount || 0)
    )
  );
  const paidAmount = normalizeAmount(purchase.paidAmount);
  const dueAmount = normalizeAmount(purchase.outstandingAmount);
  const creditAmount = normalizeAmount(purchase.creditAmount);

  return buildEntryBase({
    type: "expense",
    category: "Purchases",
    amount: netAmount,
    paidAmount,
    dueAmount,
    creditAmount,
    paymentMethod: purchase.paymentMethod || "cash",
    paymentBreakdown:
      paidAmount > 0
        ? [{ method: purchase.paymentMethod || "cash", amount: paidAmount }]
        : [],
    description: `Purchase ${purchase.productName || ""}`.trim(),
    date: purchase.purchaseDate || purchase.createdAt || new Date(),
    sourceType: "purchase",
    sourceId: purchase._id,
    sourceDocumentNo: purchase._id?.toString?.() || "",
    entryKind: "purchase",
    entryState: purchase.deliveryStatus === "returned" && netAmount === 0 ? "cancelled" : "active",
    isSystemGenerated: true,
    context: {
      ...context,
      userId: purchase.userId || context.userId,
      orgId: purchase.orgId ?? context.orgId ?? null,
      membership: {
        branchId: purchase.branchId ?? context.membership?.branchId ?? null,
      },
    },
  });
};

export const buildAccountingSummary = (entries = []) => {
  const summary = cloneSummary();

  entries
    .filter((entry) => entry?.entryState !== "cancelled" && entry?.entryState !== "draft")
    .forEach((entry) => {
      const amount = normalizeAmount(entry.amount);
      const paidAmount = normalizeAmount(entry.paidAmount);
      const dueAmount = normalizeAmount(entry.dueAmount);
      const creditAmount = normalizeAmount(entry.creditAmount);
      const cashAmount = normalizeAmount(entry.cashAmount);
      const category = String(entry.category || "Uncategorized").trim() || "Uncategorized";

      if (entry.type === "income") {
        summary.totalIncome = roundMoney(summary.totalIncome + amount);
        summary.incomeByCategory[category] = roundMoney(
          (summary.incomeByCategory[category] || 0) + amount
        );
        summary.dueSummary.receivable = roundMoney(summary.dueSummary.receivable + dueAmount);
      } else {
        summary.totalExpense = roundMoney(summary.totalExpense + amount);
        summary.expenseByCategory[category] = roundMoney(
          (summary.expenseByCategory[category] || 0) + amount
        );
        summary.dueSummary.payable = roundMoney(summary.dueSummary.payable + dueAmount);
      }

      summary.cashSummary.totalIn = roundMoney(
        summary.cashSummary.totalIn + (entry.type === "income" ? cashAmount : 0)
      );
      summary.cashSummary.totalOut = roundMoney(
        summary.cashSummary.totalOut + (entry.type === "expense" ? cashAmount : 0)
      );

      const breakdown =
        Array.isArray(entry.paymentBreakdown) && entry.paymentBreakdown.length > 0
          ? entry.paymentBreakdown
          : [
              {
                method: entry.paymentMethod || "cash",
                amount: entry.type === "income" ? paidAmount : paidAmount,
              },
            ].filter((payment) => normalizeAmount(payment.amount) > 0);

      breakdown.forEach((payment) => {
        const method = payment.method || "cash";
        const amountByMethod = normalizeAmount(payment.amount);

        if (!summary.cashSummary.byMethod[method]) {
          summary.cashSummary.byMethod[method] = { in: 0, out: 0, net: 0 };
        }

        if (entry.type === "income") {
          summary.cashSummary.byMethod[method].in = roundMoney(
            summary.cashSummary.byMethod[method].in + amountByMethod
          );
        } else {
          summary.cashSummary.byMethod[method].out = roundMoney(
            summary.cashSummary.byMethod[method].out + amountByMethod
          );
        }

        summary.cashSummary.byMethod[method].net = roundMoney(
          summary.cashSummary.byMethod[method].in -
            summary.cashSummary.byMethod[method].out
        );
      });

      if (entry.sourceType === "pos_sale" || entry.sourceType === "invoice") {
        if (entry.entryKind === "pos_sale_refund") {
          summary.salesSummary.totalRefunds = roundMoney(
            summary.salesSummary.totalRefunds + amount
          );
        } else {
          summary.salesSummary.totalSales = roundMoney(
            summary.salesSummary.totalSales + amount
          );
          summary.salesSummary.totalPaid = roundMoney(
            summary.salesSummary.totalPaid + paidAmount
          );
          summary.salesSummary.totalDue = roundMoney(
            summary.salesSummary.totalDue + dueAmount
          );
          summary.salesSummary.count += 1;
        }
      }

      if (entry.sourceType === "purchase") {
        summary.purchaseSummary.totalPurchases = roundMoney(
          summary.purchaseSummary.totalPurchases + amount
        );
        summary.purchaseSummary.totalPaid = roundMoney(
          summary.purchaseSummary.totalPaid + paidAmount
        );
        summary.purchaseSummary.totalDue = roundMoney(
          summary.purchaseSummary.totalDue + dueAmount
        );
        summary.purchaseSummary.totalCredit = roundMoney(
          summary.purchaseSummary.totalCredit + creditAmount
        );
        summary.purchaseSummary.count += 1;
      }

      if (entry.sourceType === "manual") {
        if (entry.type === "income") {
          summary.manualSummary.income = roundMoney(
            summary.manualSummary.income + amount
          );
        } else {
          summary.manualSummary.expense = roundMoney(
            summary.manualSummary.expense + amount
          );
        }
      }
    });

  summary.balance = roundMoney(summary.totalIncome - summary.totalExpense);
  summary.cashSummary.net = roundMoney(
    summary.cashSummary.totalIn - summary.cashSummary.totalOut
  );

  return summary;
};

const buildTransactionQuery = (context = {}) => {
  const filter = buildAccountingScopeFilter(context);
  const { type, startDate, endDate, sourceType } = context.query || {};

  if (type && type !== "all") filter.type = type;
  if (sourceType && sourceType !== "all") filter.sourceType = sourceType;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  return filter;
};

const createOrUpdateSystemEntry = async (payload, { session = null } = {}) =>
  TransactionModel.findOneAndUpdate(
    { sourceType: payload.sourceType, sourceId: payload.sourceId },
    { $set: payload },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      session,
    }
  );

const removeSystemEntry = async ({ sourceType, sourceId, context = {}, session = null }) =>
  TransactionModel.findOneAndDelete(
    {
      sourceType,
      sourceId,
      ...buildAccountingScopeFilter(context),
    },
    session ? { session } : undefined
  );

export const sharedAccountingService = {
  async list(context = {}) {
    return TransactionModel.find(buildTransactionQuery(context)).sort({ date: -1, createdAt: -1 });
  },

  async createManual(data, context = {}) {
    const payload = buildManualAccountingEntry(data, context);
    const transaction = new TransactionModel(payload);
    return transaction.save();
  },

  async updateManual(id, data, context = {}) {
    const existing = await TransactionModel.findOne({
      _id: id,
      ...buildAccountingScopeFilter(context),
    });

    if (!existing) return null;
    if (existing.isSystemGenerated) {
      throw Object.assign(new Error("System-generated accounting entries cannot be edited manually."), {
        status: 400,
      });
    }

    const nextPayload = buildManualAccountingEntry(
      {
        type: data.type ?? existing.type,
        category: data.category ?? existing.category,
        amount: data.amount ?? existing.amount,
        description: data.description ?? existing.description,
        date: data.date ?? existing.date,
        paymentMethod: data.paymentMethod ?? existing.paymentMethod,
      },
      {
        ...context,
        userId: existing.userId || context.userId,
        orgId: existing.orgId ?? context.orgId ?? null,
        membership: {
          branchId: existing.branchId ?? context.membership?.branchId ?? null,
        },
      }
    );

    return TransactionModel.findOneAndUpdate(
      { _id: id, ...buildAccountingScopeFilter(context) },
      { $set: nextPayload },
      { new: true, runValidators: true }
    );
  },

  async deleteManual(id, context = {}) {
    const existing = await TransactionModel.findOne({
      _id: id,
      ...buildAccountingScopeFilter(context),
    });

    if (!existing) return null;
    if (existing.isSystemGenerated) {
      throw Object.assign(new Error("System-generated accounting entries cannot be deleted manually."), {
        status: 400,
      });
    }

    return TransactionModel.findOneAndDelete({
      _id: id,
      ...buildAccountingScopeFilter(context),
    });
  },

  async getSummary(context = {}) {
    const entries = await TransactionModel.find(buildTransactionQuery(context));
    return buildAccountingSummary(entries);
  },

  async syncPosSale(sale, context = {}, { session = null } = {}) {
    const payload = buildPosSaleAccountingEntry({ sale, context });
    return createOrUpdateSystemEntry(payload, { session });
  },

  async syncInvoice(invoice, context = {}, { session = null } = {}) {
    const payload = buildInvoiceAccountingEntry({ invoice, context });
    return createOrUpdateSystemEntry(payload, { session });
  },

  async removeInvoice(invoiceId, context = {}, { session = null } = {}) {
    return removeSystemEntry({ sourceType: "invoice", sourceId: invoiceId, context, session });
  },

  async syncPurchase(purchase, context = {}, { session = null } = {}) {
    const payload = buildPurchaseAccountingEntry({ purchase, context });
    return createOrUpdateSystemEntry(payload, { session });
  },

  async removePurchase(purchaseId, context = {}, { session = null } = {}) {
    return removeSystemEntry({ sourceType: "purchase", sourceId: purchaseId, context, session });
  },
};
