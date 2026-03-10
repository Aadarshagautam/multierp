import Shift from "../models/Shift.js";
import PosSale from "../models/Sale.js";
import { buildPosScopeFilter, getPosBranchId } from "../utils/scope.js";

export const shiftService = {
  async getCurrentShift(req) {
    return Shift.findOne({ ...buildPosScopeFilter(req), status: "open" })
      .populate("openedBy", "username")
      .sort({ createdAt: -1 });
  },

  async open(data, req) {
    // Only one shift open at a time
    const existing = await Shift.findOne({ ...buildPosScopeFilter(req), status: "open" });
    if (existing) throw new Error("A shift is already open. Close it first.");

    return Shift.create({
      userId: req.userId,
      orgId: req.orgId || null,
      branchId: getPosBranchId(req),
      openedBy: req.userId,
      openingCash: data.openingCash || 0,
      notes: data.notes || "",
      status: "open",
    });
  },

  async close(shiftId, data, req) {
    const shift = await Shift.findOne({ _id: shiftId, ...buildPosScopeFilter(req), status: "open" });
    if (!shift) throw new Error("Open shift not found.");

    // Aggregate sales during this shift
    const [agg] = await PosSale.aggregate([
      {
        $match: {
          shiftId: shift._id,
          status: { $ne: "refund" },
          ...buildPosScopeFilter(req),
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$grandTotal" },
          totalTransactions: { $count: {} },
          cash: { $sum: { $cond: [{ $eq: ["$paymentMethod", "cash"] }, "$paidAmount", 0] } },
          card: { $sum: { $cond: [{ $eq: ["$paymentMethod", "card"] }, "$paidAmount", 0] } },
          esewa: { $sum: { $cond: [{ $eq: ["$paymentMethod", "esewa"] }, "$paidAmount", 0] } },
          khalti: { $sum: { $cond: [{ $eq: ["$paymentMethod", "khalti"] }, "$paidAmount", 0] } },
          credit: { $sum: { $cond: [{ $eq: ["$paymentMethod", "credit"] }, "$paidAmount", 0] } },
          mixed: { $sum: { $cond: [{ $eq: ["$paymentMethod", "mixed"] }, "$paidAmount", 0] } },
        },
      },
    ]);

    const totalSales = agg?.totalSales || 0;
    const cashSales = agg?.cash || 0;
    const expectedCash = shift.openingCash + cashSales;
    const closingCash = data.closingCash ?? expectedCash;
    const cashDifference = closingCash - expectedCash;

    return Shift.findByIdAndUpdate(
      shiftId,
      {
        $set: {
          status: "closed",
          closedBy: req.userId,
          closedAt: new Date(),
          closingCash,
          expectedCash,
          cashDifference,
          totalSales,
          totalTransactions: agg?.totalTransactions || 0,
          salesByMethod: {
            cash: cashSales,
            card: agg?.card || 0,
            esewa: agg?.esewa || 0,
            khalti: agg?.khalti || 0,
            credit: agg?.credit || 0,
            mixed: agg?.mixed || 0,
          },
          notes: data.notes || shift.notes,
        },
      },
      { new: true }
    ).populate("openedBy closedBy", "username");
  },

  async list(req) {
    return Shift.find(buildPosScopeFilter(req))
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("openedBy closedBy", "username");
  },

  async getById(id, req) {
    return Shift.findOne({ _id: id, ...buildPosScopeFilter(req) }).populate(
      "openedBy closedBy",
      "username"
    );
  },
};
