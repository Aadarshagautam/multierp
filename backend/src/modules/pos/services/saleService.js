import mongoose from "mongoose";
import PosSale from "../models/Sale.js";
import PosProduct from "../models/Product.js";
import PosCustomer from "../models/Customer.js";
import PosTable from "../models/Table.js";
import Shift from "../models/Shift.js";
import StockMovement from "../models/StockMovement.js";
import { buildPosScopeFilter, getPosBranchId } from "../utils/scope.js";
import {
  consumeRecipeStock,
  restoreRecipeStock,
} from "../../inventory/stockService.js";
import {
  buildPosInvoiceNumber,
  buildPosInvoiceSequenceKey,
  getNextSequence,
} from "../../../core/utils/sequence.js";

// Loyalty tier thresholds (total spent in Rs.)
const LOYALTY_POINTS_RATE = 1;          // 1 point per Rs. spent
const LOYALTY_POINT_VALUE = 0.5;        // 1 point = Rs. 0.5 discount
const TIER_THRESHOLDS = { silver: 5000, gold: 20000, platinum: 50000 };

function computeTier(totalSpent) {
  if (totalSpent >= TIER_THRESHOLDS.platinum) return "platinum";
  if (totalSpent >= TIER_THRESHOLDS.gold) return "gold";
  if (totalSpent >= TIER_THRESHOLDS.silver) return "silver";
  return "bronze";
}

const usesRecipeStock = (product) => Array.isArray(product?.recipe) && product.recipe.length > 0;

