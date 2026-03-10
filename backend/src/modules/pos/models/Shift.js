import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "organization", default: null, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "branch", default: null, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, default: null },
    openingCash: { type: Number, default: 0 },    // Cash in drawer at open
    closingCash: { type: Number, default: null },  // Physical cash counted at close
    expectedCash: { type: Number, default: 0 },   // openingCash + cash sales
    cashDifference: { type: Number, default: 0 }, // closingCash - expectedCash
    totalSales: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
    salesByMethod: {
      cash: { type: Number, default: 0 },
      card: { type: Number, default: 0 },
      esewa: { type: Number, default: 0 },
      khalti: { type: Number, default: 0 },
      credit: { type: Number, default: 0 },
      mixed: { type: Number, default: 0 },
    },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

shiftSchema.index({ orgId: 1, branchId: 1, status: 1 });

const Shift = mongoose.model("pos_shift", shiftSchema);
export default Shift;
