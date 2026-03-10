import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import crypto from "crypto";
import UserModel from "../models/User.js";
import OrganizationModel from "../models/Organization.js";
import OrgMemberModel from "../models/OrgMember.js";
import BranchModel from "../models/Branch.js";
import transporter from "../config/nodemailer.js";
import {
  EMAIL_VERIFY_TEMPLATE,
  PASSWORD_RESET_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "../config/emailTemplate.js";
import { sendCreated, sendError, sendSuccess } from "../utils/response.js";
import {
  buildBranchCode,
  buildOrganizationSlug,
  getEnabledModulesForBusinessType,
  normalizeBusinessType,
  normalizeSoftwarePlan,
} from "../utils/onboarding.js";
import {
  GENERIC_PASSWORD_RESET_MESSAGE,
  PASSWORD_REQUIREMENTS_MESSAGE,
  isStrongPassword,
  isValidEmail,
  normalizeEmail,
} from "../utils/auth.js";

const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

const setAuthCookie = (res, userId, orgId) => {
  const token = jwt.sign({ id: userId, orgId: orgId || null }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

  res.cookie("token", token, getAuthCookieOptions());
};

const requestPasswordResetOtp = async (rawEmail) => {
  const email = normalizeEmail(rawEmail);

  if (!email) {
    return { status: 400, error: "Email is required" };
  }

  if (!isValidEmail(email)) {
    return { status: 400, error: "Invalid email format" };
  }

  const user = await UserModel.findOne({ email });
  if (!user) {
    return { message: GENERIC_PASSWORD_RESET_MESSAGE };
  }

  const otp = String(crypto.randomInt(100000, 999999));
  user.resetOtp = otp;
  user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;
  await user.save();

  await transporter.sendMail({
    from: process.env.SENDER_EMAIL,
    to: user.email,
    subject: "Reset your password",
    html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email),
  });

  return { message: GENERIC_PASSWORD_RESET_MESSAGE };
};

export const register = async (req, res) => {
  const {
    username,
    email,
    password,
    orgName,
    branchName,
    businessType,
    softwarePlan,
  } = req.body;

  const normalizedUsername = String(username || "").trim();
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedUsername || !normalizedEmail || !password) {
    return sendError(res, { status: 400, message: "Missing details" });
  }

  if (!isValidEmail(normalizedEmail)) {
    return sendError(res, { status: 400, message: "Invalid email format" });
  }

  if (!isStrongPassword(password)) {
    return sendError(res, { status: 400, message: PASSWORD_REQUIREMENTS_MESSAGE });
  }

  let session;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const normalizedBusinessType = normalizeBusinessType(businessType);
    const normalizedSoftwarePlan = normalizeSoftwarePlan(softwarePlan);
    const resolvedOrgName =
      String(orgName || "").trim() || `${normalizedUsername}'s Organization`;
    const resolvedBranchName = String(branchName || "").trim() || "Main Branch";

    const exists = await UserModel.findOne({ email: normalizedEmail }).session(session);
    if (exists) {
      await session.abortTransaction();
      return sendError(res, { status: 409, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserModel({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      isAccountVerified: false,
    });
    await user.save({ session });

    const org = new OrganizationModel({
      name: resolvedOrgName,
      slug: buildOrganizationSlug(resolvedOrgName, user._id),
      ownerId: user._id,
      email: normalizedEmail,
      businessType: normalizedBusinessType,
      softwarePlan: normalizedSoftwarePlan,
      settings: {
        enabledModules: getEnabledModulesForBusinessType(normalizedBusinessType),
      },
    });
    await org.save({ session });

    const primaryBranch = new BranchModel({
      orgId: org._id,
      name: resolvedBranchName,
      code: buildBranchCode(resolvedBranchName, 1),
      businessType: normalizedBusinessType,
      email: normalizedEmail,
      isPrimary: true,
      createdBy: user._id,
    });
    await primaryBranch.save({ session });

    const member = new OrgMemberModel({
      orgId: org._id,
      userId: user._id,
      role: "owner",
      branchId: primaryBranch._id,
      permissions: ["*"],
    });
    await member.save({ session });

    user.currentOrgId = org._id;
    await user.save({ session });

    await session.commitTransaction();
    setAuthCookie(res, user._id, org._id);

    try {
      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: normalizedEmail,
        subject: "Welcome to Our App!",
        html: WELCOME_EMAIL_TEMPLATE.replace("{{username}}", normalizedUsername).replace(
          "{{email}}",
          normalizedEmail
        ),
      });
    } catch (mailError) {
      console.error("Welcome email error:", mailError);
    }

    return sendCreated(
      res,
      {
        orgId: org._id,
        orgName: org.name,
        branchId: primaryBranch._id,
        branchName: primaryBranch.name,
        businessType: org.businessType,
        softwarePlan: org.softwarePlan,
      },
      "Registration successful"
    );
  } catch (error) {
    if (session) {
      await session.abortTransaction().catch(() => {});
    }
    console.error("Register error:", error);
    return sendError(res, { status: 500, message: "Registration failed" });
  } finally {
    session?.endSession();
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return sendError(res, { status: 400, message: "All fields required" });
  }

  try {
    const user = await UserModel.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return sendError(res, { status: 401, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, { status: 401, message: "Invalid credentials" });
    }

    if (!user.currentOrgId) {
      const membership = await OrgMemberModel.findOne({
        userId: user._id,
        isActive: true,
      }).sort({ createdAt: 1 });

      if (membership) {
        user.currentOrgId = membership.orgId;
        await user.save();
      }
    }

    let orgName = null;
    if (user.currentOrgId) {
      const org = await OrganizationModel.findById(user.currentOrgId).select("name");
      orgName = org?.name || null;
    }

    setAuthCookie(res, user._id, user.currentOrgId || null);
    console.log("Login successful for:", normalizedEmail);

    return sendSuccess(res, {
      message: "Login successful",
      data: { orgId: user.currentOrgId || null, orgName },
    });
  } catch (error) {
    console.error("Login error:", error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", getAuthCookieOptions());
    return sendSuccess(res, { message: "Logged out successfully" });
  } catch (error) {
    return sendError(res, { status: 500, message: error.message || "Logout failed" });
  }
};

export const sendVerificationOTP = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await UserModel.findById(userId);

    if (!user) {
      return sendError(res, { status: 404, message: "User not found" });
    }

    if (user.isAccountVerified) {
      return sendError(res, { status: 400, message: "Account already verified" });
    }

    const otp = String(crypto.randomInt(100000, 999999));
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Verify Your Email",
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp),
    });

    return sendSuccess(res, { message: "Verification OTP sent to email" });
  } catch (error) {
    console.error("Send verification OTP error:", error);
    return sendError(res, { status: 500, message: "Failed to send OTP" });
  }
};

