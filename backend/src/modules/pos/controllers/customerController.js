import { customerService } from "../services/customerService.js";
import {
  sendSuccess,
  sendCreated,
  sendError,
} from "../../../core/utils/response.js";
import asyncHandler from "../asyncHandler.js";

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.create(req.validated?.body ?? req.body, req);
  return sendCreated(res, customer, "Customer created");
});

export const getCustomers = asyncHandler(async (req, res) => {
  const customers = await customerService.list(req);
  return sendSuccess(res, { data: customers });
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.getById(req.params.id, req);
  if (!customer) return sendError(res, { status: 404, message: "Customer not found" });
  return sendSuccess(res, { data: customer });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.update(
    req.params.id,
    req.validated?.body ?? req.body,
    req
  );
  if (customer === undefined) {
    return sendError(res, { status: 400, message: "No valid fields to update" });
  }
  if (!customer) return sendError(res, { status: 404, message: "Customer not found" });
  return sendSuccess(res, { data: customer, message: "Customer updated" });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.delete(req.params.id, req);
  if (!customer) return sendError(res, { status: 404, message: "Customer not found" });
  return sendSuccess(res, { message: "Customer deleted" });
});
