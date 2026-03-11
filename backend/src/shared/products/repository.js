import ProductModel from "./model.js";
import { buildTenantFilter } from "../../core/utils/tenant.js";

export const buildProductScopeFilter = (context = {}) => {
  const filter = buildTenantFilter(context);

  if (context.orgId && context.membership?.branchId) {
    filter.branchId = context.membership.branchId;
  }

  return filter;
};

export const getProductBranchId = (context = {}) => context.membership?.branchId || null;

export const productRepository = {
  create(data) {
    return new ProductModel(data);
  },

  find(filter = {}) {
    return ProductModel.find(filter);
  },

  count(filter = {}) {
    return ProductModel.countDocuments(filter);
  },

  findOne(filter = {}) {
    return ProductModel.findOne(filter);
  },

  findScopedById(id, context = {}) {
    return ProductModel.findOne({ _id: id, ...buildProductScopeFilter(context) });
  },

  findScopedByIdAndUpdate(id, updates, context = {}, options = {}) {
    return ProductModel.findOneAndUpdate(
      { _id: id, ...buildProductScopeFilter(context) },
      updates,
      options
    );
  },

  distinct(field, filter = {}) {
    return ProductModel.distinct(field, filter);
  },
};
