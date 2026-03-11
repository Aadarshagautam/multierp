import { DEFAULT_COUNTRY } from "../../core/utils/nepal.js";
import {
  CUSTOMER_TIER_THRESHOLDS,
  DEFAULT_CUSTOMER_TYPE,
  DEFAULT_WALK_IN_NAME,
} from "./constants.js";

export const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const normalizePhoneDigits = (value = "") =>
  String(value || "").replace(/\D+/g, "").trim();

export const normalizeTaxNumber = (value = "") =>
  String(value || "").trim().toUpperCase();

export const normalizeTags = (tags = []) =>
  [
    ...new Set(
      (Array.isArray(tags) ? tags : [])
        .map((tag) => String(tag || "").trim())
        .filter(Boolean)
    ),
  ];

export const getEmptyAddress = () => ({
  street: "",
  city: "",
  state: "",
  pincode: "",
  country: DEFAULT_COUNTRY,
});

export const normalizeAddress = (value, { partial = false } = {}) => {
  if (value === undefined) {
    return partial ? undefined : getEmptyAddress();
  }

  if (value === null) {
    return getEmptyAddress();
  }

  if (typeof value === "string") {
    const address = getEmptyAddress();
    address.street = value.trim();
    return address;
  }

  if (typeof value !== "object") {
    return partial ? undefined : getEmptyAddress();
  }

  const baseAddress = partial ? {} : getEmptyAddress();
  const normalized = {
    ...baseAddress,
    ...(value.street !== undefined
      ? { street: String(value.street || "").trim() }
      : {}),
    ...(value.city !== undefined ? { city: String(value.city || "").trim() } : {}),
    ...(value.state !== undefined
      ? { state: String(value.state || "").trim() }
      : {}),
    ...(value.pincode !== undefined
      ? { pincode: String(value.pincode || "").trim() }
      : {}),
    ...(value.country !== undefined
      ? { country: String(value.country || "").trim() || DEFAULT_COUNTRY }
      : {}),
  };

  if (!partial && !normalized.country) {
    normalized.country = DEFAULT_COUNTRY;
  }

  return normalized;
};

export const buildAddressText = (address = {}) =>
  [address.street, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");

export const computeCustomerTier = (totalSpent = 0) => {
  if (totalSpent >= CUSTOMER_TIER_THRESHOLDS.platinum) return "platinum";
  if (totalSpent >= CUSTOMER_TIER_THRESHOLDS.gold) return "gold";
  if (totalSpent >= CUSTOMER_TIER_THRESHOLDS.silver) return "silver";
  return "bronze";
};

export const buildDefaultCustomerName = ({
  customerType = DEFAULT_CUSTOMER_TYPE,
  phone = "",
  name = "",
} = {}) => {
  const trimmedName = String(name || "").trim();
  if (trimmedName) return trimmedName;
  if (customerType === "walk_in") return DEFAULT_WALK_IN_NAME;

  const digits = normalizePhoneDigits(phone);
  if (!digits) return "";
  return `Customer ${digits.slice(-4)}`;
};

export const normalizeCustomerPayload = (payload = {}, { partial = false } = {}) => {
  const normalized = { ...payload };

  if (normalized.gstin !== undefined && normalized.taxNumber === undefined) {
    normalized.taxNumber = normalized.gstin;
  }
  delete normalized.gstin;

  if (normalized.address !== undefined || !partial) {
    normalized.address = normalizeAddress(normalized.address, { partial });
  }

  if (normalized.taxNumber !== undefined || !partial) {
    normalized.taxNumber = normalizeTaxNumber(normalized.taxNumber || "");
  }

  if (normalized.phone !== undefined) {
    normalized.phone = String(normalized.phone || "").trim();
  } else if (!partial) {
    normalized.phone = "";
  }

  if (normalized.email !== undefined) {
    normalized.email = String(normalized.email || "").trim().toLowerCase();
  } else if (!partial) {
    normalized.email = "";
  }

  if (normalized.name !== undefined) {
    normalized.name = String(normalized.name || "").trim();
  } else if (!partial) {
    normalized.name = "";
  }

  if (normalized.company !== undefined) {
    normalized.company = String(normalized.company || "").trim();
  } else if (!partial) {
    normalized.company = "";
  }

  if (normalized.notes !== undefined) {
    normalized.notes = String(normalized.notes || "").trim();
  } else if (!partial) {
    normalized.notes = "";
  }

  if (normalized.birthday !== undefined) {
    normalized.birthday = String(normalized.birthday || "").trim();
  } else if (!partial) {
    normalized.birthday = "";
  }

  if (normalized.tags !== undefined || !partial) {
    normalized.tags = normalizeTags(normalized.tags);
  }

  if (normalized.creditLimit === "") normalized.creditLimit = null;
  if (!partial && normalized.creditLimit === undefined) normalized.creditLimit = null;

  if (!partial && normalized.customerType === undefined) {
    normalized.customerType = DEFAULT_CUSTOMER_TYPE;
  }

  if (!partial && normalized.isActive === undefined) {
    normalized.isActive = true;
  }

  const defaultName = buildDefaultCustomerName({
    customerType: normalized.customerType,
    phone: normalized.phone,
    name: normalized.name,
  });
  if (!partial || normalized.name !== undefined) {
    normalized.name = defaultName;
  }

  return normalized;
};

export const mapLegacyPosCustomerToShared = (legacyCustomer = {}) =>
  normalizeCustomerPayload(
    {
      _id: legacyCustomer._id,
      userId: legacyCustomer.userId,
      orgId: legacyCustomer.orgId || null,
      branchId: legacyCustomer.branchId || null,
      legacyPosCustomerId: legacyCustomer._id,
      name: legacyCustomer.name || "",
      phone: legacyCustomer.phone || "",
      email: legacyCustomer.email || "",
      address: legacyCustomer.address || "",
      customerType: "regular",
      creditBalance: legacyCustomer.creditBalance || 0,
      loyaltyPoints: legacyCustomer.loyaltyPoints || 0,
      totalSpent: legacyCustomer.totalSpent || 0,
      visitCount: legacyCustomer.visitCount || 0,
      tier: legacyCustomer.tier || computeCustomerTier(legacyCustomer.totalSpent || 0),
      birthday: legacyCustomer.birthday || "",
      notes: legacyCustomer.notes || "",
      isActive: legacyCustomer.isActive ?? true,
      createdBy: legacyCustomer.createdBy || legacyCustomer.userId || null,
      updatedBy: legacyCustomer.updatedBy || legacyCustomer.userId || null,
      createdAt: legacyCustomer.createdAt,
      updatedAt: legacyCustomer.updatedAt,
      source: "legacy_pos",
    },
    { partial: false }
  );

export const buildCustomerSnapshot = (customer = {}) => ({
  customerId: customer._id || null,
  customerName: customer.name || "",
  customerEmail: customer.email || "",
  customerPhone: customer.phone || "",
  customerAddress: normalizeAddress(customer.address),
  customerGstin: normalizeTaxNumber(customer.taxNumber || customer.gstin || ""),
  customerType: customer.customerType || DEFAULT_CUSTOMER_TYPE,
  customerBranchId: customer.branchId || null,
});
