import UserModel from "../models/User.js";
import OrganizationModel from "../models/Organization.js";
import OrgMemberModel from "../models/OrgMember.js";
import BranchModel from "../models/Branch.js";
import { ROLE_PERMISSIONS } from "../config/permissions.js";
import { sendError, sendSuccess } from "../utils/response.js";

export const getUserData = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await UserModel.findById(userId).select('-password');

        if (!user) {
          return sendError(res, { status: 404, message: "User not found" });
        }

        let orgName = null;
        let orgBusinessType = "general";
        let orgSoftwarePlan = "single-branch";
        let role = null;
        let permissions = [];
        let branchId = null;
        let branchName = null;

        if (user.currentOrgId) {
          const [org, membership] = await Promise.all([
            OrganizationModel.findById(user.currentOrgId).select("name businessType softwarePlan"),
            OrgMemberModel.findOne({ orgId: user.currentOrgId, userId: user._id, isActive: true }),
          ]);
          orgName = org?.name || null;
          orgBusinessType = org?.businessType || "general";
          orgSoftwarePlan = org?.softwarePlan || "single-branch";
          role = membership?.role || null;
          branchId = membership?.branchId || null;
          // Merge role defaults with individual overrides
          const rolePerms = ROLE_PERMISSIONS[membership?.role] || [];
          permissions = [...new Set([...rolePerms, ...(membership?.permissions || [])])];

          if (branchId) {
            const branch = await BranchModel.findById(branchId).select("name");
            branchName = branch?.name || null;
          }
        }

        return sendSuccess(res, {
          data: {
            id: user._id,
            username: user.username,
            email: user.email,
            isAccountVerified: user.isAccountVerified,
            orgId: user.currentOrgId || null,
            orgName,
            orgBusinessType: orgBusinessType || "general",
            orgSoftwarePlan,
            branchId,
            branchName,
            role,
            permissions,
          },
        });
      } catch (error) {
        console.error("Get user data error:", error);
        return sendError(res, { status: 500, message: "Failed to get user data" });
      }
}
