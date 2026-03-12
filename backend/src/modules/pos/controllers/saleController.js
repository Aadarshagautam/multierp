import { saleService } from "../services/saleService.js";
import {
  sendSuccess,
  sendCreated,
  sendError,
} from "../../../core/utils/response.js";
import asyncHandler from "../asyncHandler.js";
import { buildAuditChanges, logAudit } from "../../../core/utils/auditLogger.js";

export const createSale = asyncHandler(async (req, res) => {
  const sale = await saleService.create(req.validated?.body ?? req.body, req);
  const detailedSale = await saleService.getById(sale._id, req);
  return sendCreated(res, detailedSale || sale, "Sale completed");
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
  const existingSale = await saleService.getById(req.params.id, req);
  const sale = await saleService.refund(req.params.id, req);
  await logAudit(
    {
      action: "refund",
      module: "pos",
      targetId: sale._id,
      targetName: sale.invoiceNo,
      description: `Refunded POS sale ${sale.invoiceNo}`,
      changes: buildAuditChanges(existingSale?.toObject?.() || existingSale, sale.toObject(), [
        "status",
        "orderStatus",
        "refundedAt",
      ]),
      metadata: {
        grandTotal: sale.grandTotal,
        paymentMethod: sale.paymentMethod,
      },
    },
    req
  );
  return sendSuccess(res, { data: sale, message: "Sale refunded" });
});

export const getSaleStats = asyncHandler(async (req, res) => {
  const stats = await saleService.getStats(req);
  return sendSuccess(res, { data: stats });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.validated?.body ?? req.body;
  const previousSale = await saleService.getById(req.params.id, req);
  const sale = await saleService.updateOrderStatus(req.params.id, orderStatus, req);
  if (!sale) return sendError(res, { status: 404, message: "Sale not found" });
  await logAudit(
    {
      action: orderStatus === "cancelled" ? "cancel" : "status_change",
      module: "pos",
      targetId: sale._id,
      targetName: sale.invoiceNo,
      description:
        orderStatus === "cancelled"
          ? `Cancelled POS order ${sale.invoiceNo}`
          : `Changed POS order ${sale.invoiceNo} status to ${orderStatus}`,
      changes: buildAuditChanges(previousSale?.toObject?.() || previousSale, sale.toObject(), [
        "orderStatus",
      ]),
      metadata: {
        orderType: sale.orderType,
        tableNumber: sale.tableNumber,
      },
    },
    req
  );
  return sendSuccess(res, { data: sale, message: "Order status updated" });
});

export const getKitchenOrders = asyncHandler(async (req, res) => {
  const orders = await saleService.getKitchenOrders(req);
  return sendSuccess(res, { data: orders });
});
