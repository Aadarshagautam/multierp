import PosProduct from "../models/Product.js";
import { buildPosScopeFilter, getPosBranchId } from "../utils/scope.js";

export const productService = {
  async create(data, req) {
    const product = new PosProduct({
      ...data,
      userId: req.userId,
      orgId: req.orgId || null,
      branchId: getPosBranchId(req),
    });
    return product.save();
  },

  async list(req) {
    const filter = { ...buildPosScopeFilter(req), isActive: true };
    const { search, category, isAvailable, page = 1, limit = 50 } = req.query;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
      ];
    }
    if (category) filter.category = category;
    if (isAvailable !== undefined) {
      filter.isAvailable = String(isAvailable) === "true";
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      PosProduct.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      PosProduct.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    };
  },

  async getById(id, req) {
    return PosProduct.findOne({ _id: id, ...buildPosScopeFilter(req) });
  },

  async update(id, data, req) {
    return PosProduct.findOneAndUpdate(
      { _id: id, ...buildPosScopeFilter(req) },
      { $set: data },
      { new: true, runValidators: true }
    );
  },

  async softDelete(id, req) {
    return PosProduct.findOneAndUpdate(
      { _id: id, ...buildPosScopeFilter(req) },
      { $set: { isActive: false } },
      { new: true }
    );
  },

  async getLowStock(req) {
    const filter = { ...buildPosScopeFilter(req), isActive: true };
    const products = await PosProduct.find(filter);
    return products.filter((p) => p.stockQty <= p.lowStockAlert);
  },

  async getCategories(req) {
    const filter = { ...buildPosScopeFilter(req), isActive: true };
    return PosProduct.distinct("category", filter);
  },
};
