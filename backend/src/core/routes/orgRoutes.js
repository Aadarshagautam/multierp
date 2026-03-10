import express from "express";
import userAuth from "../middleware/userAuth.js";
import permissionMiddleware from "../middleware/permissionMiddleware.js";
import {
  getOrganization,
  updateOrganization,
  getBranches,
  createBranch,
  getMembers,
  createMember,
  updateMemberRole,
} from "../controllers/orgController.js";

const router = express.Router();

router.get("/", userAuth, permissionMiddleware("settings.read"), getOrganization);
router.put("/", userAuth, permissionMiddleware("settings.update"), updateOrganization);
router.get("/branches", userAuth, permissionMiddleware("settings.read"), getBranches);
router.post("/branches", userAuth, permissionMiddleware("settings.update"), createBranch);
router.get("/members", userAuth, permissionMiddleware("users.read"), getMembers);
router.post("/members", userAuth, permissionMiddleware("users.invite"), createMember);
router.patch("/members/:memberId/role", userAuth, permissionMiddleware("users.update"), updateMemberRole);

export default router;
