import { sendCreated, sendError, sendSuccess } from "../../core/utils/response.js";
import { sharedCustomerService } from "../../shared/customers/service.js";

const CUSTOMER_SCOPE_OPTIONS = {
  branchMode: "all",
  defaultToCurrentBranch: false,
};

export const getCustomers = async (req, res) => {
  try {
    const customers = await sharedCustomerService.list(req, CUSTOMER_SCOPE_OPTIONS);
    return sendSuccess(res, { data: customers });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await sharedCustomerService.getById(
      id,
      req,
      CUSTOMER_SCOPE_OPTIONS
    );
    if (!customer) {
      return sendError(res, { status: 404, message: "Customer not found" });
    }
    return sendSuccess(res, { data: customer });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const customer = await sharedCustomerService.create(
      req.validated?.body ?? req.body,
      req,
      {
        ...CUSTOMER_SCOPE_OPTIONS,
        source: "backoffice",
      }
    );
    return sendCreated(res, customer, "Customer created");
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await sharedCustomerService.update(
      id,
      req.validated?.body ?? req.body,
      req,
      CUSTOMER_SCOPE_OPTIONS
    );

    if (customer === undefined) {
      return sendError(res, { status: 400, message: "No valid fields to update" });
    }

    if (!customer) {
      return sendError(res, { status: 404, message: "Customer not found" });
    }

    return sendSuccess(res, { data: customer, message: "Customer updated" });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await sharedCustomerService.softDelete(
      id,
      req,
      CUSTOMER_SCOPE_OPTIONS
    );
    if (!customer) {
      return sendError(res, { status: 404, message: "Customer not found" });
    }

    return sendSuccess(res, {
      data: customer,
      message: "Customer archived",
    });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const searchCustomers = async (req, res) => {
  try {
    const customers = await sharedCustomerService.search(req, CUSTOMER_SCOPE_OPTIONS);
    return sendSuccess(res, { data: customers });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};
