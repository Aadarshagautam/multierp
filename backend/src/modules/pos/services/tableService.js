import PosTable from "../models/Table.js";
import { buildPosScopeFilter, getPosBranchId } from "../utils/scope.js";

export const tableService = {
  async list(req) {
    return PosTable.find({ ...buildPosScopeFilter(req), isActive: true })
      .sort({ number: 1 })
      .populate("currentOrderId", "invoiceNo grandTotal orderStatus");
  },

  async create(data, req) {
    return PosTable.create({
      ...data,
      userId: req.userId,
      orgId: req.orgId || null,
      branchId: getPosBranchId(req),
    });
  },

  async update(id, data, req) {
    return PosTable.findOneAndUpdate(
      { _id: id, ...buildPosScopeFilter(req) },
      { $set: data },
      { new: true, runValidators: true }
    );
  },

  async updateStatus(id, status, req) {
    const updates =
      status === "reserved"
        ? { status }
        : { status, reservation: { customerName: "", phone: "", partySize: 1, reservationAt: null, notes: "", source: "phone" } };

    return PosTable.findOneAndUpdate(
      { _id: id, ...buildPosScopeFilter(req) },
      { $set: updates },
      { new: true }
    );
  },

  async setCurrentOrder(tableId, orderId, req) {
    const status = orderId ? "occupied" : "available";
    return PosTable.findOneAndUpdate(
      { _id: tableId, ...buildPosScopeFilter(req) },
      {
        $set: {
          currentOrderId: orderId,
          status,
          reservation: { customerName: "", phone: "", partySize: 1, reservationAt: null, notes: "", source: "phone" },
        },
      },
      { new: true }
    );
  },

  async reserve(id, data, req) {
    return PosTable.findOneAndUpdate(
      { _id: id, ...buildPosScopeFilter(req) },
      {
        $set: {
          status: "reserved",
          currentOrderId: null,
          reservation: {
            customerName: data.customerName,
            phone: data.phone || "",
            partySize: data.partySize || 1,
            reservationAt: data.reservationAt,
            notes: data.notes || "",
            source: data.source || "phone",
          },
        },
      },
      { new: true, runValidators: true }
    );
  },

  async cancelReservation(id, req) {
    return PosTable.findOneAndUpdate(
      { _id: id, ...buildPosScopeFilter(req) },
      {
        $set: {
          status: "available",
          reservation: { customerName: "", phone: "", partySize: 1, reservationAt: null, notes: "", source: "phone" },
        },
      },
      { new: true }
    );
  },

  async delete(id, req) {
    return PosTable.findOneAndUpdate(
      { _id: id, ...buildPosScopeFilter(req) },
      { $set: { isActive: false } },
      { new: true }
    );
  },
};