export const verifyEmail = async (req, res) => {
  const { otp } = req.body;
  const userId = req.userId;

  if (!userId || !otp) {
    return sendError(res, { status: 400, message: "Missing details" });
  }

  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      return sendError(res, { status: 404, message: "User not found" });
    }

    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      return sendError(res, { status: 400, message: "Invalid OTP" });
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      return sendError(res, { status: 400, message: "OTP expired" });
    }

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;
    await user.save();

    return sendSuccess(res, { message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify email error:", error);
    return sendError(res, { status: 500, message: "Verification failed" });
  }
};

export const isAuthenticated = async (req, res) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return sendError(res, { status: 401, message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return sendError(res, { status: 401, message: "Invalid token" });
    }

    const user = await UserModel.findById(decoded.id).select("-password");

    if (!user) {
      return sendError(res, { status: 404, message: "User not found" });
    }

    if (!user.currentOrgId) {
      const membership = await OrgMemberModel.findOne({
        userId: user._id,
        isActive: true,
      }).sort({ createdAt: 1 });

      if (membership) {
        user.currentOrgId = membership.orgId;
        await user.save();
      }
    }

    const orgId = user.currentOrgId || null;
    let orgName = null;
    let orgBusinessType = "general";
    let orgSoftwarePlan = "single-branch";
    let branchId = null;
    let branchName = null;

    if (orgId) {
      const [org, membership] = await Promise.all([
        OrganizationModel.findById(orgId).select("name businessType softwarePlan"),
        OrgMemberModel.findOne({ orgId, userId: user._id, isActive: true }).select("branchId"),
      ]);

      orgName = org?.name || null;
      orgBusinessType = org?.businessType || "general";
      orgSoftwarePlan = org?.softwarePlan || "single-branch";
      branchId = membership?.branchId || null;

      if (branchId) {
        const branch = await BranchModel.findById(branchId).select("name");
        branchName = branch?.name || null;
      }
    }

    const decodedOrgId = decoded.orgId ? decoded.orgId.toString() : null;
    const currentOrgId = orgId ? orgId.toString() : null;

    if (decodedOrgId !== currentOrgId) {
      setAuthCookie(res, user._id, orgId);
    }

    return sendSuccess(res, {
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAccountVerified: user.isAccountVerified,
        orgId,
        orgName,
        orgBusinessType,
        orgSoftwarePlan,
        branchId,
        branchName,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return sendError(res, { status: 500, message: "Authentication failed" });
  }
};

export const sendRestopt = async (req, res) => {
  try {
    const result = await requestPasswordResetOtp(req.body?.email);

    if (result.error) {
      return sendError(res, { status: result.status || 400, message: result.error });
    }

    return sendSuccess(res, { message: result.message });
  } catch (error) {
    console.error("Send reset OTP error:", error);
    return sendError(res, { status: 500, message: "Failed to send reset OTP" });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !otp || !newPassword) {
    return sendError(res, {
      status: 400,
      message: "Email, OTP, and new password are required",
    });
  }

  if (!isValidEmail(normalizedEmail)) {
    return sendError(res, { status: 400, message: "Invalid email format" });
  }

  if (!isStrongPassword(newPassword)) {
    return sendError(res, { status: 400, message: PASSWORD_REQUIREMENTS_MESSAGE });
  }

  try {
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user || user.resetOtp === "" || user.resetOtp !== otp) {
      return sendError(res, { status: 400, message: "Invalid email or verification code" });
    }

    if (user.resetOtpExpireAt < Date.now()) {
      return sendError(res, { status: 400, message: "Verification code expired" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;
    await user.save();

    return sendSuccess(res, { message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return sendError(res, { status: 500, message: "Password reset failed" });
  }
};

export const forgotPassword = sendRestopt;
