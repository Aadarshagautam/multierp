import asyncHandler from "../asyncHandler.js";
import { shiftService } from "../services/shiftService.js";
import { sendSuccess, sendCreated, sendError } from "../../../core/utils/response.js";
import { buildAuditChanges, logAudit } from "../../../core/utils/auditLogger.js";

export const getCurrentShift = asyncHandler(async (req, res) => {
  const shift = await shiftService.getCurrentShift(req);
  sendSuccess(res, { data: shift || null });
});

export const openShift = asyncHandler(async (req, res) => {
  const shift = await shiftService.open(req.body, req);
  await logAudit(
    {
      action: "open",
      module: "pos",
      targetId: shift._id,
      targetName: `Shift ${shift._id}`,
      description: "Opened a POS shift",
      metadata: {
        openingCash: shift.openingCash,
      },
    },
    req
  );
  sendCreated(res, shift, "Shift opened");
});

export const closeShift = asyncHandler(async (req, res) => {
  const existingShift = await shiftService.getById(req.params.id, req);
  const shift = await shiftService.close(req.params.id, req.body, req);
  await logAudit(
    {
      action: "close",
      module: "pos",
      targetId: shift._id,
      targetName: `Shift ${shift._id}`,
      description: "Closed a POS shift",
      changes: buildAuditChanges(existingShift?.toObject?.() || existingShift, shift.toObject(), [
        "status",
        "closingCash",
        "expectedCash",
        "cashDifference",
        "totalSales",
        "totalTransactions",
        "closedAt",
      ]),
    },
    req
  );
  sendSuccess(res, { data: shift, message: "Shift closed" });
});

export const getShifts = asyncHandler(async (req, res) => {
  const shifts = await shiftService.list(req);
  sendSuccess(res, { data: shifts });
});

export const getShift = asyncHandler(async (req, res) => {
  const shift = await shiftService.getById(req.params.id, req);
  if (!shift) return sendError(res, { status: 404, message: "Shift not found" });
  sendSuccess(res, { data: shift });
});
