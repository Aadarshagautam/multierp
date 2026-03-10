import asyncHandler from "../asyncHandler.js";
import { shiftService } from "../services/shiftService.js";
import { sendSuccess, sendCreated, sendError } from "../../../core/utils/response.js";

export const getCurrentShift = asyncHandler(async (req, res) => {
  const shift = await shiftService.getCurrentShift(req);
  sendSuccess(res, { data: shift || null });
});

export const openShift = asyncHandler(async (req, res) => {
  const shift = await shiftService.open(req.body, req);
  sendCreated(res, shift, "Shift opened");
});

export const closeShift = asyncHandler(async (req, res) => {
  const shift = await shiftService.close(req.params.id, req.body, req);
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
