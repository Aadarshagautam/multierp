import mongoose from "mongoose";

const orgMemberSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "manager", "accountant", "cashier", "member", "viewer"],
      default: "member",
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branch",
      default: null,
    },
    permissions: [{ type: String }],
    isActive: {
      type: Boolean,
      default: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// A user can only be in an org once
orgMemberSchema.index({ orgId: 1, userId: 1 }, { unique: true });

const OrgMemberModel = mongoose.model("orgmember", orgMemberSchema);

export default OrgMemberModel;
