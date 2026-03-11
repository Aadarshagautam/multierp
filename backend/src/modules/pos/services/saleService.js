import mongoose from "mongoose";
import PosSale from "../models/Sale.js";
import PosProduct from "../../../shared/products/model.js";
import PosTable from "../models/Table.js";
import Shift from "../models/Shift.js";
import { sharedCustomerService } from "../../../shared/customers/service.js";
import { DEFAULT_WALK_IN_NAME } from "../../../shared/customers/constants.js";
import { buildAddressText } from "../../../shared/customers/utils.js";
import {
  calculateSaleLineItem,
  calculateSaleTotals,
  getNextPosSaleNumber,
} from "../../../shared/sales/index.js";
import {
  calculatePaymentSummary,
  createDomainError,
} from "../../../shared/payments/index.js";
import {
  createRefundStockMovement,
  createSaleStockMovement,
} from "../../../shared/stock-movements/index.js";
import { buildPosScopeFilter, getPosBranchId } from "../utils/scope.js";
import {
  consumeRecipeStock,
  restoreRecipeStock,
} from "../../inventory/stockService.js";

const usesRecipeStock = (product) =>
  Array.isArray(product?.recipe) && product.recipe.length > 0;

const getWalkInSnapshot = () => ({
  customerId: null,
  customerName: DEFAULT_WALK_IN_NAME,
  customerPhone: "",
  customerEmail: "",
  customerAddress: {},
  customerGstin: "",
  customerType: "walk_in",
  customerBranchId: null,
});

const ensureProductCanBeSold = ({
  product,
  item,
  allowNegative,
}) => {
  if (!product) {
    throw createDomainError(`Product not found: ${item.productId}`, 404);
  }
  if (!product.isActive) {
    throw createDomainError(`Product is inactive: ${product.name}`);
  }
  if (!product.isAvailable) {
    throw createDomainError(`"${product.name}" is currently not available`);
  }

  if (
    product.trackStock !== false &&
    !usesRecipeStock(product) &&
    !allowNegative &&
    (product.stockQty || 0) < item.qty
  ) {
    throw createDomainError(
      `Insufficient stock for "${product.name}". Available: ${product.stockQty}, Requested: ${item.qty}`
    );
  }
};

const buildSaleCustomerSnapshot = (customer) => {
  const snapshot = customer
    ? sharedCustomerService.buildSnapshot(customer)
    : getWalkInSnapshot();

  return {
    customerId: snapshot.customerId || null,
    customerName: snapshot.customerName || DEFAULT_WALK_IN_NAME,
    customerPhone: snapshot.customerPhone || "",
    customerEmail: snapshot.customerEmail || "",
    customerAddressText: buildAddressText(snapshot.customerAddress || {}),
    customerType: snapshot.customerType || "walk_in",
  };
};

const validateSaleSettlement = ({
  customer,
  customerId,
  paymentSummary,
}) => {
  if (paymentSummary.dueAmount > 0 && !customer) {
    throw createDomainError(
      customerId
        ? "Selected customer was not found for this branch."
        : "A customer account is required to leave an unpaid balance."
    );
  }

  if (paymentSummary.dueAmount > 0 && !["credit", "mixed"].includes(paymentSummary.paymentMode)) {
    throw createDomainError("Use credit or mixed payment to keep an unpaid balance.");
  }
};

