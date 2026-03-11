import mongoose from "mongoose";
import Inventory from "./model.js";
import { InventoryMovement } from "./model.js";
import { pick } from "../../core/utils/pick.js";
import { sendCreated, sendError, sendSuccess } from "../../core/utils/response.js";
import { syncProductFromInventoryItem } from "../../shared/products/service.js";
import {
    adjustInventoryQuantity,
    buildInventoryScopeFilter,
    getInventoryBranchId,
    normalizeInventoryName,
} from "./stockService.js";

const buildInventorySnapshot = ({ payload, product }) => {
    const productName = product?.name || payload.productName?.trim() || "";
    const quantity = Number(payload.quantity) || 0;

    return {
        productId: product?._id || payload.productId || null,
        productName,
        normalizedName: normalizeInventoryName(productName),
        quantity,
        costPrice: product?.costPrice ?? Number(payload.costPrice) ?? 0,
        sellingPrice: product?.sellingPrice ?? Number(payload.sellingPrice) ?? 0,
        category: product?.category || payload.category || "",
        supplier: payload.supplier?.trim() || "",
        lowStockAlert: product?.lowStockAlert ?? Number(payload.lowStockAlert) ?? 10,
        vatRate: product?.taxRate ?? Number(payload.vatRate) ?? 0,
        sku: product?.sku || payload.sku || "",
        barcode: product?.barcode || payload.barcode || "",
    };
};

// Get all inventory items
export const getInventory = async (req, res) => {
    try {
        const ownerFilter = buildInventoryScopeFilter(req);
        const inventory = await Inventory.find(ownerFilter).sort({ createdAt: -1 });
        return sendSuccess(res, { data: inventory });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

// Create inventory item
export const createInventoryItem = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.userId;
        const payload = req.validated?.body ?? req.body;
        const product = await syncProductFromInventoryItem({
            inventoryItem: payload,
            context: req,
            productId: payload.productId,
            session,
        });
        const snapshot = buildInventorySnapshot({ payload, product });

        const item = new Inventory({
            ...snapshot,
            userId,
            orgId: req.orgId,
            branchId: getInventoryBranchId(req),
        });

        await item.save({ session });
        await session.commitTransaction();
        return sendCreated(res, item, "Inventory item created");
    } catch (error) {
        await session.abortTransaction();
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    } finally {
        session.endSession();
    }
};

// Update inventory item
export const updateInventoryItem = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const ownerFilter = buildInventoryScopeFilter(req);
        const { id } = req.params;
        const updates = req.validated?.body ?? req.body;
        const existing = await Inventory.findOne({ _id: id, ...ownerFilter }).session(session);
        if (!existing) {
            await session.abortTransaction();
            return sendError(res, { status: 404, message: "Item not found" });
        }

        const mergedPayload = pick(
            {
                productId: updates.productId ?? existing.productId?.toString() ?? null,
                productName: updates.productName ?? existing.productName,
                quantity: updates.quantity ?? existing.quantity,
                costPrice: updates.costPrice ?? existing.costPrice,
                sellingPrice: updates.sellingPrice ?? existing.sellingPrice,
                category: updates.category ?? existing.category,
                supplier: updates.supplier ?? existing.supplier,
                lowStockAlert: updates.lowStockAlert ?? existing.lowStockAlert,
                vatRate: updates.vatRate ?? existing.vatRate,
                sku: updates.sku ?? existing.sku,
                barcode: updates.barcode ?? existing.barcode,
            },
            [
                "productId",
                "productName",
                "quantity",
                "costPrice",
                "sellingPrice",
                "category",
                "supplier",
                "lowStockAlert",
                "vatRate",
                "sku",
                "barcode",
            ]
        );

        const product = await syncProductFromInventoryItem({
            inventoryItem: mergedPayload,
            context: req,
            productId: mergedPayload.productId || existing.productId,
            session,
        });
        const snapshot = buildInventorySnapshot({ payload: mergedPayload, product });

        Object.assign(existing, snapshot);
        await existing.save({ session });

        await session.commitTransaction();
        return sendSuccess(res, { data: existing, message: "Item updated" });
    } catch (error) {
        await session.abortTransaction();
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    } finally {
        session.endSession();
    }
};

// Delete inventory item
export const deleteInventoryItem = async (req, res) => {
    try {
        const ownerFilter = buildInventoryScopeFilter(req);
        const { id } = req.params;

        const item = await Inventory.findOneAndDelete({ _id: id, ...ownerFilter });
        if (!item) {
            return sendError(res, { status: 404, message: "Item not found" });
        }

        return sendSuccess(res, { message: "Item deleted" });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

// Get low stock items
export const getLowStock = async (req, res) => {
    try {
        const ownerFilter = buildInventoryScopeFilter(req);
        const items = await Inventory.find(ownerFilter);

        const lowStock = items.filter(item => item.quantity <= item.lowStockAlert);
        return sendSuccess(res, { data: lowStock });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

export const createInventoryAdjustment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { quantityDelta, reason = "", note = "" } = req.validated?.body ?? req.body;
        const numericDelta = Number(quantityDelta);

        if (!Number.isFinite(numericDelta) || numericDelta === 0) {
            await session.abortTransaction();
            return sendError(res, { status: 400, message: "Adjustment quantity must be non-zero" });
        }

        if (!reason.trim()) {
            await session.abortTransaction();
            return sendError(res, { status: 400, message: "Adjustment reason is required" });
        }

        const existing = await Inventory.findOne({
            _id: id,
            ...buildInventoryScopeFilter(req),
        }).session(session);

        if (!existing) {
            await session.abortTransaction();
            return sendError(res, { status: 404, message: "Item not found" });
        }

        const item = await adjustInventoryQuantity({
            inventoryItemId: id,
            productName: existing.productName,
            quantityDelta: numericDelta,
            unitCost: existing.costPrice,
            supplier: existing.supplier || "",
            req,
            session,
            allowNegative: false,
            movement: {
                type: numericDelta > 0 ? "ADJUST" : "OUT",
                reason: reason.trim(),
                note: note.trim(),
            },
        });

        await session.commitTransaction();
        return sendSuccess(res, { data: item, message: "Inventory adjusted" });
    } catch (error) {
        await session.abortTransaction();
        console.error(error);
        return sendError(res, { status: 400, message: error.message || "Unable to adjust inventory" });
    } finally {
        session.endSession();
    }
};

export const getInventoryMovements = async (req, res) => {
    try {
        const filter = buildInventoryScopeFilter(req);

        if (req.query.inventoryItemId) {
            filter.inventoryItemId = req.query.inventoryItemId;
        }

        const movements = await InventoryMovement.find(filter)
            .populate("inventoryItemId", "productName")
            .sort({ createdAt: -1 })
            .limit(50);

        return sendSuccess(res, { data: movements });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};
