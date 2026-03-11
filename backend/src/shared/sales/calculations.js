import { DEFAULT_VAT_RATE } from "../../core/utils/nepal.js";
import { LOYALTY_POINTS_RATE, LOYALTY_POINT_VALUE } from "./constants.js";
import { roundMoney } from "../payments/service.js";

export const calculateSaleLineItem = ({
  item = {},
  product = {},
  orderType = "takeaway",
}) => {
  const qty = Math.max(1, Number(item.qty) || 0);
  const modifiers = Array.isArray(item.modifiers) ? item.modifiers : [];
  const modifierTotal = roundMoney(
    modifiers.reduce((sum, modifier) => sum + (Number(modifier?.price) || 0), 0)
  );
  const basePrice = roundMoney(
    item.price !== undefined ? Number(item.price) || 0 : Number(product.sellingPrice) || 0
  );
  const effectiveUnitPrice = roundMoney(basePrice + modifierTotal);
  const lineSubtotal = roundMoney(effectiveUnitPrice * qty);
  const discount = roundMoney(Math.max(0, Number(item.discount) || 0));
  const taxableAmount = roundMoney(Math.max(0, lineSubtotal - discount));
  const taxRate = roundMoney(
    item.taxRate !== undefined ? Number(item.taxRate) || 0 : product.taxRate ?? DEFAULT_VAT_RATE
  );
  const taxAmount = roundMoney(taxableAmount * (taxRate / 100));
  const lineTotal = roundMoney(taxableAmount + taxAmount);

  return {
    productId: product._id || item.productId,
    nameSnapshot: item.nameSnapshot || product.name || "",
    skuSnapshot: item.skuSnapshot || product.sku || "",
    barcodeSnapshot: item.barcodeSnapshot || product.barcode || "",
    menuCategory: item.menuCategory || product.menuCategory || product.category || "",
    productTypeSnapshot: product.productType || product.type || "stock",
    qty,
    basePrice,
    modifierTotal,
    price: effectiveUnitPrice,
    grossAmount: lineSubtotal,
    discount,
    taxRate,
    tax: taxAmount,
    netAmount: taxableAmount,
    lineTotal,
    modifiers,
    notes: String(item.notes || "").trim(),
    status: orderType === "dine-in" ? "pending" : "completed",
  };
};

export const calculateSaleTotals = ({
  items = [],
  overallDiscount = 0,
  loyaltyPointsRedeemed = 0,
  loyaltyPointValue = LOYALTY_POINT_VALUE,
  loyaltyPointsRate = LOYALTY_POINTS_RATE,
}) => {
  const safeItems = Array.isArray(items) ? items : [];
  const subtotal = roundMoney(
    safeItems.reduce((sum, item) => sum + (Number(item.grossAmount) || 0), 0)
  );
  const itemDiscountTotal = roundMoney(
    safeItems.reduce((sum, item) => sum + (Number(item.discount) || 0), 0)
  );
  const taxTotal = roundMoney(
    safeItems.reduce((sum, item) => sum + (Number(item.tax) || 0), 0)
  );
  const overallDiscountAmount = roundMoney(Math.max(0, Number(overallDiscount) || 0));
  const loyaltyDiscount = roundMoney(
    Math.max(0, Number(loyaltyPointsRedeemed) || 0) * loyaltyPointValue
  );
  const discountTotal = roundMoney(
    itemDiscountTotal + overallDiscountAmount + loyaltyDiscount
  );
  const grandTotal = roundMoney(
    Math.max(0, subtotal - itemDiscountTotal - overallDiscountAmount - loyaltyDiscount + taxTotal)
  );
  const pointsEarned = Math.max(0, Math.floor(grandTotal * loyaltyPointsRate));

  return {
    items: safeItems,
    subtotal,
    itemDiscountTotal,
    overallDiscountAmount,
    loyaltyDiscount,
    discountTotal,
    taxTotal,
    grandTotal,
    pointsEarned,
  };
};
