import mongoose from "mongoose";
import { buildTenantFilter } from "../../core/utils/tenant.js";
import { pick } from "../../core/utils/pick.js";
import { sendCreated, sendError, sendSuccess } from "../../core/utils/response.js";
import { syncPurchaseInventory } from "../inventory/stockService.js";
import { Purchase, PurchaseSupplier, purchasePaymentMethods } from "./model.js";
import {
  appendReturnNotes,
  buildPurchaseFinancials,
} from "./utils.js";

const buildScopeFilter = (req) => {
  const filter = buildTenantFilter(req);

  if (req.orgId && req.membership?.branchId) {
    filter.branchId = req.membership.branchId;
  }

  return filter;
};

const normalizeName = (value = "") => value.trim().toLowerCase();

const upsertSupplier = async ({ supplierName, supplierContact = "", notes = "" }, req, session = null) => {
  const scope = buildScopeFilter(req);
  const normalizedName = normalizeName(supplierName);
  if (!normalizedName) return null;

  return PurchaseSupplier.findOneAndUpdate(
    { ...scope, normalizedName },
    {
      $set: {
        name: supplierName.trim(),
        normalizedName,
        contact: supplierContact.trim(),
        notes: notes.trim(),
        isActive: true,
      },
      $setOnInsert: {
        userId: req.userId,
        orgId: req.orgId || null,
        branchId: req.membership?.branchId || null,
      },
    },
    { new: true, upsert: true, runValidators: true, session }
  );
};

export const getSuppliers = async (req, res) => {
  try {
    const scopeFilter = buildScopeFilter(req);
    const suppliers = await PurchaseSupplier.find({
      ...scopeFilter,
      isActive: true,
    }).sort({ name: 1 });
    const summaries = await Purchase.aggregate([
      { $match: scopeFilter },
      {
        $group: {
          _id: "$supplierId",
          purchaseCount: { $sum: 1 },
          totalSpend: {
            $sum: {
              $subtract: ["$totalAmount", { $ifNull: ["$returnedAmount", 0] }],
            },
          },
          totalPaid: { $sum: { $ifNull: ["$paidAmount", 0] } },
          totalOutstanding: { $sum: { $ifNull: ["$outstandingAmount", 0] } },
          totalCredit: { $sum: { $ifNull: ["$creditAmount", 0] } },
          totalReturned: { $sum: { $ifNull: ["$returnedAmount", 0] } },
        },
      },
    ]);
    const summaryBySupplierId = new Map(
      summaries
        .filter((item) => item._id)
        .map((item) => [String(item._id), item])
    );

    const suppliersWithLedger = suppliers.map((supplier) => {
      const summary = summaryBySupplierId.get(String(supplier._id));
      return {
        ...supplier.toObject(),
        ledger: {
          purchaseCount: summary?.purchaseCount || 0,
          totalSpend: summary?.totalSpend || 0,
          totalPaid: summary?.totalPaid || 0,
          totalOutstanding: summary?.totalOutstanding || 0,
          totalCredit: summary?.totalCredit || 0,
          totalReturned: summary?.totalReturned || 0,
        },
      };
    });

    return sendSuccess(res, { data: suppliersWithLedger });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const { name, contact = "", notes = "" } = req.body;
    if (!name?.trim()) {
      return sendError(res, { status: 400, message: "Supplier name is required" });
    }

    const supplier = await upsertSupplier(
      { supplierName: name, supplierContact: contact, notes },
      req
    );

    return sendCreated(res, supplier, "Supplier saved");
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find(buildScopeFilter(req)).sort({ createdAt: -1 });
    return sendSuccess(res, { data: purchases });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const createPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      supplierName,
      supplierContact = "",
      productName,
      quantity,
      unitPrice,
      purchaseDate,
      paymentStatus = "pending",
      paidAmount,
      paymentMethod = "cash",
      deliveryStatus = "pending",
      notes = "",
    } = req.body;

    if (!supplierName?.trim() || !productName?.trim() || quantity === undefined || unitPrice === undefined || !purchaseDate) {
      await session.abortTransaction();
      return sendError(res, { status: 400, message: "Supplier, product, quantity, unit price, and purchase date are required" });
    }

    if (!purchasePaymentMethods.includes(paymentMethod)) {
      await session.abortTransaction();
      return sendError(res, { status: 400, message: "Invalid payment method" });
    }

    const supplier = await upsertSupplier({ supplierName, supplierContact }, req, session);
    const financials = buildPurchaseFinancials({
      quantity,
      unitPrice,
      paymentStatus,
      paidAmount,
    });

    const [purchase] = await Purchase.create(
      [{
        userId: req.userId,
        orgId: req.orgId || null,
        branchId: req.membership?.branchId || null,
        supplierId: supplier?._id || null,
        supplierName: supplierName.trim(),
        supplierContact: supplierContact.trim(),
        productName: productName.trim(),
        quantity: financials.quantity,
        unitPrice: financials.unitPrice,
        totalAmount: financials.totalAmount,
        paidAmount: financials.paidAmount,
        outstandingAmount: financials.outstandingAmount,
        creditAmount: financials.creditAmount,
        returnedQty: financials.returnedQty,
        returnedAmount: financials.returnedAmount,
        purchaseDate,
        paymentStatus: financials.paymentStatus,
        paymentMethod,
        deliveryStatus,
        notes,
      }],
      { session }
    );

    await syncPurchaseInventory({
      nextPurchase: purchase,
      req,
      session,
    });

    await session.commitTransaction();

    return sendCreated(res, purchase, "Purchase saved");
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    return sendError(res, { status: 400, message: error.message || "Unable to save purchase" });
  } finally {
    session.endSession();
  }
};