export const saleService = {
  async create(data, req) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const scopeFilter = buildPosScopeFilter(req);
      const branchId = getPosBranchId(req);
      const allowNegative = process.env.ALLOW_NEGATIVE_STOCK === "true";
      const lineItems = [];
      let subTotal = 0;
      let taxTotal = 0;
      const currentShift = await Shift.findOne({ ...scopeFilter, status: "open" })
        .sort({ createdAt: -1 })
        .session(session);

      if (!currentShift) {
        throw new Error("Open a shift before billing a sale.");
      }

      if (data.paymentMethod === "credit" && !data.customerId) {
        throw new Error("Credit billing requires a selected customer account.");
      }

      const customer = data.customerId
        ? await PosCustomer.findOne({ _id: data.customerId, ...scopeFilter }).session(session)
        : null;

      if (data.customerId && !customer) {
        throw new Error("Selected customer was not found for this branch.");
      }

      const pointsRedeemed = data.loyaltyPointsRedeemed || 0;
      if (pointsRedeemed > 0 && !customer) {
        throw new Error("Select a customer before redeeming loyalty points.");
      }
      if (pointsRedeemed > (customer?.loyaltyPoints || 0)) {
        throw new Error("The selected customer does not have enough loyalty points.");
      }

      for (const item of data.items) {
        const product = await PosProduct.findOne({ _id: item.productId, ...scopeFilter }).session(session);
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        if (!product.isActive) throw new Error(`Product is inactive: ${product.name}`);
        if (!product.isAvailable) throw new Error(`"${product.name}" is currently not available`);
        const recipeDrivenStock = usesRecipeStock(product);

        if (!recipeDrivenStock && !allowNegative && product.stockQty < item.qty) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stockQty}, Requested: ${item.qty}`
          );
        }

        // Modifier price addition
        const modifierTotal = (item.modifiers || []).reduce((s, m) => s + (m.price || 0), 0);
        const price = (item.price ?? product.sellingPrice) + modifierTotal;
        const lineDiscount = item.discount || 0;
        const taxableAmount = price * item.qty - lineDiscount;
        const lineTax = (taxableAmount * product.taxRate) / 100;
        const lineTotal = taxableAmount + lineTax;

        lineItems.push({
          productId: product._id,
          nameSnapshot: product.name,
          skuSnapshot: product.sku || "",
          menuCategory: product.menuCategory || "",
          qty: item.qty,
          price,
          discount: lineDiscount,
          tax: Math.round(lineTax * 100) / 100,
          lineTotal: Math.round(lineTotal * 100) / 100,
          modifiers: item.modifiers || [],
          notes: item.notes || "",
          status: data.orderType === "dine-in" ? "pending" : "completed",
        });

        subTotal += price * item.qty;
        taxTotal += lineTax;

        if (recipeDrivenStock) {
          await consumeRecipeStock({
            product,
            saleQty: item.qty,
            req,
            session,
            allowNegative,
          });
        } else {
          await PosProduct.findByIdAndUpdate(product._id, { $inc: { stockQty: -item.qty } }, { session });
          await StockMovement.create(
            [{
              orgId: req.orgId || null,
              branchId,
              productId: product._id,
              type: "OUT",
              qty: item.qty,
              reason: "Sale",
              createdBy: req.userId,
            }],
            { session }
          );
        }
      }

      // Totals
      const overallDiscount = data.overallDiscount || 0;
      const discountTotal = lineItems.reduce((s, i) => s + i.discount, 0) + overallDiscount;
      taxTotal = Math.round(taxTotal * 100) / 100;
      subTotal = Math.round(subTotal * 100) / 100;

      // Loyalty points redemption
      const loyaltyDiscount = Math.round(pointsRedeemed * LOYALTY_POINT_VALUE * 100) / 100;

      const grandTotal = Math.max(
        0,
        Math.round((subTotal - overallDiscount - loyaltyDiscount + taxTotal) * 100) / 100
      );
      const paidAmount = data.paidAmount ?? grandTotal;
      const dueAmount = Math.round((grandTotal - paidAmount) * 100) / 100;

      if (dueAmount > 0 && !customer) {
        throw new Error("A customer account is required to leave an unpaid balance.");
      }
      if (dueAmount > 0 && !["credit", "mixed"].includes(data.paymentMethod || "cash")) {
        throw new Error("Use credit or mixed payment to keep an unpaid balance.");
      }

      let payStatus = "paid";
      if (dueAmount > 0 && paidAmount > 0) payStatus = "partial";
      if (paidAmount === 0) payStatus = "due";

      const orderStatus = data.orderType === "dine-in" ? "pending" : "completed";
      const pointsEarned = Math.floor(grandTotal * LOYALTY_POINTS_RATE);
      const invoiceSeq = await getNextSequence(
        buildPosInvoiceSequenceKey({
          orgId: req.orgId,
          userId: req.userId,
          branchId,
        }),
        { session }
      );

      const [sale] = await PosSale.create(
        [{
          userId: req.userId,
          orgId: req.orgId || null,
          branchId,
          invoiceNo: buildPosInvoiceNumber({
            orgId: req.orgId,
            userId: req.userId,
            branchId,
            seq: invoiceSeq,
          }),
          items: lineItems,
          subTotal,
          discountTotal: discountTotal + loyaltyDiscount,
          taxTotal,
          grandTotal,
          paymentMethod: data.paymentMethod || "cash",
          paidAmount,
          dueAmount,
          customerId: data.customerId || null,
          soldBy: req.userId,
          status: payStatus,
          notes: data.notes || "",
          orderType: data.orderType || "takeaway",
          tableId: data.tableId || null,
          tableNumber: null,
          deliveryAddress: data.deliveryAddress || "",
          orderStatus,
          shiftId: currentShift?._id || null,
          loyaltyPointsEarned: pointsEarned,
          loyaltyPointsRedeemed: pointsRedeemed,
        }],
        { session }
      );

      // Update table status if dine-in
      if (data.orderType === "dine-in" && data.tableId) {
        const table = await PosTable.findOne({ _id: data.tableId, ...scopeFilter }).session(session);
        if (table) {
          sale.tableNumber = table.number;
          await PosTable.findOneAndUpdate(
            { _id: data.tableId, ...scopeFilter },
            { $set: { status: "occupied", currentOrderId: sale._id } },
            { session }
          );
        } else {
          throw new Error("Selected table was not found for this branch");
        }
      }

      // Customer: credit, loyalty, stats
      if (data.customerId) {
        const customerUpdate = {
          $inc: {
            totalSpent: grandTotal,
            visitCount: 1,
            loyaltyPoints: pointsEarned - pointsRedeemed,
            ...(dueAmount > 0 && data.paymentMethod === "credit" ? { creditBalance: dueAmount } : {}),
          },
        };
        const updatedCustomer = await PosCustomer.findOneAndUpdate(
          { _id: data.customerId, ...scopeFilter },
          customerUpdate,
          { session, new: true }
        );
        if (updatedCustomer) {
          const newTier = computeTier(updatedCustomer.totalSpent);
          if (newTier !== updatedCustomer.tier) {
            await PosCustomer.findOneAndUpdate(
              { _id: data.customerId, ...scopeFilter },
              { $set: { tier: newTier } },
              { session }
            );
          }
        } else {
          throw new Error("Selected customer was not found for this branch");
        }
      }

      await session.commitTransaction();
      return sale;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async list(req) {
    const filter = { ...buildPosScopeFilter(req) };
    const { status, customerId, orderType, startDate, endDate, page = 1, limit = 20 } = req.query;

    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (orderType) filter.orderType = orderType;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [sales, total] = await Promise.all([
      PosSale.find(filter)
        .populate("customerId", "name phone")
        .populate("tableId", "number name section")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      PosSale.countDocuments(filter),
    ]);

    return {
      sales,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    };
  },

  async getById(id, req) {
    return PosSale.findOne({ _id: id, ...buildPosScopeFilter(req) })
      .populate("customerId", "name phone email address loyaltyPoints tier")
      .populate("soldBy", "username email")
      .populate("tableId", "number name section");
  },

  async updateOrderStatus(id, orderStatus, req) {
    const scopeFilter = buildPosScopeFilter(req);
    const sale = await PosSale.findOneAndUpdate(
      { _id: id, ...scopeFilter },
      { $set: { orderStatus } },
      { new: true }
    );
    // If completed/cancelled, free the table
    if (sale?.tableId && ["completed", "cancelled"].includes(orderStatus)) {
      await PosTable.findOneAndUpdate({ _id: sale.tableId, ...scopeFilter }, {
        $set: { status: "available", currentOrderId: null },
      });
    }
    return sale;
  },

  async getKitchenOrders(req) {
    const filter = {
      ...buildPosScopeFilter(req),
      orderStatus: { $in: ["pending", "preparing", "ready"] },
      status: { $ne: "refund" },
    };
    return PosSale.find(filter)
      .populate("tableId", "number name section")
      .sort({ createdAt: 1 })
      .limit(50);
  },

  async refund(saleId, req) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const scopeFilter = buildPosScopeFilter(req);
      const sale = await PosSale.findOne({ _id: saleId, ...scopeFilter }).session(session);
      if (!sale) throw new Error("Sale not found");
      if (sale.status === "refund") throw new Error("Sale already refunded");

      for (const item of sale.items) {
        const product = await PosProduct.findOne({ _id: item.productId, ...scopeFilter }).session(session);

        if (usesRecipeStock(product)) {
          await restoreRecipeStock({
            product,
            saleQty: item.qty,
            req,
            session,
          });
        } else {
          await PosProduct.findOneAndUpdate(
            { _id: item.productId, ...scopeFilter },
            { $inc: { stockQty: item.qty } },
            { session }
          );
          await StockMovement.create(
            [{
              orgId: req.orgId || null,
              branchId: sale.branchId || getPosBranchId(req),
              productId: item.productId,
              type: "IN",
              qty: item.qty,
              reason: `Refund - ${sale.invoiceNo}`,
              refSaleId: sale._id,
              createdBy: req.userId,
            }],
            { session }
          );
        }
      }

      sale.status = "refund";
      sale.orderStatus = "cancelled";
      await sale.save({ session });

      // Free table
      if (sale.tableId) {
        await PosTable.findOneAndUpdate(
          { _id: sale.tableId, ...scopeFilter },
          { $set: { status: "available", currentOrderId: null } },
          { session }
        );
      }

      // Reverse loyalty + credit
      if (sale.customerId) {
        await PosCustomer.findOneAndUpdate(
          { _id: sale.customerId, ...scopeFilter },
          {
            $inc: {
              totalSpent: -sale.grandTotal,
              loyaltyPoints: -(sale.loyaltyPointsEarned - sale.loyaltyPointsRedeemed),
              ...(sale.dueAmount > 0 ? { creditBalance: -sale.dueAmount } : {}),
            },
          },
          { session }
        );
      }

      await session.commitTransaction();
      return sale;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async getStats(req) {
    const base = { ...buildPosScopeFilter(req), status: { $ne: "refund" } };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Last 7 days for chart
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [counts, todayCounts, revenue, todayRevenue, hourly, daily, byOrderType] = await Promise.all([
      PosSale.countDocuments(base),
      PosSale.countDocuments({ ...base, createdAt: { $gte: today, $lt: tomorrow } }),
      PosSale.aggregate([{ $match: base }, { $group: { _id: null, total: { $sum: "$grandTotal" } } }]),
      PosSale.aggregate([{ $match: { ...base, createdAt: { $gte: today, $lt: tomorrow } } }, { $group: { _id: null, total: { $sum: "$grandTotal" } } }]),
      // Hourly breakdown for today
      PosSale.aggregate([
        { $match: { ...base, createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: { $hour: "$createdAt" }, revenue: { $sum: "$grandTotal" }, count: { $count: {} } } },
        { $sort: { "_id": 1 } },
      ]),
      // Daily for last 7 days
      PosSale.aggregate([
        { $match: { ...base, createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$grandTotal" }, count: { $count: {} } } },
        { $sort: { "_id": 1 } },
      ]),
      // By order type
      PosSale.aggregate([
        { $match: { ...base, createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: "$orderType", total: { $sum: "$grandTotal" }, count: { $count: {} } } },
      ]),
    ]);

    return {
      totalSales: counts,
      todaySales: todayCounts,
      totalRevenue: revenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      hourlyChart: hourly,
      dailyChart: daily,
      byOrderType,
    };
  },
};
