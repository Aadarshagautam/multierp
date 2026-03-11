import { sharedCustomerService } from "../../../shared/customers/service.js";

const POS_CUSTOMER_SCOPE_OPTIONS = {
  branchMode: "current_or_global",
  defaultToCurrentBranch: true,
};

export const customerService = {
  async create(data, req) {
    return sharedCustomerService.create(data, req, {
      ...POS_CUSTOMER_SCOPE_OPTIONS,
      source: "pos",
    });
  },

  async list(req) {
    return sharedCustomerService.list(req, POS_CUSTOMER_SCOPE_OPTIONS);
  },

  async getById(id, req) {
    return sharedCustomerService.getById(id, req, POS_CUSTOMER_SCOPE_OPTIONS);
  },

  async update(id, data, req) {
    return sharedCustomerService.update(id, data, req, POS_CUSTOMER_SCOPE_OPTIONS);
  },

  async delete(id, req) {
    return sharedCustomerService.softDelete(id, req, POS_CUSTOMER_SCOPE_OPTIONS);
  },

  async adjustCredit(id, amount, req) {
    return sharedCustomerService.adjustCredit(
      id,
      amount,
      req,
      POS_CUSTOMER_SCOPE_OPTIONS
    );
  },

  async ensureWalkIn(req) {
    return sharedCustomerService.ensureWalkInCustomer(
      req,
      POS_CUSTOMER_SCOPE_OPTIONS
    );
  },
};
