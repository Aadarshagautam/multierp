import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "organization", default: null, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "branch", default: null, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    number: { type: Number, required: true },           // Table #1, #2, ...
    name: { type: String, default: "" },                // Optional alias: "Window Seat"
    capacity: { type: Number, default: 4 },
    section: { type: String, default: "Main Hall" },    // Indoor / Outdoor / Terrace
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "cleaning"],
      default: "available",
    },
    currentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "pos_sale",
      default: null,
    },
    reservation: {
      customerName: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      partySize: { type: Number, default: 1, min: 1 },
      reservationAt: { type: Date, default: null },
      notes: { type: String, trim: true, default: "" },
      source: {
        type: String,
        enum: ["walk-in", "phone", "online"],
        default: "phone",
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

tableSchema.index({ orgId: 1, branchId: 1, number: 1 }, { unique: true, sparse: true });

const PosTable = mongoose.model("pos_table", tableSchema);
export default PosTable;
