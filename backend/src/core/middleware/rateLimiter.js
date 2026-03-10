import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { normalizeEmail } from "../utils/auth.js";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "127.0.0.1";
};

const getEmailKey = (req) => normalizeEmail(req.body?.email) || "unknown";

export const createRateLimiter = ({
  prefix = "global",
  limit = 20,
  window = "60 s",
  message = "Too many requests, please try again later.",
  keyBuilder,
} = {}) => {
  const ratelimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, window),
      })
    : null;

  return async (req, res, next) => {
    if (!ratelimit) {
      return next();
    }

    try {
      const baseKey = keyBuilder?.(req) || getClientIp(req);
      const key = `${prefix}:${baseKey}`;
      const { success } = await ratelimit.limit(key);

      if (!success) {
        return res.status(429).json({ success: false, message });
      }

      next();
    } catch (error) {
      console.error("Rate limiter error:", error);
      next();
    }
  };
};

export const registerRateLimiter = createRateLimiter({
  prefix: "auth:register",
  limit: 8,
  window: "10 m",
  message: "Too many signup attempts. Please wait before trying again.",
  keyBuilder: (req) => `${getClientIp(req)}:${getEmailKey(req)}`,
});

export const loginRateLimiter = createRateLimiter({
  prefix: "auth:login",
  limit: 10,
  window: "10 m",
  message: "Too many login attempts. Please wait a minute and try again.",
  keyBuilder: (req) => `${getClientIp(req)}:${getEmailKey(req)}`,
});

export const verifyOtpSendRateLimiter = createRateLimiter({
  prefix: "auth:verify-send",
  limit: 5,
  window: "1 h",
  message: "Too many verification requests. Please try again later.",
  keyBuilder: (req) => req.userId || getClientIp(req),
});

export const verifyOtpCheckRateLimiter = createRateLimiter({
  prefix: "auth:verify-check",
  limit: 20,
  window: "15 m",
  message: "Too many verification attempts. Please request a new code.",
  keyBuilder: (req) => req.userId || getClientIp(req),
});

export const passwordResetRequestRateLimiter = createRateLimiter({
  prefix: "auth:password-reset-request",
  limit: 5,
  window: "15 m",
  message: "Too many password reset requests. Please try again later.",
  keyBuilder: (req) => `${getClientIp(req)}:${getEmailKey(req)}`,
});

export const passwordResetConfirmRateLimiter = createRateLimiter({
  prefix: "auth:password-reset-confirm",
  limit: 10,
  window: "15 m",
  message: "Too many password reset attempts. Please request a new code.",
  keyBuilder: (req) => `${getClientIp(req)}:${getEmailKey(req)}`,
});

const rateLimiter = createRateLimiter();

export default rateLimiter;
