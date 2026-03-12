import { DEFAULT_VAT_RATE } from "../../core/utils/nepal.js";
import { LOYALTY_POINTS_RATE, LOYALTY_POINT_VALUE } from "../sales/constants.js";
import { INVOICE_VAT_DISCOUNT_MODE_VALUES } from "./constants.js";
import {
  calculateOverallDiscountAmount,
  normalizeDiscountInput,
  normalizeDiscountType,
  normalizeNonNegativeNumber,
  prorateAmount,
  roundMoney,
} from "./utils.js";

const normalizeVatDiscountMode = (value) =>
  INVOICE_VAT_DISCOUNT_MODE_VALUES.includes(value)
    ? value
    : "after_vat_no_prorate";

export const calculateLineAmounts = ({
  quantity = 0,
  unitPrice = 0,
  discountType = "flat",
  discountValue = 0,
  taxRate = 0,
  withoutTax = false,
} = {}) => {
  const safeQuantity = Math.max(0, Number(quantity) || 0);
  const safeUnitPrice = normalizeNonNegativeNumber(unitPrice);
  const safeBaseAmount = roundMoney(safeQuantity * safeUnitPrice);
  const normalizedDiscount = normalizeDiscountInput({
    baseAmount: safeBaseAmount,
    discountType,
    discountValue,
  });
  const taxableAmount = roundMoney(
    Math.max(0, safeBaseAmount - normalizedDiscount.discountAmount)
  );
  const normalizedTaxRate = normalizeNonNegativeNumber(taxRate);
  const taxAmount = withoutTax
    ? 0
    : roundMoney(taxableAmount * (normalizedTaxRate / 100));
  const lineTotal = roundMoney(taxableAmount + taxAmount);

  return {
    quantity: safeQuantity,
    unitPrice: safeUnitPrice,
    discountType: normalizedDiscount.discountType,
    discountValue: normalizedDiscount.discountValue,
    baseAmount: safeBaseAmount,
    discountAmount: normalizedDiscount.discountAmount,
    taxableAmount,
    taxRate: normalizedTaxRate,
    taxAmount,
    lineTotal,
  };
};

export const calculateInvoiceLineItem = (item, { withoutVat = false } = {}) => {
  const normalizedLine = calculateLineAmounts({
    quantity: item?.quantity,
    unitPrice: item?.unitPrice,
    discountType: item?.discountType || "flat",
    discountValue: item?.discountValue || 0,
    taxRate: item?.vatRate ?? DEFAULT_VAT_RATE,
    withoutTax: withoutVat,
  });

  return {
    productId: item?.productId,
    productName: item?.productName || "",
    sku: item?.sku || "",
    quantity: normalizedLine.quantity,
    unitPrice: normalizedLine.unitPrice,
    vatRate: normalizedLine.taxRate,
    vatAmount: normalizedLine.taxAmount,
    discountType: normalizeDiscountType(item?.discountType, "flat"),
    discountValue: normalizedLine.discountValue,
    discountAmount: normalizedLine.discountAmount,
    lineTotal: normalizedLine.lineTotal,
    _baseAmount: normalizedLine.baseAmount,
    _afterDiscount: normalizedLine.taxableAmount,
  };
};

