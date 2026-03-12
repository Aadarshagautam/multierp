import { normalizeNonNegativeNumber, roundMoney } from "./utils.js";

export const derivePaymentStatusFromAmounts = ({
  totalAmount = 0,
  paidAmount = 0,
  unpaidStatus = "due",
  partialStatus = "partial",
  paidStatus = "paid",
} = {}) => {
  const safeTotalAmount = normalizeNonNegativeNumber(totalAmount);
  const safePaidAmount = Math.min(
    normalizeNonNegativeNumber(paidAmount),
    safeTotalAmount
  );

  if (safeTotalAmount === 0) return paidStatus;
  if (safePaidAmount === 0) return unpaidStatus;
  if (safePaidAmount >= safeTotalAmount) return paidStatus;

  return partialStatus;
};

export const buildInvoiceStatusState = ({
  status = "draft",
  currentPaidDate = null,
  now = new Date(),
} = {}) => ({
  status,
  paidDate: status === "paid" ? currentPaidDate || now : null,
});

export const calculateSettlementAmounts = ({
  totalAmount = 0,
  receivedAmount = 0,
} = {}) => {
  const safeTotalAmount = normalizeNonNegativeNumber(totalAmount);
  const safeReceivedAmount = normalizeNonNegativeNumber(receivedAmount);
  const paidAmount = Math.min(safeReceivedAmount, safeTotalAmount);

  return {
    totalAmount: safeTotalAmount,
    receivedAmount: safeReceivedAmount,
    paidAmount: roundMoney(paidAmount),
    dueAmount: roundMoney(Math.max(0, safeTotalAmount - paidAmount)),
    changeAmount: roundMoney(Math.max(0, safeReceivedAmount - safeTotalAmount)),
  };
};
