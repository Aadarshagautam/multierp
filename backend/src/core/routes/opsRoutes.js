import express from "express";
import { captureFrontendEvent, getHealth, getReadiness } from "../controllers/opsController.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

const frontendEventRateLimiter = createRateLimiter({
  prefix: "ops:frontend-event",
  limit: 30,
  window: "5 m",
  message: "Too many frontend monitoring events. Please slow down.",
  keyBuilder: (req) => req.headers["x-client-session-id"] || req.ip || "unknown",
});

router.get("/health", getHealth);
router.get("/ready", getReadiness);
router.post("/frontend-events", frontendEventRateLimiter, captureFrontendEvent);

export default router;
