import mongoose from "mongoose";
import Inventory from "./model.js";
import { InventoryMovement } from "./model.js";
import { pick } from "../../core/utils/pick.js";
import { sendCreated, sendError, sendSuccess } from "../../core/utils/response.js";
import {
    adjustInventoryQuantity,
    buildInventoryScopeFilter,
    getInventoryBranchId,
    normalizeInventoryName,
} from "./stockService.js";

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
    try {
        const userId = req.userId;
        const { productName, quantity, costPrice, sellingPrice, category, supplier, lowStockAlert, vatRate, sku } = req.body;

        if (!productName || quantity === undefined || !costPrice || !sellingPrice) {
            return sendError(res, { status: 400, message: "Required fields missing" });
        }

        const item = new Inventory({
            productName,
            quantity,
            costPrice,
            sellingPrice,
            category,
            supplier,
            lowStockAlert,
            vatRate,
            sku,
            userId,
            orgId: req.orgId,
            branchId: getInventoryBranchId(req),
            normalizedName: normalizeInventoryName(productName),
        });

        await item.save();
        return sendCreated(res, item, "Inventory item created");
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

// Update inventory item
export const updateInventoryItem = async (req, res) => {
    try {
        const ownerFilter = buildInventoryScopeFilter(req);
        const { id } = req.params;
        const updates = pick(req.body, [
            "productName",
            "quantity",
            "costPrice",
            "sellingPrice",
            "category",
            "supplier",
            "lowStockAlert",
            "vatRate",
            "sku",
        ]);

        if (updates.productName) {
            updates.normalizedName = normalizeInventoryName(updates.productName);
        }

        if (Object.keys(updates).length === 0) {
            return sendError(res, { status: 400, message: "No valid fields to update" });
        }

        const item = await Inventory.findOneAndUpdate(
            { _id: id, ...ownerFilter },
            { $set: updates },
            { new: true, runValidators: true }
        );
        if (!item) {
            return sendError(res, { status: 404, message: "Item not found" });
        }

        return sendSuccess(res, { data: item, message: "Item updated" });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
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
        const { quantityDelta, reason = "", note = "" } = req.body;
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
