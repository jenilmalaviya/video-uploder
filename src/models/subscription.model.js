import mongoose, { Schema } from "mongoose";
const subsciptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    chenal: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Subsciption = mongoose.model("subsciption", subsciptionSchema);
