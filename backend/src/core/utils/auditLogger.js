import AuditLogModel from "../models/AuditLog.js";
import OrgMemberModel from "../models/OrgMember.js";
import UserModel from "../models/User.js";

const readAuditPath = (source, path) =>
  String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((value, key) => (value == null ? undefined : value[key]), source);

const normalizeAuditValue = (value) => {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();

  if (typeof value === "object") {
    if (typeof value.toString === "function" && value.constructor?.name === "ObjectId") {
      return value.toString();
    }

    if (Array.isArray(value)) {
      return value.map((item) => normalizeAuditValue(item));
    }

    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = normalizeAuditValue(value[key]);
        return result;
      }, {});
  }

  return value;
};

const auditValuesEqual = (left, right) =>
  JSON.stringify(normalizeAuditValue(left)) === JSON.stringify(normalizeAuditValue(right));

export const buildAuditChanges = (before = {}, after = {}, fields = []) => {
  const changes = fields.reduce((result, field) => {
    const oldValue = normalizeAuditValue(readAuditPath(before, field));
    const newValue = normalizeAuditValue(readAuditPath(after, field));

    if (!auditValuesEqual(oldValue, newValue)) {
      result[field] = { old: oldValue, new: newValue };
    }

    return result;
  }, {});

  return Object.keys(changes).length > 0 ? changes : null;
};

/**
 * Log an audit event. Safe to ignore, but awaitable when a caller wants ordering.
 *
 * @param {Object} opts
 * @param {string} opts.action
 * @param {string} opts.module
 * @param {string} [opts.description]
 * @param {string} [opts.targetId]
 * @param {string} [opts.targetName]
 * @param {Object} [opts.changes]
 * @param {Object} [opts.metadata]
 * @param {Object} req
 */
export const logAudit = async (opts, req) => {
  try {
    const [user, membership] = await Promise.all([
      req?.userId ? UserModel.findById(req.userId).select("username") : Promise.resolve(null),
      req?.membership
        ? Promise.resolve(req.membership)
        : req?.userId && req?.orgId
          ? OrgMemberModel.findOne({
              orgId: req.orgId,
              userId: req.userId,
              isActive: true,
            }).select("role branchId")
          : Promise.resolve(null),
    ]);

    await AuditLogModel.create({
      action: opts.action,
      module: opts.module,
      description: opts.description || "",
      targetId: opts.targetId || null,
      targetName: opts.targetName || "",
      changes: opts.changes || null,
      metadata: opts.metadata || null,
      userId: req.userId,
      userName: req.userName || user?.username || "",
      userRole: opts.userRole || req.userRole || membership?.role || "",
      orgId: req.orgId || null,
      branchId: opts.branchId || req.branchId || membership?.branchId || null,
      ipAddress: req.ip || req.connection?.remoteAddress || "",
    });
  } catch (error) {
    // audit must never break app
  }
};
