import {
  buildPosInvoiceNumber,
  buildPosInvoiceSequenceKey,
  getNextSequence,
} from "../../core/utils/sequence.js";

export const getNextPosSaleNumber = async (context = {}, options = {}) => {
  const seq = await getNextSequence(
    buildPosInvoiceSequenceKey({
      orgId: context.orgId,
      userId: context.userId,
      branchId: context.branchId,
      date: context.date,
    }),
    { session: options.session }
  );

  return {
    seq,
    invoiceNo: buildPosInvoiceNumber({
      orgId: context.orgId,
      userId: context.userId,
      branchId: context.branchId,
      date: context.date,
      seq,
    }),
  };
};
