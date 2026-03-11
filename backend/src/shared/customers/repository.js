import CustomerModel from "./model.js";
import { buildTenantFilter } from "../../core/utils/tenant.js";

export const getCustomerBranchId = (context = {}) =>
  context.membership?.branchId || null;

export const buildCustomerScopeConditions = (
  context = {},
  { branchMode = "all", branchId = undefined } = {}
) => {
  const conditions = [];
  const tenantFilter = buildTenantFilter(context);

  if (Object.keys(tenantFilter).length > 0) {
    conditions.push(tenantFilter);
  }

  if (!context.orgId) {
    return conditions;
  }

  const effectiveBranchId =
    branchId !== undefined ? branchId : getCustomerBranchId(context);

  if (!effectiveBranchId) {
    return conditions;
  }

  if (branchMode === "current") {
    conditions.push({ branchId: effectiveBranchId });
  }

  if (branchMode === "current_or_global") {
    conditions.push({
      $or: [
        { branchId: effectiveBranchId },
        { branchId: null },
        { branchId: { $exists: false } },
      ],
    });
  }

  return conditions;
};

export const combineCustomerConditions = (...conditions) => {
  const filtered = conditions
    .flat()
    .filter(Boolean)
    .filter((condition) => Object.keys(condition).length > 0);

  if (filtered.length === 0) return {};
  if (filtered.length === 1) return filtered[0];

  const plainConditions = [];
  const operatorConditions = [];

  filtered.forEach((condition) => {
    if (Object.keys(condition).some((key) => key.startsWith("$"))) {
      operatorConditions.push(condition);
      return;
    }

    plainConditions.push(condition);
  });

  const mergedPlainCondition = Object.assign({}, ...plainConditions);

  if (operatorConditions.length === 0) {
    return mergedPlainCondition;
  }

  if (operatorConditions.length === 1) {
    return {
      ...mergedPlainCondition,
      ...operatorConditions[0],
    };
  }

  return {
    ...mergedPlainCondition,
    $and: operatorConditions,
  };
};

export const customerRepository = {
  create(data) {
    return new CustomerModel(data);
  },

  find(filter = {}) {
    return CustomerModel.find(filter);
  },

  findOne(filter = {}) {
    return CustomerModel.findOne(filter);
  },

  count(filter = {}) {
    return CustomerModel.countDocuments(filter);
  },

  findScopedById(id, context = {}, options = {}) {
    const query = CustomerModel.findOne(
      combineCustomerConditions({ _id: id }, buildCustomerScopeConditions(context, options))
    );
    return options.session ? query.session(options.session) : query;
  },

  findScopedByIdAndUpdate(id, updates, context = {}, options = {}, queryOptions = {}) {
    const query = CustomerModel.findOneAndUpdate(
      combineCustomerConditions({ _id: id }, buildCustomerScopeConditions(context, options)),
      updates,
      queryOptions
    );
    return options.session ? query.session(options.session) : query;
  },
};
