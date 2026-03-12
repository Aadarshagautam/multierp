export const roundMoney = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const normalizeNonNegativeNumber = (value) =>
  roundMoney(Math.max(0, Number(value) || 0));

export const clampPercentage = (value) =>
  Math.min(100, Math.max(0, Number(value) || 0));

export const normalizeDiscountType = (value, fallback = "flat") => {
  if (value === "percentage" || value === "flat" || value === "none") {
    return value;
  }

  return fallback;
};

export const normalizeDiscountInput = ({
  baseAmount = 0,
  discountType = "flat",
  discountValue = 0,
} = {}) => {
  const safeBaseAmount = normalizeNonNegativeNumber(baseAmount);
  const normalizedType = normalizeDiscountType(discountType);

  if (normalizedType === "none") {
    return {
      discountType: "none",
      discountValue: 0,
      discountAmount: 0,
    };
  }

  if (normalizedType === "percentage") {
    const normalizedValue = clampPercentage(discountValue);
    return {
      discountType: normalizedType,
      discountValue: normalizedValue,
      discountAmount: roundMoney(safeBaseAmount * (normalizedValue / 100)),
    };
  }

  const normalizedValue = Math.min(
    safeBaseAmount,
    normalizeNonNegativeNumber(discountValue)
  );

  return {
    discountType: normalizedType,
    discountValue: normalizedValue,
    discountAmount: normalizedValue,
  };
};

export const calculateOverallDiscountAmount = ({
  baseAmount = 0,
  overallDiscountType = "none",
  overallDiscountValue = 0,
} = {}) =>
  normalizeDiscountInput({
    baseAmount,
    discountType: overallDiscountType,
    discountValue: overallDiscountValue,
  });

export const prorateAmount = ({
  items = [],
  totalAmount = 0,
  selector = () => 0,
  field = "proratedAmount",
} = {}) => {
  const safeItems = Array.isArray(items) ? items : [];
  const safeTotalAmount = normalizeNonNegativeNumber(totalAmount);
  const eligibleIndexes = safeItems
    .map((item, index) => ({
      index,
      base: normalizeNonNegativeNumber(selector(item)),
    }))
    .filter((item) => item.base > 0);

  if (eligibleIndexes.length === 0 || safeTotalAmount === 0) {
    return safeItems.map((item) => ({ ...item, [field]: 0 }));
  }

  const totalBase = eligibleIndexes.reduce((sum, item) => sum + item.base, 0);
  let allocatedAmount = 0;

  return safeItems.map((item, index) => {
    const eligiblePosition = eligibleIndexes.findIndex(
      (candidate) => candidate.index === index
    );
    if (eligiblePosition === -1) {
      return { ...item, [field]: 0 };
    }

    const isLastEligible = eligiblePosition === eligibleIndexes.length - 1;
    const share = isLastEligible
      ? roundMoney(safeTotalAmount - allocatedAmount)
      : roundMoney(
          safeTotalAmount *
            (eligibleIndexes[eligiblePosition].base / totalBase)
        );
    const cappedShare = Math.min(
      eligibleIndexes[eligiblePosition].base,
      normalizeNonNegativeNumber(share)
    );

    allocatedAmount = roundMoney(allocatedAmount + cappedShare);

    return {
      ...item,
      [field]: cappedShare,
    };
  });
};
