import express from "express";
import userAuth from "../middleware/userAuth.js";
import permissionMiddleware from "../middleware/permissionMiddleware.js";
import { getAuditLogs } from "../controllers/auditController.js";

const router = express.Router();

router.get("/", userAuth, permissionMiddleware("audit.read"), getAuditLogs);

export default router;
