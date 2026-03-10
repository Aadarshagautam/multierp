import bcrypt from "bcryptjs";
import OrganizationModel from "../models/Organization.js";
import OrgMemberModel from "../models/OrgMember.js";
import BranchModel from "../models/Branch.js";
import UserModel from "../models/User.js";
import { logAudit } from "../utils/auditLogger.js";
import { sendCreated, sendError, sendSuccess } from "../utils/response.js";
import {
  buildBranchCode,
  getBranchLimitForPlan,
  getEnabledModulesForBusinessType,
  normalizeBusinessType,
} from "../utils/onboarding.js";

const VALID_ROLES = ["owner", "admin", "manager", "accountant", "cashier", "member", "viewer"];
const ASSIGNABLE_ROLES = ["admin", "manager", "accountant", "cashier", "member", "viewer"];

const canManageWholeOrganization = (membership) =>
  ["owner", "admin"].includes(membership?.role);

const normalizeOptionalString = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getPrimaryBranch = async (orgId) =>
  BranchModel.findOne({ orgId, isActive: true }).sort({ isPrimary: -1, createdAt: 1 });

const resolveBranchForOrg = async (orgId, branchId) => {
  if (!branchId) return null;

  const branch = await BranchModel.findOne({ _id: branchId, orgId, isActive: true });
  return branch || null;
};

