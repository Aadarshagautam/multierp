import test from "node:test";
import assert from "node:assert/strict";
import { buildAuditChanges } from "../src/core/utils/auditLogger.js";

test("buildAuditChanges keeps only the fields that actually changed", () => {
  const before = {
    status: "draft",
    amount: 1200,
    notes: "",
    customer: { name: "Aarav" },
    dueDate: new Date("2026-03-01T00:00:00.000Z"),
  };
  const after = {
    status: "paid",
    amount: 1200,
    notes: "Paid in cash",
    customer: { name: "Aarav" },
    dueDate: new Date("2026-03-01T00:00:00.000Z"),
  };

  assert.deepEqual(buildAuditChanges(before, after, [
    "status",
    "amount",
    "notes",
    "customer.name",
    "dueDate",
  ]), {
    status: { old: "draft", new: "paid" },
    notes: { old: "", new: "Paid in cash" },
  });
});
