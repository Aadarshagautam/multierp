import StockMovementModel from "./model.js";

export const createStockMovement = (payload, options = {}) =>
  StockMovementModel.create([payload], options).then(([movement]) => movement);

export const createSaleStockMovement = ({
  productId,
  qty,
  saleId,
  invoiceNo = "",
  req,
  session = null,
  reason = "Sale",
}) =>
  createStockMovement(
    {
      orgId: req.orgId || null,
      branchId: req.membership?.branchId || null,
      productId,
      type: "OUT",
      qty,
      reason,
      refSaleId: saleId || null,
      referenceNo: invoiceNo,
      createdBy: req.userId,
    },
    session ? { session } : undefined
  );

export const createRefundStockMovement = ({
  productId,
  qty,
  saleId,
  invoiceNo = "",
  req,
  session = null,
}) =>
  createStockMovement(
    {
      orgId: req.orgId || null,
      branchId: req.membership?.branchId || null,
      productId,
      type: "IN",
      qty,
      reason: `Refund - ${invoiceNo}`.trim(),
      refSaleId: saleId || null,
      referenceNo: invoiceNo,
      createdBy: req.userId,
    },
    session ? { session } : undefined
  );
