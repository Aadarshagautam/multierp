import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "create",
        "update",
        "delete",
        "login",
        "logout",
        "export",
        "import",
        "stage_change",
        "convert",
        "status_change",
        "cancel",
        "refund",
        "adjust",
        "return",
        "open",
        "close",
      ],
    },
    module: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    targetName: {
      type: String,
      default: "",
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    userName: {
      type: String,
      default: "",
    },
    userRole: {
      type: String,
      default: "",
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
      index: true,
      default: null,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branch",
      index: true,
      default: null,
    },
    ipAddress: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ orgId: 1, createdAt: -1 });
auditLogSchema.index({ branchId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ module: 1 });

const AuditLogModel = mongoose.model("auditlog", auditLogSchema);

export default AuditLogModel;
