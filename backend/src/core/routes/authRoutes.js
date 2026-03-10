import express from "express";
import { 
     register,
    login,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
    sendVerificationOTP,
    isAuthenticated,
    sendRestopt, } from "../controllers/authController.js";
import userAuth from "../middleware/userAuth.js";
import {
  loginRateLimiter,
  passwordResetConfirmRateLimiter,
  passwordResetRequestRateLimiter,
  registerRateLimiter,
  verifyOtpCheckRateLimiter,
  verifyOtpSendRateLimiter,
} from "../middleware/rateLimiter.js";


const authRouter = express.Router();

authRouter.post("/register", registerRateLimiter, register);
authRouter.post("/login", loginRateLimiter, login);
authRouter.post("/logout", logout);
authRouter.post("/send-verify-opt", userAuth, verifyOtpSendRateLimiter, sendVerificationOTP);
authRouter.post("/send-verify-otp", userAuth, verifyOtpSendRateLimiter, sendVerificationOTP);
authRouter.post("/verify-account", userAuth, verifyOtpCheckRateLimiter, verifyEmail);
authRouter.get("/is-auth", userAuth, isAuthenticated);
authRouter.post("/send-reset-Otp", passwordResetRequestRateLimiter, sendRestopt);
authRouter.post("/send-reset-otp", passwordResetRequestRateLimiter, sendRestopt);
authRouter.post("/forgot-password", passwordResetRequestRateLimiter, forgotPassword);
authRouter.post("/reset-password", passwordResetConfirmRateLimiter, resetPassword);


export default authRouter;
