import mongoose from "mongoose";
import Inventory from "./model.js";
import { pick } from "../../core/utils/pick.js";
import { sendCreated, sendError, sendSuccess } from "../../core/utils/response.js";
import {
    buildInventoryProductSnapshot,
    sharedProductService,
    syncProductFromInventoryItem,
} from "../../shared/products/index.js";
import {
    adjustInventoryQuantity,
    buildInventoryScopeFilter,
    getInventoryBranchId,
} from "./stockService.js";
import { listStockMovements } from "../../shared/stock-movements/index.js";
import { buildAuditChanges, logAudit } from "../../core/utils/auditLogger.js";

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
        const snapshot = buildInventoryProductSnapshot({ payload, product });

        const item = new Inventory({
            ...snapshot,
            userId,
            orgId: req.orgId,
            branchId: getInventoryBranchId(req),
        });

        await item.save({ session });
        await session.commitTransaction();
        await logAudit(
            {
                action: "create",
                module: "inventory",
                targetId: item._id,
                targetName: item.productName,
                description: `Created inventory item ${item.productName}`,
                metadata: {
                    quantity: item.quantity,
                    costPrice: item.costPrice,
                },
            },
            req
        );
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
        const snapshot = buildInventoryProductSnapshot({
            payload: mergedPayload,
            product,
        });
        const existingSnapshot = existing.toObject();

        Object.assign(existing, snapshot);
        await existing.save({ session });

        await session.commitTransaction();
        await logAudit(
            {
                action: "update",
                module: "inventory",
                targetId: existing._id,
                targetName: existing.productName,
                description: `Updated inventory item ${existing.productName}`,
                changes: buildAuditChanges(existingSnapshot, existing.toObject(), [
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
                ]),
            },
            req
        );
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

        await logAudit(
            {
                action: "delete",
                module: "inventory",
                targetId: item._id,
                targetName: item.productName,
                description: `Deleted inventory item ${item.productName}`,
                metadata: {
                    quantity: item.quantity,
                    costPrice: item.costPrice,
                },
            },
            req
        );

        return sendSuccess(res, { message: "Item deleted" });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

// Get low stock items
export const getLowStock = async (req, res) => {
    try {
        const [products, inventoryItems] = await Promise.all([
            sharedProductService.getLowStock(req),
            Inventory.find(buildInventoryScopeFilter(req)),
        ]);
        const inventoryByProductId = new Map(
            inventoryItems
                .filter((item) => item.productId)
                .map((item) => [String(item.productId), item])
        );

        const lowStock = products.map((product) => {
            const inventoryItem = inventoryByProductId.get(String(product._id));
            const snapshot = buildInventoryProductSnapshot({
                product,
                payload: {
                    supplier: inventoryItem?.supplier || "",
                    quantity: product.stockQty,
                },
            });

            return {
                _id: inventoryItem?._id || product._id,
                ...snapshot,
                productId: product._id,
            };
        });
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
                sourceType: "adjustment",
                sourceId: existing._id,
            },
        });

        await session.commitTransaction();
        await logAudit(
            {
                action: "adjust",
                module: "inventory",
                targetId: item._id,
                targetName: item.productName,
                description: `Adjusted stock for ${item.productName}`,
                changes: buildAuditChanges(existing.toObject(), item.toObject(), ["quantity"]),
                metadata: {
                    quantityDelta: numericDelta,
                    reason: reason.trim(),
                    note: note.trim(),
                },
            },
            req
        );
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
        const movements = await listStockMovements({
            context: req,
            inventoryItemId: req.query.inventoryItemId || null,
            productId: req.query.productId || null,
            limit: 50,
        });
        const mappedMovements = movements.map((movement) => {
            const movementData = movement.toObject();
            const inventoryItem = movementData.inventoryItemId
                ? {
                    _id: movementData.inventoryItemId._id,
                    productName: movementData.inventoryItemId.productName,
                }
                : movementData.productId
                    ? {
                        _id: movementData.productId._id,
                        productName: movementData.productId.name,
                    }
                    : null;

            return {
                ...movementData,
                inventoryItemId: inventoryItem,
            };
        });

        return sendSuccess(res, { data: mappedMovements });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};