export const updatePurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const allowed = pick(req.body, [
      "supplierName",
      "supplierContact",
      "productName",
      "quantity",
      "unitPrice",
      "purchaseDate",
      "paymentStatus",
      "paidAmount",
      "paymentMethod",
      "deliveryStatus",
      "notes",
    ]);

    if (Object.keys(allowed).length === 0) {
      await session.abortTransaction();
      return sendError(res, { status: 400, message: "No valid fields to update" });
    }

    if (allowed.paymentMethod && !purchasePaymentMethods.includes(allowed.paymentMethod)) {
      await session.abortTransaction();
      return sendError(res, { status: 400, message: "Invalid payment method" });
    }

    const existing = await Purchase.findOne({ _id: req.params.id, ...buildScopeFilter(req) }).session(session);
    if (!existing) {
      await session.abortTransaction();
      return sendError(res, { status: 404, message: "Purchase not found" });
    }

    const nextSupplierName = (allowed.supplierName ?? existing.supplierName).trim();
    const nextSupplierContact = (allowed.supplierContact ?? existing.supplierContact).trim();
    const financials = buildPurchaseFinancials({
      quantity: allowed.quantity ?? existing.quantity,
      unitPrice: allowed.unitPrice ?? existing.unitPrice,
      paymentStatus: allowed.paymentStatus ?? existing.paymentStatus,
      paidAmount: allowed.paidAmount ?? existing.paidAmount,
      returnedQty: existing.returnedQty || 0,
    });

    const supplier = nextSupplierName
      ? await upsertSupplier({ supplierName: nextSupplierName, supplierContact: nextSupplierContact }, req, session)
      : null;

    const purchase = await Purchase.findOneAndUpdate(
      { _id: req.params.id, ...buildScopeFilter(req) },
      {
        $set: {
          ...allowed,
          supplierId: supplier?._id || null,
          supplierName: nextSupplierName,
          supplierContact: nextSupplierContact,
          quantity: financials.quantity,
          unitPrice: financials.unitPrice,
          totalAmount: financials.totalAmount,
          paidAmount: financials.paidAmount,
          outstandingAmount: financials.outstandingAmount,
          creditAmount: financials.creditAmount,
          paymentStatus: financials.paymentStatus,
          returnedQty: financials.returnedQty,
          returnedAmount: financials.returnedAmount,
        },
      },
      { new: true, runValidators: true, session }
    );

    await syncPurchaseInventory({
      previousPurchase: existing,
      nextPurchase: purchase,
      req,
      session,
    });

    await session.commitTransaction();

    return sendSuccess(res, { data: purchase, message: "Purchase updated" });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    return sendError(res, { status: 400, message: error.message || "Unable to update purchase" });
  } finally {
    session.endSession();
  }
};

export const returnPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const purchase = await Purchase.findOne({
      _id: req.params.id,
      ...buildScopeFilter(req),
    }).session(session);

    if (!purchase) {
      await session.abortTransaction();
      return sendError(res, { status: 404, message: "Purchase not found" });
    }

    if (!["delivered", "returned"].includes(purchase.deliveryStatus)) {
      await session.abortTransaction();
      return sendError(res, { status: 400, message: "Only delivered purchases can be returned" });
    }

    const returnQty = Number(req.body.quantity);
    if (!Number.isFinite(returnQty) || returnQty <= 0) {
      await session.abortTransaction();
      return sendError(res, { status: 400, message: "Return quantity must be greater than 0" });
    }

    const financials = buildPurchaseFinancials({
      quantity: purchase.quantity,
      unitPrice: purchase.unitPrice,
      paymentStatus: purchase.paymentStatus,
      paidAmount: purchase.paidAmount,
      returnedQty: Number(purchase.returnedQty || 0) + returnQty,
    });

    const updatedPurchase = await Purchase.findOneAndUpdate(
      { _id: req.params.id, ...buildScopeFilter(req) },
      {
        $set: {
          returnedQty: financials.returnedQty,
          returnedAmount: financials.returnedAmount,
          outstandingAmount: financials.outstandingAmount,
          creditAmount: financials.creditAmount,
          paymentStatus: financials.paymentStatus,
          deliveryStatus:
            financials.returnedQty >= financials.quantity ? "returned" : "delivered",
          returnNotes: appendReturnNotes(purchase.returnNotes, req.body.notes || ""),
        },
      },
      { new: true, runValidators: true, session }
    );

    await syncPurchaseInventory({
      previousPurchase: purchase,
      nextPurchase: updatedPurchase,
      req,
      session,
    });

    await session.commitTransaction();
    return sendSuccess(res, { data: updatedPurchase, message: "Purchase return saved" });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    return sendError(res, { status: 400, message: error.message || "Unable to return purchase" });
  } finally {
    session.endSession();
  }
};

export const deletePurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const purchase = await Purchase.findOneAndDelete(
      { _id: req.params.id, ...buildScopeFilter(req) },
      { session }
    );
    if (!purchase) {
      await session.abortTransaction();
      return sendError(res, { status: 404, message: "Purchase not found" });
    }

    await syncPurchaseInventory({
      previousPurchase: purchase,
      req,
      session,
    });

    await session.commitTransaction();

    return sendSuccess(res, { message: "Purchase deleted" });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    return sendError(res, { status: 400, message: error.message || "Unable to delete purchase" });
  } finally {
    session.endSession();
  }
};
