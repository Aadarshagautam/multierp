import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const CounterModel = mongoose.model("counter", counterSchema);

export default CounterModel;
