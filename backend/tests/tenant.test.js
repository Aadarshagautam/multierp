import test from "node:test";
import assert from "node:assert/strict";
import Customer from "../src/modules/customers/model.js";
import Invoice from "../src/modules/invoices/model.js";
import { getCustomer } from "../src/modules/customers/controller.js";
import { getInvoice } from "../src/modules/invoices/controller.js";
import { buildPosScopeFilter } from "../src/modules/pos/utils/scope.js";
import { buildTenantFilter, mergeTenantFilter } from "../src/core/utils/tenant.js";

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

test("buildTenantFilter prefers org scope over user scope", () => {
  assert.deepEqual(buildTenantFilter({ orgId: "org-1", userId: "user-1" }), { orgId: "org-1" });
  assert.deepEqual(buildTenantFilter({ userId: "user-1" }), { userId: "user-1" });
});

test("mergeTenantFilter keeps entity lookup within the current tenant", () => {
  assert.deepEqual(mergeTenantFilter({ orgId: "org-1", userId: "user-1" }, { _id: "doc-1" }), {
    _id: "doc-1",
    orgId: "org-1",
  });
});

test("getCustomer queries within the active organization", async (t) => {
  const originalFindOne = Customer.findOne;
  let capturedFilter = null;

  Customer.findOne = async (filter) => {
    capturedFilter = filter;
    return { _id: "cust-1", name: "Tenant Customer" };
  };

  t.after(() => {
    Customer.findOne = originalFindOne;
  });

  const res = createResponse();
  await getCustomer(
    {
      userId: "user-1",
      orgId: "org-1",
      params: { id: "cust-1" },
    },
    res
  );

  assert.deepEqual(capturedFilter, { _id: "cust-1", orgId: "org-1" });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
});

test("getInvoice queries within the active organization", async (t) => {
  const originalFindOne = Invoice.findOne;
  let capturedFilter = null;

  Invoice.findOne = async (filter) => {
    capturedFilter = filter;
    return { _id: "inv-1", invoiceNumber: "INV-1" };
  };

  t.after(() => {
    Invoice.findOne = originalFindOne;
  });

  const res = createResponse();
  await getInvoice(
    {
      userId: "user-9",
      orgId: "org-9",
      params: { id: "inv-1" },
    },
    res
  );

  assert.deepEqual(capturedFilter, { _id: "inv-1", orgId: "org-9" });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
});

test("buildPosScopeFilter keeps POS requests inside tenant and branch", () => {
  assert.deepEqual(
    buildPosScopeFilter({
      userId: "user-1",
      orgId: "org-1",
      membership: { branchId: "branch-1" },
    }),
    {
      orgId: "org-1",
      branchId: "branch-1",
    }
  );
});
