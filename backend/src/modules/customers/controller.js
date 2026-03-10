import Customer from "./model.js";
import { pick } from "../../core/utils/pick.js";
import { sendCreated, sendError, sendSuccess } from "../../core/utils/response.js";
import { buildTenantFilter, mergeTenantFilter } from "../../core/utils/tenant.js";

export const getCustomers = async (req, res) => {
  try {
    const ownerFilter = buildTenantFilter(req);
    const customers = await Customer.find(ownerFilter).sort({ createdAt: -1 });
    return sendSuccess(res, { data: customers });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findOne(mergeTenantFilter(req, { _id: id }));
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
    const userId = req.userId;
    const { name, email, phone, company, address, gstin, notes } = req.body;

    if (!name) {
      return sendError(res, { status: 400, message: "Customer name is required" });
    }

    const customer = new Customer({
      name, email, phone, company, address, gstin, notes, userId,
      orgId: req.orgId,
    });

    await customer.save();
    return sendCreated(res, customer, "Customer created");
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const updates = pick(req.body, [
      "name",
      "email",
      "phone",
      "company",
      "address",
      "gstin",
      "notes",
    ]);
    const ownerFilter = buildTenantFilter(req);

    if (Object.keys(updates).length === 0) {
      return sendError(res, { status: 400, message: "No valid fields to update" });
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: id, ...ownerFilter },
      { $set: updates },
      { new: true, runValidators: true }
    );
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
    const ownerFilter = buildTenantFilter(req);

    const customer = await Customer.findOneAndDelete({ _id: id, ...ownerFilter });
    if (!customer) {
      return sendError(res, { status: 404, message: "Customer not found" });
    }

    return sendSuccess(res, { message: "Customer deleted" });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const searchCustomers = async (req, res) => {
  try {
    const ownerFilter = buildTenantFilter(req);
    const { q } = req.query;

    if (!q || q.length < 2) {
      return sendSuccess(res, { data: [] });
    }

    const customers = await Customer.find({
      ...ownerFilter,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ],
    }).limit(10);

    return sendSuccess(res, { data: customers });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};
