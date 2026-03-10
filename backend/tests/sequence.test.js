import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInvoiceNumber,
  buildInvoiceSequenceKey,
  buildPosInvoiceNumber,
  buildPosInvoiceSequenceKey,
} from "../src/core/utils/sequence.js";

test("builds scoped POS invoice numbers", () => {
  const date = new Date("2026-03-09T10:00:00.000Z");

  assert.equal(
    buildPosInvoiceNumber({
      orgId: "507f1f77bcf86cd799439011",
      branchId: "507f1f77bcf86cd799439099",
      date,
      seq: 12,
    }),
    "POS-439011-439099-20260309-0012"
  );
});

test("builds scoped accounting invoice numbers", () => {
  const date = new Date("2026-03-09T10:00:00.000Z");

  assert.equal(
    buildInvoiceNumber({
      orgId: "507f1f77bcf86cd799439011",
      userId: "507f1f77bcf86cd799439012",
      date,
      seq: 7,
    }),
    "INV-439011-2026-0007"
  );
});

test("uses stable sequence keys for counters", () => {
  const date = new Date("2026-03-09T10:00:00.000Z");

  assert.equal(
    buildPosInvoiceSequenceKey({
      orgId: "507f1f77bcf86cd799439011",
      branchId: "507f1f77bcf86cd799439099",
      date,
    }),
    "pos-sale:439011:439099:20260309"
  );

  assert.equal(
    buildInvoiceSequenceKey({
      orgId: "507f1f77bcf86cd799439011",
      date,
    }),
    "invoice:439011:2026"
  );
});
