import CounterModel from "../models/Counter.js";

const compactScopeId = (value) => {
  const compact = String(value || "LOCAL")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

  return compact.slice(-6) || "LOCAL";
};

const buildDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
};

const buildYearKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  return String(date.getFullYear());
};

export async function getNextSequence(key, options = {}) {
  const counter = await CounterModel.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      session: options.session,
    }
  );

  return counter.value;
}

export async function peekNextSequence(key, options = {}) {
  const counter = await CounterModel.findOne({ key }, null, {
    session: options.session,
  }).select("value");

  return (counter?.value || 0) + 1;
}

export function buildPosInvoiceSequenceKey({ orgId, userId, branchId, date = new Date() }) {
  return [
    "pos-sale",
    compactScopeId(orgId || userId),
    compactScopeId(branchId || "main"),
    buildDateKey(date),
  ].join(":");
}

export function buildPosInvoiceNumber({ orgId, userId, branchId, date = new Date(), seq }) {
  return [
    "POS",
    compactScopeId(orgId || userId),
    compactScopeId(branchId || "main"),
    buildDateKey(date),
    String(seq).padStart(4, "0"),
  ].join("-");
}

export function buildInvoiceSequenceKey({ orgId, userId, date = new Date() }) {
  return [
    "invoice",
    compactScopeId(orgId || userId),
    buildYearKey(date),
  ].join(":");
}

export function buildInvoiceNumber({ orgId, userId, date = new Date(), seq }) {
  return [
    "INV",
    compactScopeId(orgId || userId),
    buildYearKey(date),
    String(seq).padStart(4, "0"),
  ].join("-");
}
