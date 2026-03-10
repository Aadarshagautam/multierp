import mongoose from "mongoose";
import { sendError, sendSuccess } from "../utils/response.js";
import {
  buildMonitoringMeta,
  getDatabaseStatusLabel,
  writeMonitoringLog,
} from "../utils/monitoring.js";

const getBaseHealthData = (req) => ({
  service: "commerceos-api",
  environment: process.env.NODE_ENV || "development",
  uptimeSeconds: Math.round(process.uptime()),
  timestamp: new Date().toISOString(),
  requestId: req.requestId || null,
});

export const getHealth = (req, res) => {
  return sendSuccess(res, {
    data: {
      status: "ok",
      ...getBaseHealthData(req),
    },
  });
};

export const getReadiness = (req, res) => {
  const dbReadyState = mongoose.connection.readyState;
  const isReady = dbReadyState === 1;

  return res.status(isReady ? 200 : 503).json({
    success: isReady,
    message: isReady ? "Ready" : "Database not ready",
    data: {
      status: isReady ? "ready" : "not_ready",
      database: getDatabaseStatusLabel(dbReadyState),
      ...getBaseHealthData(req),
    },
  });
};

export const captureFrontendEvent = (req, res) => {
  const { level = "error", message, stack, page, metadata, clientSessionId } = req.body || {};

  if (!message) {
    return sendError(res, { status: 400, message: "Event message is required" });
  }

  const normalizedLevel = level === "warn" ? "warn" : "error";
  writeMonitoringLog(
    normalizedLevel,
    "frontend.event",
    buildMonitoringMeta(req, res, {
      clientSessionId: clientSessionId || undefined,
      page: typeof page === "string" ? page : null,
      message,
      metadata: metadata && typeof metadata === "object" ? metadata : null,
      stack: process.env.NODE_ENV === "production" ? undefined : stack,
    })
  );

  return res.status(202).json({
    success: true,
    message: "Frontend event recorded",
  });
};
