import { DEFAULT_VAT_RATE } from "../../core/utils/nepal.js";

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateInvoiceLineItem = (item, { withoutVat = false } = {}) => {
  const baseAmount = item.quantity * item.unitPrice;
  const discountAmount =
    item.discountType === "percentage"
      ? baseAmount * ((item.discountValue || 0) / 100)
      : item.discountValue || 0;
  const afterDiscount = baseAmount - discountAmount;
  const vatRate = item.vatRate ?? DEFAULT_VAT_RATE;
  const vatAmount = withoutVat ? 0 : afterDiscount * (vatRate / 100);
  const lineTotal = afterDiscount + vatAmount;

  return {
    productId: item.productId,
    productName: item.productName,
    sku: item.sku || "",
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    vatRate,
    vatAmount: roundMoney(vatAmount),
    discountType: item.discountType || "flat",
    discountValue: item.discountValue || 0,
    discountAmount: roundMoney(discountAmount),
    lineTotal: roundMoney(lineTotal),
  };
};

export const calculateInvoiceTotals = ({
  items,
  overallDiscountType = "none",
  overallDiscountValue = 0,
  withoutVat = false,
}) => {
  let subtotal = 0;
  let totalVat = 0;
  let totalItemDiscount = 0;

  const processedItems = items.map((item) => {
    const processed = calculateInvoiceLineItem(item, { withoutVat });
    subtotal += item.quantity * item.unitPrice;
    totalVat += processed.vatAmount;
    totalItemDiscount += processed.discountAmount;
    return processed;
  });

  const afterItems = subtotal - totalItemDiscount + totalVat;
  let overallDiscountAmount = 0;
  if (overallDiscountType === "percentage") {
    overallDiscountAmount = afterItems * ((overallDiscountValue || 0) / 100);
  } else if (overallDiscountType === "flat") {
    overallDiscountAmount = overallDiscountValue || 0;
  }

  return {
    items: processedItems,
    subtotal: roundMoney(subtotal),
    totalVat: roundMoney(totalVat),
    totalItemDiscount: roundMoney(totalItemDiscount),
    overallDiscountType,
    overallDiscountValue: overallDiscountValue || 0,
    overallDiscountAmount: roundMoney(overallDiscountAmount),
    grandTotal: roundMoney(afterItems - overallDiscountAmount),
    withoutVat,
  };
};
