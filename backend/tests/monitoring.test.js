import test from "node:test";
import assert from "node:assert/strict";
import {
  CLIENT_SESSION_HEADER,
  buildMonitoringMeta,
  createRequestId,
  getDatabaseStatusLabel,
} from "../src/core/utils/monitoring.js";

test("createRequestId preserves incoming request ids", () => {
  assert.equal(createRequestId("req-123"), "req-123");
  assert.match(createRequestId(), /^[0-9a-f-]{36}$/i);
});

test("buildMonitoringMeta includes request tracing fields", () => {
  const meta = buildMonitoringMeta(
    {
      requestId: "req-1",
      method: "GET",
      originalUrl: "/api/customers",
      userId: "user-1",
      orgId: "org-1",
      ip: "127.0.0.1",
      headers: {
        [CLIENT_SESSION_HEADER]: "session-1",
        "user-agent": "node-test",
      },
      get(header) {
        return this.headers[header];
      },
    },
    { statusCode: 200 },
    { durationMs: 18 }
  );

  assert.equal(meta.requestId, "req-1");
  assert.equal(meta.clientSessionId, "session-1");
  assert.equal(meta.orgId, "org-1");
  assert.equal(meta.durationMs, 18);
});

test("getDatabaseStatusLabel maps mongoose ready states", () => {
  assert.equal(getDatabaseStatusLabel(1), "connected");
  assert.equal(getDatabaseStatusLabel(2), "connecting");
  assert.equal(getDatabaseStatusLabel(0), "disconnected");
});
