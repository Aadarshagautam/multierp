import {
  PAYMENT_METHOD_LABEL_MAP,
  POS_PAYMENT_METHOD_VALUES,
} from "./constants.js";

export const roundMoney = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

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
  const paidValue =
    normalizedMethod === "credit"
      ? Math.min(receivedAmount, safeGrandTotal)
      : Math.min(receivedAmount, safeGrandTotal);
  const paidValueRounded = roundMoney(paidValue);
  const changeAmount = roundMoney(Math.max(0, receivedAmount - safeGrandTotal));
  const dueAmount = roundMoney(Math.max(0, safeGrandTotal - paidValueRounded));

  let status = "paid";
  if (dueAmount > 0 && paidValueRounded > 0) status = "partial";
  if (paidValueRounded === 0 && dueAmount > 0) status = "due";

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
    receivedAmount,
    paidAmount: paidValueRounded,
    dueAmount,
    changeAmount,
    status,
    isPaidInFull: dueAmount === 0,
  };
};
