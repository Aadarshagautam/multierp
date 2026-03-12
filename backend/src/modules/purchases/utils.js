import {
  derivePaymentStatusFromAmounts,
  roundMoney,
} from "../../shared/billing/index.js";

export const buildPurchaseFinancials = ({
  quantity,
  unitPrice,
  paymentStatus = "pending",
  paidAmount,
  returnedQty = 0,
}) => {
  const safeQuantity = Number(quantity);
  const safeUnitPrice = Number(unitPrice);
  const safeReturnedQty = Number(returnedQty || 0);

  if (!Number.isFinite(safeQuantity) || safeQuantity <= 0) {
    throw new Error("Quantity must be at least 1.");
  }
  if (!Number.isFinite(safeUnitPrice) || safeUnitPrice < 0) {
    throw new Error("Unit price must be 0 or more.");
  }
  if (!Number.isFinite(safeReturnedQty) || safeReturnedQty < 0) {
    throw new Error("Returned quantity cannot be negative.");
  }
  if (safeReturnedQty > safeQuantity) {
    throw new Error("Returned quantity cannot exceed purchased quantity.");
  }

  const totalAmount = roundMoney(safeQuantity * safeUnitPrice);
  const returnedAmount = roundMoney(safeReturnedQty * safeUnitPrice);
  const netAmount = Math.max(0, roundMoney(totalAmount - returnedAmount));

  let normalizedPaidAmount;
  if (paidAmount === undefined || paidAmount === null || paidAmount === "") {
    if (paymentStatus === "paid") {
      normalizedPaidAmount = netAmount;
    } else if (paymentStatus === "pending") {
      normalizedPaidAmount = 0;
    } else {
      throw new Error("Partial payment requires an amount paid.");
    }
  } else {
    normalizedPaidAmount = roundMoney(Number(paidAmount));
    if (!Number.isFinite(normalizedPaidAmount) || normalizedPaidAmount < 0) {
      throw new Error("Amount paid must be 0 or more.");
    }
  }

  const outstandingAmount = roundMoney(Math.max(0, netAmount - normalizedPaidAmount));
  const creditAmount = roundMoney(Math.max(0, normalizedPaidAmount - netAmount));
  const normalizedPaymentStatus = derivePaymentStatusFromAmounts({
    totalAmount: netAmount,
    paidAmount: normalizedPaidAmount,
    unpaidStatus: "pending",
  });

  return {
    quantity: safeQuantity,
    unitPrice: safeUnitPrice,
    totalAmount,
    paidAmount: normalizedPaidAmount,
    returnedQty: safeReturnedQty,
    returnedAmount,
    outstandingAmount,
    creditAmount,
    paymentStatus: normalizedPaymentStatus,
  };
};

export const getEffectiveReceivedQty = (purchase) => {
  if (!purchase) return 0;
  if (purchase.deliveryStatus !== "delivered") return 0;
  return Math.max(
    0,
    Number(purchase.quantity || 0) - Number(purchase.returnedQty || 0)
  );
};

export const appendReturnNotes = (currentNotes = "", nextNote = "") => {
  const note = nextNote.trim();
  if (!note) return currentNotes || "";
  if (!currentNotes?.trim()) return note;
  return `${currentNotes.trim()}\n${note}`;
};
