import asyncHandler from "../asyncHandler.js";
import { tableService } from "../services/tableService.js";
import { sendSuccess, sendCreated, sendError } from "../../../core/utils/response.js";

export const getTables = asyncHandler(async (req, res) => {
  const tables = await tableService.list(req);
  sendSuccess(res, { data: tables });
});

export const createTable = asyncHandler(async (req, res) => {
  const table = await tableService.create(req.validated, req);
  sendCreated(res, table, "Table created");
});

export const updateTable = asyncHandler(async (req, res) => {
  const table = await tableService.update(req.params.id, req.validated, req);
  if (!table) return sendError(res, { status: 404, message: "Table not found" });
  sendSuccess(res, { data: table, message: "Table updated" });
});

export const updateTableStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const valid = ["available", "occupied", "reserved", "cleaning"];
  if (!valid.includes(status)) return sendError(res, { status: 400, message: "Invalid status" });
  const table = await tableService.updateStatus(req.params.id, status, req);
  if (!table) return sendError(res, { status: 404, message: "Table not found" });
  sendSuccess(res, { data: table, message: "Status updated" });
});

export const reserveTable = asyncHandler(async (req, res) => {
  const table = await tableService.reserve(req.params.id, req.validated, req);
  if (!table) return sendError(res, { status: 404, message: "Table not found" });
  sendSuccess(res, { data: table, message: "Reservation saved" });
});

export const cancelTableReservation = asyncHandler(async (req, res) => {
  const table = await tableService.cancelReservation(req.params.id, req);
  if (!table) return sendError(res, { status: 404, message: "Table not found" });
  sendSuccess(res, { data: table, message: "Reservation cleared" });
});

export const deleteTable = asyncHandler(async (req, res) => {
  await tableService.delete(req.params.id, req);
  sendSuccess(res, { message: "Table removed" });
});
