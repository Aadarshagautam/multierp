import crypto from "crypto";

export const REQUEST_ID_HEADER = "x-request-id";
export const CLIENT_SESSION_HEADER = "x-client-session-id";

const normalizeHeaderValue = (value) => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value) && value.length > 0) {
    return normalizeHeaderValue(value[0]);
  }

  return null;
};

export const createRequestId = (seed) => normalizeHeaderValue(seed) || crypto.randomUUID();

export const buildMonitoringMeta = (req, res, extra = {}) => ({
  timestamp: new Date().toISOString(),
  requestId: req?.requestId || createRequestId(req?.headers?.[REQUEST_ID_HEADER]),
  clientSessionId: normalizeHeaderValue(req?.headers?.[CLIENT_SESSION_HEADER]),
  method: req?.method || null,
  path: req?.originalUrl || req?.url || null,
  statusCode: res?.statusCode ?? null,
  userId: req?.userId || null,
  orgId: req?.orgId || null,
  ip: req?.ip || req?.socket?.remoteAddress || null,
  userAgent:
    (typeof req?.get === "function" ? req.get("user-agent") : null) ||
    normalizeHeaderValue(req?.headers?.["user-agent"]),
  ...extra,
});

export const writeMonitoringLog = (level, event, payload) => {
  const entry = JSON.stringify({ level, event, ...payload });

  if (level === "error") {
    console.error(entry);
    return;
  }

  if (level === "warn") {
    console.warn(entry);
    return;
  }

  console.log(entry);
};

export const getDatabaseStatusLabel = (readyState) => {
  switch (readyState) {
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "disconnected";
  }
};