export const saleService = {
  async create(data, req) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const scopeFilter = buildPosScopeFilter(req);
      const branchId = getPosBranchId(req);
      const allowNegative = process.env.ALLOW_NEGATIVE_STOCK === "true";
      const currentShift = await Shift.findOne({ ...scopeFilter, status: "open" })
        .sort({ createdAt: -1 })
        .session(session);

      if (!currentShift) {
        throw createDomainError("Open a shift before billing a sale.");
      }

      if (data.paymentMethod === "credit" && !data.customerId) {
        throw createDomainError("Credit billing requires a selected customer account.");
      }

      const customer = data.customerId
        ? await sharedCustomerService.getById(data.customerId, req, {
            branchMode: "current_or_global",
            session,
          })
        : null;

      if (data.customerId && !customer) {
        throw createDomainError("Selected customer was not found for this branch.", 404);
      }

      const pointsRedeemed = data.loyaltyPointsRedeemed || 0;
      if (pointsRedeemed > 0 && !customer) {
        throw createDomainError("Select a customer before redeeming loyalty points.");
      }
      if (pointsRedeemed > (customer?.loyaltyPoints || 0)) {
        throw createDomainError("The selected customer does not have enough loyalty points.");
      }

      const preparedItems = [];
      const stockOperations = [];

      for (const item of data.items) {
        const product = await PosProduct.findOne({ _id: item.productId, ...scopeFilter }).session(
          session
        );
        ensureProductCanBeSold({ product, item, allowNegative });

        const lineItem = calculateSaleLineItem({
          item,
          product,
          orderType: data.orderType || "takeaway",
        });

        preparedItems.push(lineItem);
        stockOperations.push({
          product,
          lineItem,
          recipeDrivenStock: usesRecipeStock(product),
        });
      }

      const totals = calculateSaleTotals({
        items: preparedItems,
        overallDiscount: data.overallDiscount || 0,
        loyaltyPointsRedeemed: pointsRedeemed,
      });

      const paymentSummary = calculatePaymentSummary({
        paymentMethod: data.paymentMethod || "cash",
        paidAmount: data.paidAmount ?? totals.grandTotal,
        payments: data.payments || [],
        grandTotal: totals.grandTotal,
      });

      validateSaleSettlement({
        customer,
        customerId: data.customerId,
        paymentSummary,
      });

      const orderStatus =
        (data.orderType || "takeaway") === "dine-in" ? "pending" : "completed";
      const numbering = await getNextPosSaleNumber(
        {
          orgId: req.orgId,
          userId: req.userId,
          branchId,
        },
        { session }
      );
      const customerSnapshot = buildSaleCustomerSnapshot(customer);

      const [sale] = await PosSale.create(
        [
          {
            userId: req.userId,
            orgId: req.orgId || null,
            branchId,
            invoiceNo: numbering.invoiceNo,
            items: totals.items,
            customerId: customerSnapshot.customerId,
            customerName: customerSnapshot.customerName,
            customerPhone: customerSnapshot.customerPhone,
            customerEmail: customerSnapshot.customerEmail,
            customerAddressText: customerSnapshot.customerAddressText,
            customerType: customerSnapshot.customerType,
            subTotal: totals.subtotal,
            itemDiscountTotal: totals.itemDiscountTotal,
            overallDiscount: totals.overallDiscountAmount,
            loyaltyDiscount: totals.loyaltyDiscount,
            discountTotal: totals.discountTotal,
            taxTotal: totals.taxTotal,
            grandTotal: totals.grandTotal,
            payments: paymentSummary.payments,
            paymentMethod: paymentSummary.paymentMethod,
            paymentMode: paymentSummary.paymentMode,
            receivedAmount: paymentSummary.receivedAmount,
            paidAmount: paymentSummary.paidAmount,
            dueAmount: paymentSummary.dueAmount,
            changeAmount: paymentSummary.changeAmount,
            soldBy: req.userId,
            status: paymentSummary.status,
            notes: data.notes || "",
            orderType: data.orderType || "takeaway",
            tableId: data.tableId || null,
            tableNumber: null,
            deliveryAddress: data.deliveryAddress || "",
            orderStatus,
            shiftId: currentShift?._id || null,
            loyaltyPointsEarned: totals.pointsEarned,
            loyaltyPointsRedeemed: pointsRedeemed,
          },
        ],
        { session }
      );

      for (const stockOperation of stockOperations) {
        const { product, lineItem, recipeDrivenStock } = stockOperation;

        if (product.trackStock === false || lineItem.productTypeSnapshot === "service") {
          continue;
        }

        if (recipeDrivenStock) {
          await consumeRecipeStock({
            product,
            saleQty: lineItem.qty,
            req,
            session,
            allowNegative,
          });
          continue;
        }

        await PosProduct.findByIdAndUpdate(
          product._id,
          { $inc: { stockQty: -lineItem.qty } },
          { session }
        );
        await createSaleStockMovement({
          productId: product._id,
          qty: lineItem.qty,
          saleId: sale._id,
          invoiceNo: sale.invoiceNo,
          req,
          session,
        });
      }

      if (data.orderType === "dine-in" && data.tableId) {
        const table = await PosTable.findOne({ _id: data.tableId, ...scopeFilter }).session(
          session
        );
        if (!table) {
          throw createDomainError("Selected table was not found for this branch", 404);
        }

        sale.tableNumber = table.number;
        await sale.save({ session });
        await PosTable.findOneAndUpdate(
          { _id: data.tableId, ...scopeFilter },
          { $set: { status: "occupied", currentOrderId: sale._id } },
          { session }
        );
      }

      if (data.customerId) {
        const updatedCustomer = await sharedCustomerService.applySaleMetrics(
          data.customerId,
          {
            totalSpent: totals.grandTotal,
            visitCount: 1,
            loyaltyPoints: totals.pointsEarned - pointsRedeemed,
            creditBalance: paymentSummary.dueAmount,
            lastSaleAt: new Date(),
            session,
          },
          req,
          { branchMode: "current_or_global" }
        );

        if (!updatedCustomer) {
          throw createDomainError("Selected customer was not found for this branch", 404);
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
    const {
      status,
      customerId,
      orderType,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

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
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    };
  },

  async getById(id, req) {
    return PosSale.findOne({ _id: id, ...buildPosScopeFilter(req) })
      .populate("customerId", "name phone email address addressText loyaltyPoints tier")
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
    if (sale?.tableId && ["completed", "cancelled"].includes(orderStatus)) {
      await PosTable.findOneAndUpdate(
        { _id: sale.tableId, ...scopeFilter },
        { $set: { status: "available", currentOrderId: null } }
      );
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
      if (!sale) throw createDomainError("Sale not found", 404);
      if (sale.status === "refund") throw createDomainError("Sale already refunded");

      for (const item of sale.items) {
        if (item.productTypeSnapshot === "service") {
          continue;
        }

        const product = await PosProduct.findOne({ _id: item.productId, ...scopeFilter }).session(
          session
        );

        if (!product) {
          throw createDomainError(`Product not found for refund: ${item.nameSnapshot}`, 404);
        }

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
          await createRefundStockMovement({
            productId: item.productId,
            qty: item.qty,
            saleId: sale._id,
            invoiceNo: sale.invoiceNo,
            req,
            session,
          });
        }
      }

      sale.status = "refund";
      sale.orderStatus = "cancelled";
      sale.refundedAt = new Date();
      await sale.save({ session });

      if (sale.tableId) {
        await PosTable.findOneAndUpdate(
          { _id: sale.tableId, ...scopeFilter },
          { $set: { status: "available", currentOrderId: null } },
          { session }
        );
      }

      if (sale.customerId) {
        await sharedCustomerService.applySaleMetrics(
          sale.customerId,
          {
            totalSpent: -sale.grandTotal,
            visitCount: -1,
            loyaltyPoints: -(sale.loyaltyPointsEarned - sale.loyaltyPointsRedeemed),
            creditBalance: sale.dueAmount > 0 ? -sale.dueAmount : 0,
            session,
          },
          req,
          { branchMode: "current_or_global" }
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

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [
      counts,
      todayCounts,
      revenue,
      todayRevenue,
      hourly,
      daily,
      byOrderType,
      refundsToday,
    ] = await Promise.all([
      PosSale.countDocuments(base),
      PosSale.countDocuments({ ...base, createdAt: { $gte: today, $lt: tomorrow } }),
      PosSale.aggregate([{ $match: base }, { $group: { _id: null, total: { $sum: "$grandTotal" } } }]),
      PosSale.aggregate([
        { $match: { ...base, createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: "$grandTotal" } } },
      ]),
      PosSale.aggregate([
        { $match: { ...base, createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: { $hour: "$createdAt" }, revenue: { $sum: "$grandTotal" }, count: { $count: {} } } },
        { $sort: { _id: 1 } },
      ]),
      PosSale.aggregate([
        { $match: { ...base, createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$grandTotal" }, count: { $count: {} } } },
        { $sort: { _id: 1 } },
      ]),
      PosSale.aggregate([
        { $match: { ...base, createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: "$orderType", total: { $sum: "$grandTotal" }, count: { $count: {} } } },
      ]),
      PosSale.countDocuments({
        ...buildPosScopeFilter(req),
        status: "refund",
        createdAt: { $gte: today, $lt: tomorrow },
      }),
    ]);

    return {
      totalSales: counts,
      todaySales: todayCounts,
      totalRevenue: revenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      todayAverageSale: todayCounts > 0 ? (todayRevenue[0]?.total || 0) / todayCounts : 0,
      refundCountToday: refundsToday,
      hourlyChart: hourly,
      dailyChart: daily,
      byOrderType,
    };
  },
};
