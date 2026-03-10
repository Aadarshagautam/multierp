import PosCustomer from "../models/Customer.js";
import { buildPosScopeFilter, getPosBranchId } from "../utils/scope.js";

export const customerService = {
  async create(data, req) {
    const customer = new PosCustomer({
      ...data,
      userId: req.userId,
      orgId: req.orgId || null,
      branchId: getPosBranchId(req),
    });
    return customer.save();
  },

  async list(req) {
    const filter = { ...buildPosScopeFilter(req) };
    const { search } = req.query;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    return PosCustomer.find(filter).sort({ createdAt: -1 });
  },

  async getById(id, req) {
    return PosCustomer.findOne({ _id: id, ...buildPosScopeFilter(req) });
  },

  async update(id, data, req) {
    return PosCustomer.findOneAndUpdate(
      { _id: id, ...buildPosScopeFilter(req) },
      { $set: data },
      { new: true, runValidators: true }
    );
  },

  async delete(id, req) {
    return PosCustomer.findOneAndDelete({ _id: id, ...buildPosScopeFilter(req) });
  },

  async adjustCredit(id, amount, req) {
    return PosCustomer.findOneAndUpdate(
      { _id: id, ...buildPosScopeFilter(req) },
      { $inc: { creditBalance: amount } },
      { new: true }
    );
  },
};
