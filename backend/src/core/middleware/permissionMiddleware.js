import OrgMemberModel from "../models/OrgMember.js";
import { ROLE_PERMISSIONS, hasPermission } from "../config/permissions.js";

export const buildEffectivePermissions = (membership) => {
  const rolePerms = ROLE_PERMISSIONS[membership?.role] || [];
  const customPerms = Array.isArray(membership?.permissions) ? membership.permissions : [];

  return [...new Set([...rolePerms, ...customPerms])];
};

const permissionMiddleware = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.orgId) {
        return res.status(403).json({
          success: false,
          message: "Organization context is required",
        });
      }

      const membership = await OrgMemberModel.findOne({
        orgId: req.orgId,
        userId: req.userId,
        isActive: true,
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this organization",
        });
      }

      const allPerms = buildEffectivePermissions(membership);

      if (!hasPermission(allPerms, requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${requiredPermission}`,
        });
      }

      req.membership = membership;
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ success: false, message: "Permission check failed" });
    }
  };
};

export default permissionMiddleware;
