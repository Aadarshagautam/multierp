import test from "node:test";
import assert from "node:assert/strict";
import { createClientRequestId, getClientSessionId } from "../src/lib/monitoring.js";

test("client session id is stable for the loaded app session", () => {
  assert.equal(getClientSessionId(), getClientSessionId());
  assert.match(getClientSessionId(), /^web-/);
});

test("createClientRequestId returns unique request ids", () => {
  const first = createClientRequestId();
  const second = createClientRequestId();

  assert.match(first, /^req-/);
  assert.match(second, /^req-/);
  assert.notEqual(first, second);
});