export const getOrganization = async (req, res) => {
  try {
    if (!req.orgId) {
      return sendError(res, { status: 400, message: "No organization selected" });
    }

    const org = await OrganizationModel.findById(req.orgId);
    if (!org) {
      return sendError(res, { status: 404, message: "Organization not found" });
    }

    return sendSuccess(res, { data: org });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const updateOrganization = async (req, res) => {
  try {
    if (!req.orgId) {
      return sendError(res, { status: 400, message: "No organization selected" });
    }

    const org = await OrganizationModel.findById(req.orgId);
    if (!org) {
      return sendError(res, { status: 404, message: "Organization not found" });
    }

    const {
      name,
      phone,
      email,
      gstin,
      currency,
      financialYearStart,
      invoicePrefix,
      address,
      businessType,
    } = req.body;

    if (name) org.name = name;
    if (phone !== undefined) org.phone = phone;
    if (email !== undefined) org.email = email;
    if (gstin !== undefined) org.gstin = gstin;
    if (currency) org.currency = currency;
    if (financialYearStart) org.financialYearStart = financialYearStart;
    if (invoicePrefix) org.invoicePrefix = invoicePrefix;
    if (address) org.address = address;

    if (businessType) {
      const normalizedBusinessType = normalizeBusinessType(businessType);
      org.businessType = normalizedBusinessType;
      org.settings.enabledModules = getEnabledModulesForBusinessType(normalizedBusinessType);

      await BranchModel.updateMany(
        { orgId: req.orgId },
        { $set: { businessType: normalizedBusinessType } }
      );
    }

    await org.save();
    logAudit(
      {
        action: "update",
        module: "settings",
        targetId: org._id,
        targetName: org.name,
        description: "Updated company settings",
      },
      req
    );

    return sendSuccess(res, { data: org, message: "Organization updated" });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const getBranches = async (req, res) => {
  try {
    if (!req.orgId) {
      return sendError(res, { status: 400, message: "No organization selected" });
    }

    const filter = { orgId: req.orgId };
    if (!canManageWholeOrganization(req.membership) && req.membership?.branchId) {
      filter._id = req.membership.branchId;
    }

    const branches = await BranchModel.find(filter).sort({ isPrimary: -1, createdAt: 1 });
    return sendSuccess(res, { data: branches });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const createBranch = async (req, res) => {
  try {
    if (!req.orgId) {
      return sendError(res, { status: 400, message: "No organization selected" });
    }

    const name = normalizeOptionalString(req.body.name);
    if (!name) {
      return sendError(res, { status: 400, message: "Branch name is required" });
    }

    const org = await OrganizationModel.findById(req.orgId).select("businessType softwarePlan");
    if (!org) {
      return sendError(res, { status: 404, message: "Organization not found" });
    }

    const existingCount = await BranchModel.countDocuments({ orgId: req.orgId });
    const branchLimit = getBranchLimitForPlan(org.softwarePlan);
    if (existingCount >= branchLimit) {
      return sendError(res, {
        status: 400,
        message:
          org.softwarePlan === "single-branch"
            ? "Your current plan supports only one branch"
            : "Your current plan has reached its branch limit",
      });
    }

    const branch = new BranchModel({
      orgId: req.orgId,
      name,
      code: normalizeOptionalString(req.body.code) || buildBranchCode(name, existingCount + 1),
      businessType: org.businessType,
      phone: normalizeOptionalString(req.body.phone),
      email: normalizeOptionalString(req.body.email),
      address: req.body.address || undefined,
      createdBy: req.userId,
    });

    await branch.save();

    logAudit(
      {
        action: "create",
        module: "settings",
        targetId: branch._id,
        targetName: branch.name,
        description: `Created branch ${branch.name}`,
      },
      req
    );

    return sendCreated(res, branch, "Branch created");
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const getMembers = async (req, res) => {
  try {
    if (!req.orgId) {
      return sendError(res, { status: 400, message: "No organization selected" });
    }

    const filter = { orgId: req.orgId };
    if (!canManageWholeOrganization(req.membership) && req.membership?.branchId) {
      filter.$or = [
        { branchId: req.membership.branchId },
        { role: "owner" },
        { role: "admin" },
      ];
    }

    const members = await OrgMemberModel.find(filter).sort({ role: 1, createdAt: 1 });
    const userIds = members.map((member) => member.userId);
    const branchIds = members
      .map((member) => member.branchId)
      .filter(Boolean);

    const [users, branches] = await Promise.all([
      UserModel.find({ _id: { $in: userIds } }).select("username email"),
      BranchModel.find({ _id: { $in: branchIds } }).select("name"),
    ]);

    const userMap = {};
    users.forEach((user) => {
      userMap[user._id.toString()] = user;
    });

    const branchMap = {};
    branches.forEach((branch) => {
      branchMap[branch._id.toString()] = branch;
    });

    const result = members.map((member) => ({
      _id: member._id,
      userId: member.userId,
      username: userMap[member.userId.toString()]?.username || "Unknown",
      email: userMap[member.userId.toString()]?.email || "",
      role: member.role,
      branchId: member.branchId || null,
      branchName: member.branchId ? branchMap[member.branchId.toString()]?.name || "" : "",
      permissions: member.permissions,
      isActive: member.isActive,
      createdAt: member.createdAt,
    }));

    return sendSuccess(res, { data: result });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const createMember = async (req, res) => {
  try {
    if (!req.orgId) {
      return sendError(res, { status: 400, message: "No organization selected" });
    }

    const username = normalizeOptionalString(req.body.username);
    const email = normalizeOptionalString(req.body.email).toLowerCase();
    const password = normalizeOptionalString(req.body.password);
    const role = normalizeOptionalString(req.body.role);

    if (!username || !email || !role) {
      return sendError(res, { status: 400, message: "Username, email, and role are required" });
    }

    if (!ASSIGNABLE_ROLES.includes(role)) {
      return sendError(res, { status: 400, message: "Invalid role" });
    }

    if (!isValidEmail(email)) {
      return sendError(res, { status: 400, message: "Invalid email format" });
    }

    const requestedBranchId = req.body.branchId || null;
    let branch = null;

    if (requestedBranchId) {
      branch = await resolveBranchForOrg(req.orgId, requestedBranchId);
      if (!branch) {
        return sendError(res, { status: 400, message: "Selected branch was not found" });
      }
    } else {
      branch = await getPrimaryBranch(req.orgId);
    }

    let user = await UserModel.findOne({ email });
    if (user) {
      const existingMembership = await OrgMemberModel.findOne({ orgId: req.orgId, userId: user._id });
      if (existingMembership) {
        return sendError(res, { status: 409, message: "This user is already part of the organization" });
      }
    } else {
      if (!password || password.length < 8) {
        return sendError(res, {
          status: 400,
          message: "New staff accounts require a password of at least 8 characters",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user = new UserModel({
        username,
        email,
        password: hashedPassword,
        isAccountVerified: false,
        currentOrgId: req.orgId,
      });
      await user.save();
    }

    if (!user.currentOrgId) {
      user.currentOrgId = req.orgId;
      await user.save();
    }

    const member = new OrgMemberModel({
      orgId: req.orgId,
      userId: user._id,
      role,
      branchId: branch?._id || null,
      permissions: [],
      invitedBy: req.userId,
    });

    await member.save();

    logAudit(
      {
        action: "create",
        module: "settings",
        targetId: member.userId,
        description: `Added ${email} as ${role}${branch?.name ? ` for ${branch.name}` : ""}`,
      },
      req
    );

    return sendCreated(
      res,
      {
        _id: member._id,
        userId: user._id,
        username: user.username,
        email: user.email,
        role: member.role,
        branchId: member.branchId,
        branchName: branch?.name || "",
        isActive: member.isActive,
        createdAt: member.createdAt,
      },
      "Team member added"
    );
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};

export const updateMemberRole = async (req, res) => {
  try {
    if (!req.orgId) {
      return sendError(res, { status: 400, message: "No organization selected" });
    }

    const { memberId } = req.params;
    const { role } = req.body;

    if (!VALID_ROLES.includes(role)) {
      return sendError(res, { status: 400, message: "Invalid role" });
    }

    const member = await OrgMemberModel.findOne({ _id: memberId, orgId: req.orgId });
    if (!member) {
      return sendError(res, { status: 404, message: "Member not found" });
    }

    if (member.role === "owner" || role === "owner") {
      return sendError(res, { status: 400, message: "Owner role cannot be reassigned here" });
    }

    const oldRole = member.role;
    const oldBranchId = member.branchId ? member.branchId.toString() : null;

    member.role = role;

    if (Object.prototype.hasOwnProperty.call(req.body, "branchId")) {
      const nextBranchId = req.body.branchId || null;
      if (nextBranchId) {
        const branch = await resolveBranchForOrg(req.orgId, nextBranchId);
        if (!branch) {
          return sendError(res, { status: 400, message: "Selected branch was not found" });
        }
        member.branchId = branch._id;
      } else {
        member.branchId = null;
      }
    }

    await member.save();

    logAudit(
      {
        action: "update",
        module: "settings",
        targetId: member.userId,
        description: `Changed role from ${oldRole} to ${role}`,
        changes: {
          role: { old: oldRole, new: role },
          branchId: {
            old: oldBranchId,
            new: member.branchId ? member.branchId.toString() : null,
          },
        },
      },
      req
    );

    return sendSuccess(res, { data: member, message: "Member role updated" });
  } catch (error) {
    console.error(error);
    return sendError(res, { status: 500, message: "Server error" });
  }
};