export const calculateInvoiceTotals = ({
  items = [],
  overallDiscountType = "none",
  overallDiscountValue = 0,
  withoutVat = false,
  vatDiscountMode = "after_vat_no_prorate",
} = {}) => {
  const safeItems = Array.isArray(items) ? items : [];
  const normalizedMode = normalizeVatDiscountMode(vatDiscountMode);
  const baseItems = safeItems.map((item) =>
    calculateInvoiceLineItem(item, { withoutVat })
  );

  const subtotal = roundMoney(
    baseItems.reduce((sum, item) => sum + (item._baseAmount || 0), 0)
  );
  const totalItemDiscount = roundMoney(
    baseItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0)
  );
  const netAfterItemDiscount = roundMoney(
    Math.max(0, subtotal - totalItemDiscount)
  );
  const totalVatStandard = withoutVat
    ? 0
    : roundMoney(
        baseItems.reduce((sum, item) => sum + (item.vatAmount || 0), 0)
      );
  const afterItemsStandard = roundMoney(netAfterItemDiscount + totalVatStandard);
  const discountBase = normalizedMode.startsWith("before_vat")
    ? netAfterItemDiscount
    : afterItemsStandard;
  const overallDiscount = calculateOverallDiscountAmount({
    baseAmount: discountBase,
    overallDiscountType,
    overallDiscountValue,
  });

  let processedItems = baseItems;
  let totalVat = totalVatStandard;
  let grandTotal = roundMoney(
    Math.max(0, afterItemsStandard - overallDiscount.discountAmount)
  );

  if (normalizedMode === "before_vat_prorate") {
    processedItems = prorateAmount({
      items: baseItems,
      totalAmount: overallDiscount.discountAmount,
      selector: (item) => item._afterDiscount,
      field: "_overallDiscountShare",
    }).map((item) => {
      const taxableAmount = roundMoney(
        Math.max(0, (item._afterDiscount || 0) - (item._overallDiscountShare || 0))
      );
      const vatAmount = withoutVat
        ? 0
        : roundMoney(taxableAmount * ((item.vatRate || 0) / 100));

      return {
        ...item,
        vatAmount,
        lineTotal: roundMoney(taxableAmount + vatAmount),
      };
    });

    totalVat = roundMoney(
      processedItems.reduce((sum, item) => sum + (item.vatAmount || 0), 0)
    );
    grandTotal = roundMoney(
      processedItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0)
    );
  } else if (normalizedMode === "before_vat_no_prorate") {
    const sumAfterDiscount = roundMoney(
      baseItems.reduce((sum, item) => sum + (item._afterDiscount || 0), 0)
    );
    const weightedVatNumerator = baseItems.reduce(
      (sum, item) => sum + (item._afterDiscount || 0) * (item.vatRate || 0),
      0
    );
    const avgVatRate =
      sumAfterDiscount > 0 ? weightedVatNumerator / sumAfterDiscount : 0;
    const discountedNet = roundMoney(
      Math.max(0, netAfterItemDiscount - overallDiscount.discountAmount)
    );

    totalVat = withoutVat
      ? 0
      : roundMoney(discountedNet * (avgVatRate / 100));
    grandTotal = roundMoney(discountedNet + totalVat);
  } else if (normalizedMode === "after_vat_prorate") {
    processedItems = prorateAmount({
      items: baseItems.map((item) => ({
        ...item,
        _lineTotalStandard: item.lineTotal,
      })),
      totalAmount: overallDiscount.discountAmount,
      selector: (item) => item._lineTotalStandard,
      field: "_overallDiscountShare",
    }).map((item) => ({
      ...item,
      lineTotal: roundMoney(
        Math.max(0, (item._lineTotalStandard || 0) - (item._overallDiscountShare || 0))
      ),
    }));

    totalVat = totalVatStandard;
    grandTotal = roundMoney(
      processedItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0)
    );
  }

  return {
    items: processedItems.map(
      ({ _baseAmount, _afterDiscount, _lineTotalStandard, _overallDiscountShare, ...item }) =>
        item
    ),
    subtotal,
    totalVat: roundMoney(totalVat),
    totalItemDiscount,
    overallDiscountType: overallDiscount.discountType,
    overallDiscountValue: overallDiscount.discountValue,
    overallDiscountAmount: overallDiscount.discountAmount,
    grandTotal: roundMoney(grandTotal),
    withoutVat,
    vatDiscountMode: normalizedMode,
  };
};

export const calculateSaleLineItem = ({
  item = {},
  product = {},
  orderType = "takeaway",
} = {}) => {
  const qty = Math.max(1, Number(item.qty) || 0);
  const modifiers = Array.isArray(item.modifiers) ? item.modifiers : [];
  const modifierTotal = roundMoney(
    modifiers.reduce((sum, modifier) => sum + (Number(modifier?.price) || 0), 0)
  );
  const basePrice = roundMoney(
    item.price !== undefined ? Number(item.price) || 0 : Number(product.sellingPrice) || 0
  );
  const effectiveUnitPrice = roundMoney(basePrice + modifierTotal);
  const lineAmounts = calculateLineAmounts({
    quantity: qty,
    unitPrice: effectiveUnitPrice,
    discountType: "flat",
    discountValue: item.discount || 0,
    taxRate:
      item.taxRate !== undefined
        ? Number(item.taxRate) || 0
        : product.taxRate ?? DEFAULT_VAT_RATE,
  });

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
    grossAmount: lineAmounts.baseAmount,
    discount: lineAmounts.discountAmount,
    taxRate: lineAmounts.taxRate,
    tax: lineAmounts.taxAmount,
    netAmount: lineAmounts.taxableAmount,
    lineTotal: lineAmounts.lineTotal,
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
} = {}) => {
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
  const preExtraDiscountTotal = roundMoney(
    Math.max(0, subtotal - itemDiscountTotal + taxTotal)
  );
  const overallDiscountAmount = Math.min(
    preExtraDiscountTotal,
    normalizeNonNegativeNumber(overallDiscount)
  );
  const loyaltyDiscount = Math.min(
    roundMoney(Math.max(0, Number(loyaltyPointsRedeemed) || 0) * loyaltyPointValue),
    roundMoney(Math.max(0, preExtraDiscountTotal - overallDiscountAmount))
  );
  const discountTotal = roundMoney(
    itemDiscountTotal + overallDiscountAmount + loyaltyDiscount
  );
  const grandTotal = roundMoney(
    Math.max(0, preExtraDiscountTotal - overallDiscountAmount - loyaltyDiscount)
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
