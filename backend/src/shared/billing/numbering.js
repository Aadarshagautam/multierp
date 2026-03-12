import {
  buildInvoiceNumber,
  buildInvoiceSequenceKey,
  buildPosInvoiceNumber,
  buildPosInvoiceSequenceKey,
  getNextSequence,
  peekNextSequence,
} from "../../core/utils/sequence.js";

const documentBuilders = {
  invoice: {
    buildKey: buildInvoiceSequenceKey,
    buildNumber: buildInvoiceNumber,
  },
  pos_sale: {
    buildKey: buildPosInvoiceSequenceKey,
    buildNumber: buildPosInvoiceNumber,
  },
};

const resolveBuilders = (documentType) => {
  const builders = documentBuilders[documentType];
  if (!builders) {
    throw new Error(`Unsupported billing document type: ${documentType}`);
  }

  return builders;
};

export const getNextDocumentNumber = async (
  documentType,
  context = {},
  options = {}
) => {
  const builders = resolveBuilders(documentType);
  const seq = await getNextSequence(builders.buildKey(context), {
    session: options.session,
  });

  return {
    seq,
    number: builders.buildNumber({ ...context, seq }),
  };
};

export const peekNextDocumentNumber = async (
  documentType,
  context = {},
  options = {}
) => {
  const builders = resolveBuilders(documentType);
  const seq = await peekNextSequence(builders.buildKey(context), {
    session: options.session,
  });

  return {
    seq,
    number: builders.buildNumber({ ...context, seq }),
  };
};

export const getNextInvoiceNumber = async (context = {}, options = {}) => {
  const result = await getNextDocumentNumber("invoice", context, options);
  return {
    seq: result.seq,
    invoiceNumber: result.number,
  };
};

export const peekNextInvoiceNumber = async (context = {}, options = {}) => {
  const result = await peekNextDocumentNumber("invoice", context, options);
  return {
    seq: result.seq,
    invoiceNumber: result.number,
  };
};

export const getNextPosSaleNumber = async (context = {}, options = {}) => {
  const result = await getNextDocumentNumber("pos_sale", context, options);
  return {
    seq: result.seq,
    invoiceNo: result.number,
  };
};
