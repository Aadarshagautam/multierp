import { sendCreated, sendError, sendSuccess } from "../../core/utils/response.js";
import { sharedAccountingService } from "../../shared/accounting/index.js";
import { buildAccountingScopeFilter } from "../../shared/accounting/service.js";
import TransactionModel from "../../shared/accounting/model.js";
import { buildAuditChanges, logAudit } from "../../core/utils/auditLogger.js";

// Get all transactions
export const getTransactions = async (req, res) => {
    try {
        const transactions = await sharedAccountingService.list(req);
        return sendSuccess(res, { data: transactions });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};

// Create transaction
export const createTransaction = async (req, res) => {
    try {
        const { type, category, amount, description } = req.validated?.body ?? req.body;

        if (!type || !category || !amount || !description) {
            return sendError(res, { status: 400, message: "All fields are required" });
        }

        const transaction = await sharedAccountingService.createManual(
            req.validated?.body ?? req.body,
            req
        );
        await logAudit(
            {
                action: "create",
                module: "accounting",
                targetId: transaction._id,
                targetName: transaction.category,
                description: `Created ${transaction.type} entry for ${transaction.category}`,
                metadata: {
                    amount: transaction.amount,
                    paymentMethod: transaction.paymentMethod,
                },
            },
            req
        );
        return sendCreated(res, transaction, "Transaction created");
    } catch (error) {
        console.error(error);
        return sendError(res, {
            status: error.status || 500,
            message: error.message || "Server error",
        });
    }
};

// Update transaction
export const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.validated?.body ?? req.body;

        if (Object.keys(updates || {}).length === 0) {
            return sendError(res, { status: 400, message: "No valid fields to update" });
        }

        const existing = await TransactionModel.findOne({
            _id: id,
            ...buildAccountingScopeFilter(req),
        });
        const transaction = await sharedAccountingService.updateManual(id, updates, req);
        if (!transaction) {
            return sendError(res, { status: 404, message: "Transaction not found" });
        }

        await logAudit(
            {
                action: "update",
                module: "accounting",
                targetId: transaction._id,
                targetName: transaction.category,
                description: `Updated ${transaction.type} entry for ${transaction.category}`,
                changes: buildAuditChanges(existing?.toObject?.() || existing, transaction.toObject(), [
                    "type",
                    "category",
                    "amount",
                    "description",
                    "date",
                    "paymentMethod",
                ]),
            },
            req
        );

        return sendSuccess(res, { data: transaction, message: "Transaction updated" });
    } catch (error) {
        console.error(error);
        return sendError(res, {
            status: error.status || 500,
            message: error.message || "Server error",
        });
    }
};

// Delete transaction
export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await TransactionModel.findOne({
            _id: id,
            ...buildAccountingScopeFilter(req),
        });

        const transaction = await sharedAccountingService.deleteManual(id, req);
        if (!transaction) {
            return sendError(res, { status: 404, message: "Transaction not found" });
        }

        await logAudit(
            {
                action: "delete",
                module: "accounting",
                targetId: existing?._id || transaction._id,
                targetName: existing?.category || transaction.category,
                description: `Deleted ${existing?.type || transaction.type} entry for ${existing?.category || transaction.category}`,
                metadata: {
                    amount: existing?.amount || transaction.amount,
                    paymentMethod: existing?.paymentMethod || transaction.paymentMethod,
                },
            },
            req
        );

        return sendSuccess(res, { message: "Transaction deleted" });
    } catch (error) {
        console.error(error);
        return sendError(res, {
            status: error.status || 500,
            message: error.message || "Server error",
        });
    }
};

// Get summary
export const getSummary = async (req, res) => {
    try {
        const summary = await sharedAccountingService.getSummary(req);
        return sendSuccess(res, { data: summary });
    } catch (error) {
        console.error(error);
        return sendError(res, { status: 500, message: "Server error" });
    }
};
