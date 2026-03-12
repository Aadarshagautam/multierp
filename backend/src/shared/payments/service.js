import {
  PAYMENT_METHOD_LABEL_MAP,
  POS_PAYMENT_METHOD_VALUES,
} from "./constants.js";
import {
  calculateSettlementAmounts,
  derivePaymentStatusFromAmounts,
} from "../billing/status.js";
import { roundMoney } from "../billing/utils.js";
import PaymentRecordModel from "./model.js";

export { roundMoney };

export const createDomainError = (message, status = 400) =>
  Object.assign(new Error(message), { status });

const isAllowedPosPaymentMethod = (method) =>
  POS_PAYMENT_METHOD_VALUES.includes(method);

const normalizePaymentAmount = (value) => roundMoney(Math.max(0, Number(value) || 0));

export const normalizePaymentLines = ({
  paymentMethod = "cash",
  paidAmount = 0,
  payments = [],
  grandTotal = 0,
} = {}) => {
  const safeGrandTotal = roundMoney(Math.max(0, Number(grandTotal) || 0));
  const normalizedLines = [];

  if (Array.isArray(payments) && payments.length > 0) {
    payments.forEach((payment, index) => {
      const method = String(payment?.method || payment?.paymentMethod || "").trim();
      if (!isAllowedPosPaymentMethod(method) || method === "mixed") {
        throw createDomainError(`Payment ${index + 1} uses an invalid method.`);
      }

      const amount = normalizePaymentAmount(payment?.amount);
      if (amount <= 0) return;

      normalizedLines.push({
        method,
        amount,
        reference: String(payment?.reference || "").trim(),
        label: PAYMENT_METHOD_LABEL_MAP[method] || method,
      });
    });
  }

  if (normalizedLines.length === 0) {
    const normalizedMethod =
      paymentMethod === "mixed" ? "cash" : String(paymentMethod || "cash").trim();

    if (!isAllowedPosPaymentMethod(normalizedMethod)) {
      throw createDomainError("Payment method is invalid.");
    }

    if (normalizedMethod === "credit") {
      return [];
    }

    const fallbackAmount = normalizePaymentAmount(
      paidAmount === undefined || paidAmount === null ? safeGrandTotal : paidAmount
    );

    if (fallbackAmount > 0) {
      normalizedLines.push({
        method: normalizedMethod,
        amount: fallbackAmount,
        reference: "",
        label: PAYMENT_METHOD_LABEL_MAP[normalizedMethod] || normalizedMethod,
      });
    }
  }

  return normalizedLines;
};

export const calculatePaymentSummary = ({
  paymentMethod = "cash",
  paidAmount = 0,
  payments = [],
  grandTotal = 0,
} = {}) => {
  const safeGrandTotal = roundMoney(Math.max(0, Number(grandTotal) || 0));
  const normalizedMethod = String(paymentMethod || "cash").trim();

  if (!isAllowedPosPaymentMethod(normalizedMethod)) {
    throw createDomainError("Payment method is invalid.");
  }

  const normalizedPayments =
    normalizedMethod === "credit" && (!payments || payments.length === 0)
      ? []
      : normalizePaymentLines({
          paymentMethod: normalizedMethod,
          paidAmount,
          payments,
          grandTotal: safeGrandTotal,
        });

  const receivedAmount = roundMoney(
    normalizedPayments.reduce((sum, payment) => sum + payment.amount, 0)
  );
  const settlement = calculateSettlementAmounts({
    totalAmount: safeGrandTotal,
    receivedAmount,
  });
  const status = derivePaymentStatusFromAmounts({
    totalAmount: safeGrandTotal,
    paidAmount: settlement.paidAmount,
    unpaidStatus: "due",
  });

  return {
    paymentMethod:
      normalizedPayments.length > 1
        ? "mixed"
        : normalizedMethod === "mixed"
          ? normalizedPayments[0]?.method || "cash"
          : normalizedMethod,
    paymentMode:
      normalizedPayments.length > 1 || normalizedMethod === "mixed"
        ? "mixed"
        : normalizedMethod,
    payments: normalizedPayments,
    receivedAmount: settlement.receivedAmount,
    paidAmount: settlement.paidAmount,
    dueAmount: settlement.dueAmount,
    changeAmount: settlement.changeAmount,
    status,
    isPaidInFull: settlement.dueAmount === 0,
  };
};

export const buildPosSalePaymentRecord = ({ sale, context = {} } = {}) => ({
  userId: sale?.userId || context.userId,
  orgId: sale?.orgId ?? context.orgId ?? null,
  branchId: sale?.branchId ?? context.membership?.branchId ?? null,
  sourceType: "pos_sale",
  sourceId: sale?._id,
  documentNumber: sale?.invoiceNo || "",
  customerId: sale?.customerId || null,
  paymentMethod: sale?.paymentMethod || "cash",
  paymentMode: sale?.paymentMode || sale?.paymentMethod || "cash",
  payments: Array.isArray(sale?.payments)
    ? sale.payments.map((payment) => ({
        method: payment.method,
        amount: roundMoney(payment.amount),
        reference: String(payment.reference || "").trim(),
        label: String(payment.label || "").trim(),
      }))
    : [],
  receivedAmount: roundMoney(sale?.receivedAmount),
  paidAmount: roundMoney(sale?.paidAmount),
  dueAmount: roundMoney(sale?.dueAmount),
  changeAmount: roundMoney(sale?.changeAmount),
  status: sale?.status || "paid",
  notes: String(sale?.notes || "").trim(),
  createdBy: context.userId || sale?.soldBy || sale?.userId || null,
});

export const createPaymentRecord = async (payload, { session = null } = {}) => {
  const [paymentRecord] = await PaymentRecordModel.create(
    [payload],
    session ? { session } : undefined
  );
  return paymentRecord;
};

export const syncPosSalePaymentRecord = async ({
  sale,
  context = {},
  session = null,
} = {}) => {
  if (!sale?._id) {
    throw createDomainError("Sale is required to create a payment record.");
  }

  const paymentRecord = buildPosSalePaymentRecord({ sale, context });
  return createPaymentRecord(paymentRecord, { session });
};
