import { buildMonitoringMeta, createRequestId, writeMonitoringLog } from "../utils/monitoring.js";

const getLogLevel = (statusCode) => {
  if (statusCode >= 500) {
    return "error";
  }

  if (statusCode >= 400) {
    return "warn";
  }

  return "info";
};

export const attachRequestContext = (req, res, next) => {
  req.requestId = createRequestId(req.headers["x-request-id"]);
  req.requestStartedAt = Date.now();
  res.setHeader("X-Request-Id", req.requestId);
  next();
};

export const logRequestLifecycle = (req, res, next) => {
  const startedAt = req.requestStartedAt || Date.now();

  res.on("finish", () => {
    if (req.path === "/health" || req.path === "/ready") {
      return;
    }

    writeMonitoringLog(
      getLogLevel(res.statusCode),
      "http.request",
      buildMonitoringMeta(req, res, {
        durationMs: Date.now() - startedAt,
      })
    );
  });

  next();
};

export const logUnhandledError = (error, req, res) => {
  writeMonitoringLog(
    "error",
    "http.error",
    buildMonitoringMeta(req, res, {
      errorName: error?.name || "Error",
      errorMessage: error?.message || "Unhandled error",
      stack: process.env.NODE_ENV === "production" ? undefined : error?.stack,
    })
  );
};
