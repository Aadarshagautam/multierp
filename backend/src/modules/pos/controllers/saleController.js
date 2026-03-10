import { saleService } from "../services/saleService.js";
import {
  sendSuccess,
  sendCreated,
  sendError,
} from "../../../core/utils/response.js";
import asyncHandler from "../asyncHandler.js";

export const createSale = asyncHandler(async (req, res) => {
  const sale = await saleService.create(req.validated, req);
  return sendCreated(res, sale, "Sale completed");
});

export const getSales = asyncHandler(async (req, res) => {
  const result = await saleService.list(req);
  return sendSuccess(res, { data: result });
});

export const getSale = asyncHandler(async (req, res) => {
  const sale = await saleService.getById(req.params.id, req);
  if (!sale) return sendError(res, { status: 404, message: "Sale not found" });
  return sendSuccess(res, { data: sale });
});

export const refundSale = asyncHandler(async (req, res) => {
  const sale = await saleService.refund(req.params.id, req);
  return sendSuccess(res, { data: sale, message: "Sale refunded" });
});

export const getSaleStats = asyncHandler(async (req, res) => {
  const stats = await saleService.getStats(req);
  return sendSuccess(res, { data: stats });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  const valid = ["pending", "preparing", "ready", "served", "completed", "cancelled"];
  if (!valid.includes(orderStatus))
    return sendError(res, { status: 400, message: "Invalid order status" });
  const sale = await saleService.updateOrderStatus(req.params.id, orderStatus, req);
  if (!sale) return sendError(res, { status: 404, message: "Sale not found" });
  return sendSuccess(res, { data: sale, message: "Order status updated" });
});

export const getKitchenOrders = asyncHandler(async (req, res) => {
  const orders = await saleService.getKitchenOrders(req);
  return sendSuccess(res, { data: orders });
});
